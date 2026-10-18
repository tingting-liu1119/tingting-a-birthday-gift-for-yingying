import { MUSIC } from './content.js';

// One streaming element owns the whole-song loop. Playback does not depend on
// animation frames, a second decoder, or another autoplay permission at the end.
export class Soundtrack {
  constructor(onStatus = () => {}) {
    this.onStatus=onStatus;this.playing=false;this.muted=false;this.energy=0;this.duck=1;this.request=0;
    this.player=new Audio();
    this.player.preload='metadata';this.player.playsInline=true;this.player.loop=true;this.player.src=MUSIC.src;
    this.player.addEventListener('error',()=>{
      if(!this.mp3Fallback){
        this.mp3Fallback=true;this.player.src='assets/audio/pxyz.mp3';
        if(this.playing)void this.start();
      }else{this.pause();this.onStatus('unavailable');}
    });
    // Native loop normally prevents ended; retain a guarded recovery for media
    // engines that still emit it. An explicit user pause must never restart.
    this.player.addEventListener('ended',()=>{
      if(this.playing){this.player.currentTime=0;void this.start();}
    });
  }
  async unlock() {
    if(!this.context){
      let context,source,master;
      try {
        const AudioContext=window.AudioContext||window.webkitAudioContext;
        context=new AudioContext();master=context.createGain();master.gain.value=this.muted?0:.75*this.duck;
        source=context.createMediaElementSource(this.player);source.connect(master);master.connect(context.destination);
        this.context=context;this.master=master;
      }catch{
        source?.disconnect();master?.disconnect();void context?.close().catch(()=>{});
        this.context=null;this.master=null;
      }
    }
    if(this.context&&this.context.state!=='running'&&this.context.state!=='closed')await this.context.resume();
  }
  async start(reset=false) {
    const request=++this.request;
    if(reset){this.player.pause();this.player.currentTime=0;}
    this.playing=true;this.applyVolumes();
    try {
      // Invoke play in the original gesture, before awaiting AudioContext.resume.
      await Promise.all([this.unlock(),this.player.play()]);
      if(request!==this.request)return;
      this.applyVolumes();this.onStatus('playing');
    }catch{
      if(request!==this.request)return;
      this.playing=false;this.player.pause();this.onStatus('blocked');
    }
  }
  pause(){this.request++;this.playing=false;this.player.pause();}
  toggleMute(){this.muted=!this.muted;this.applyVolumes();return this.muted;}
  setDuck(value){this.duck=value;this.applyVolumes();}
  applyVolumes() {
    // Some mobile browsers ignore element.volume. Without Web Audio, mute
    // during microphone input so music cannot masquerade as a breath.
    this.player.muted=this.muted||(!this.master&&this.duck<1);
    if(this.master){
      this.player.volume=1;
      this.master.gain.setTargetAtTime(this.muted?0:.75*this.duck,this.context.currentTime,.15);
    }else this.player.volume=.75;
  }
  update() {
    if(!this.playing)return;
    if(this.envelope){const e=this.envelope[Math.floor(this.player.currentTime)]||0;this.energy+=(e-this.energy)*.04;}
  }
  async loadEnvelope(){try{this.envelope=(await(await fetch('docs/audio-analysis.json')).json()).normalizedEnergy;}catch{/* Audio visualization is optional. */}}
}
