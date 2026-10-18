import { MUSIC } from './content.js';

// Streaming media avoids decoding the whole song into mobile memory.
export class Soundtrack {
  constructor(onStatus = () => {}) {
    this.onStatus=onStatus; this.active=0; this.playing=false; this.muted=false; this.fade=null; this.energy=0;this.duck=1;
    this.players=[0,1].map(()=>{const a=new Audio();a.preload='metadata';a.playsInline=true;a.src=MUSIC.src;a.addEventListener('error',()=>{if(!a.src.endsWith('.mp3')){a.src='assets/audio/pxyz.mp3';if(this.playing)a.play().catch(()=>this.onStatus('blocked'));}else this.onStatus('unavailable');});return a;});
  }
  async unlock() {
    if(!this.context){
      try {
        const AudioContext=window.AudioContext||window.webkitAudioContext;
        this.context=new AudioContext();this.master=this.context.createGain();this.master.gain.value=this.muted?0:.75;
        this.master.connect(this.context.destination);
        this.gains=this.players.map((a,i)=>{const source=this.context.createMediaElementSource(a),gain=this.context.createGain();gain.gain.value=i===this.active?1:0;source.connect(gain);gain.connect(this.master);return gain;});
      } catch {this.context=null;this.players.forEach(a=>a.loop=true);}
    }
    if(this.context&&this.context.state!=='running'&&this.context.state!=='closed')await this.context.resume();
  }
  async start(reset=false) {
    // All play calls originate from the enter/continue user gesture.
    const unlocking=this.unlock();
    if(reset){this.fade=null;this.active=0;this.players.forEach(a=>{a.pause();a.currentTime=0;});}
    this.playing=true;
    try {
      await unlocking;
      this.applyVolumes();
      if(!this.primed&&this.context){
        await Promise.all(this.players.map(a=>a.play()));
        this.players[1-this.active].pause();this.primed=true;
      } else await Promise.all(this.players.filter((_,i)=>i===this.active||this.fade).map(a=>a.play()));
      this.onStatus('playing');
    } catch {this.onStatus('blocked');}
  }
  pause() {this.playing=false;this.players.forEach(a=>a.pause());}
  toggleMute(){this.muted=!this.muted;this.applyVolumes();return this.muted;}
  setDuck(value){this.duck=value;this.applyVolumes();}
  applyVolumes() {
    if(this.master){this.master.gain.setTargetAtTime(this.muted?0:.75*this.duck,this.context.currentTime,.15);this.gains.forEach((g,i)=>{g.gain.value=this.fade?g.gain.value:(i===this.active?1:0);});}
    else this.players.forEach((a,i)=>{a.muted=this.muted||i!==this.active||this.duck<1;});
  }
  update() {
    if(!this.playing)return;
    const current=this.players[this.active],duration=current.duration;
    if(this.context&&Number.isFinite(duration)&&duration>10&&!this.fade&&current.currentTime>=duration-MUSIC.crossfade){
      const next=this.players[1-this.active];next.currentTime=MUSIC.loopStart;
      this.fade={start:current.currentTime,from:this.active,to:1-this.active};
      next.play().catch(()=>{this.fade=null;current.currentTime=MUSIC.loopStart;current.play().catch(()=>this.onStatus('blocked'));});
    }
    if(this.fade){
      const {start,from,to}=this.fade,t=Math.min(1,(this.players[from].currentTime-start)/MUSIC.crossfade);
      this.gains[from].gain.value=Math.cos(t*Math.PI/2);this.gains[to].gain.value=Math.sin(t*Math.PI/2);
      if(t>=.995||this.players[from].ended){this.players[from].pause();this.active=to;this.fade=null;this.applyVolumes();}
    }
    if(this.envelope){const e=this.envelope[Math.floor(this.players[this.active].currentTime)]||0;this.energy+=(e-this.energy)*.04;}
  }
  async loadEnvelope(){try{this.envelope=(await(await fetch('docs/audio-analysis.json')).json()).normalizedEnergy;}catch{/* Audio visualization is optional. */}}
}
