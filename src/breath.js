// Microphone samples stay in memory, are never recorded and never leave this page.
export function breathFeatures(samples,spectrum,sampleRate){
  let square=0,total=0,high=0,logPower=0,bins=0;
  for(const x of samples)square+=x*x;
  for(let i=2;i<spectrum.length;i++){
    const hz=i*sampleRate/(spectrum.length*2);if(hz>8500)break;
    const power=Math.pow(10,spectrum[i]/10);total+=power;
    if(hz>700)high+=power;
    if(hz>200){logPower+=Math.log(Math.max(1e-12,power));bins++;}
  }
  return {rms:Math.sqrt(square/samples.length),high:high/Math.max(total,1e-12),flatness:Math.exp(logPower/Math.max(1,bins))/(total/Math.max(1,bins)+1e-12)};
}
export class BreathAccumulator {
  constructor(){this.progress=0;this.noise=.006;this.calibration=0;}
  sample(features,dt){
    if(this.calibration<.65){this.noise=Math.min(.045,this.noise*.88+features.rms*.12);this.calibration+=dt;return 0;}
    const threshold=Math.max(.045,this.noise*2.6+.018);
    const active=features.rms>threshold&&(features.flatness>.09||features.high>.20);
    this.progress=Math.max(0,Math.min(1,this.progress+dt*(active?1/0.65:-1.5)));
    return this.progress;
  }
}
export class BreathInput {
  constructor({onStatus=()=>{},onLevel=()=>{},onBlow=()=>{}}={}){Object.assign(this,{onStatus,onLevel,onBlow});this.token=0;this.active=false;}
  async start(){
    this.stop();const token=this.token;this.active=true;this.onStatus('requesting');
    try{
      if(!navigator.mediaDevices?.getUserMedia||!window.isSecureContext)throw new Error('unsupported');
      const AC=window.AudioContext||window.webkitAudioContext;
      const context=new AC();this.context=context;const unlock=context.resume();
      const stream=await navigator.mediaDevices.getUserMedia({video:false,audio:{echoCancellation:true,noiseSuppression:false,autoGainControl:false}});
      if(token!==this.token){stream.getTracks().forEach(t=>t.stop());return;}
      this.stream=stream;await unlock;if(token!==this.token)return;
      const source=context.createMediaStreamSource(stream),analyser=context.createAnalyser();
      analyser.fftSize=2048;analyser.smoothingTimeConstant=.25;source.connect(analyser);this.source=source;
      const samples=new Float32Array(analyser.fftSize),spectrum=new Float32Array(analyser.frequencyBinCount),detector=new BreathAccumulator();
      this.onStatus('calibrating');let previous=performance.now(),started=previous,ready=false;
      const tick=now=>{
        if(token!==this.token)return;
        const dt=Math.min(.08,(now-previous)/1000);previous=now;
        analyser.getFloatTimeDomainData(samples);analyser.getFloatFrequencyData(spectrum);
        const progress=detector.sample(breathFeatures(samples,spectrum,context.sampleRate),dt);this.onLevel(progress);
        if(detector.calibration>=.65&&!ready){ready=true;this.onStatus('listening');}
        if(progress>=1){this.stop();this.onBlow();return;}
        if(now-started>45000){this.stop();this.onStatus('timeout');return;}
        this.raf=requestAnimationFrame(tick);
      };this.raf=requestAnimationFrame(tick);
    }catch(error){if(token===this.token){this.stop();this.onStatus(error.name==='NotAllowedError'?'denied':error.message==='unsupported'?'unsupported':'unavailable');}}
  }
  stop(){
    this.token++;this.active=false;cancelAnimationFrame(this.raf);
    this.stream?.getTracks().forEach(t=>t.stop());this.stream=null;this.source?.disconnect();this.source=null;
    this.context?.close().catch(()=>{});this.context=null;this.onLevel(0);
  }
}
