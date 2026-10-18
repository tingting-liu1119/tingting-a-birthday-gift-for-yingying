const vertex = `
precision highp float;
attribute vec3 aPosition;
attribute vec3 aOrigin;
attribute vec4 aStyle;
uniform vec2 uResolution, uOffset, uLetterSize, uLook;
uniform float uTime, uCamera, uRotation, uIntensity, uMorph, uDpr, uTravel, uStretch, uTilt, uAwake, uFlow, uObjectScale, uLetter;
uniform mediump float uMode, uFlight;
varying mediump vec4 vColor;
varying mediump vec2 vDirection;
varying mediump float vSpark;
vec3 galaxy(vec3 p) {
  float r=length(p.xy);
  float theta=atan(p.y,p.x)+uTime*(.012+.0035*sin(r*1.7))*uFlow;
  theta+=.025*sin(theta*3.0+uTime*.17+r);
  r+=.075*sin(theta*5.0-uTime*.23)+.035*sin(uTime*.35);
  r*=1.0+(1.0-uAwake)*.22;
  vec3 g=vec3(cos(theta)*r,sin(theta)*r,p.z);
  g.z-=g.y*sqrt(max(.0,1.0-uTilt*uTilt));
  g.y*=uTilt;
  g=vec3(g.x*cos(uLook.x)+g.z*sin(uLook.x),g.y,-g.x*sin(uLook.x)+g.z*cos(uLook.x));
  g.xy=mat2(cos(uRotation),-sin(uRotation),sin(uRotation),cos(uRotation))*g.xy;
  return g;
}
void main(){
  vec3 p=aPosition;
  float aspect=uResolution.x/uResolution.y;
  if(uMode<1.5)p=galaxy(p);
  if(uMode>1.5&&uMode<2.5)p.z=mod(p.z+uTravel+8.0,16.0)-8.0;
  if((uMode>2.5&&uMode<3.5)||(uMode>4.5&&uMode<5.5)){
    vec3 target=p*uObjectScale;
    if(uMode>4.5){target=vec3(p.x,p.y*.96+p.z*.32,p.z*.94-p.y*.2)*uObjectScale;}
    vec3 source=galaxy(aOrigin);
    float wave=sin(uMorph*3.14159)*.16;
    p=mix(source,target,uMorph)+vec3(sin(aStyle.z*21.0),cos(aStyle.z*31.0),sin(aStyle.z*11.0))*wave;
  }
  float depth=max(2.0,uCamera-p.z);
  vec2 projected=p.xy*2.15/depth;
  projected.x*=min(1.0,aspect/1.24)/aspect*uStretch;
  projected+=uOffset;
  if(uMode>6.5){
    vec2 edge=aPosition.xy*uLetterSize;
    // The candle arrives at the crown's central star; dust opens outwards,
    // leaving a quiet reading column instead of tracing a rectangular sheet.
    vec2 source=vec2(0.0,uLetterSize.y-76.0/uResolution.y);
    float unfurl=smoothstep(0.0,1.0,clamp((uLetter-aStyle.z*.18)/.82,0.0,1.0));
    vec2 drift=vec2(sin(aStyle.z*51.0+uTime*.18),cos(aStyle.z*31.0+uTime*.12));
    projected=mix(source,edge,unfurl)+drift*(sin(unfurl*3.14159)*.08+unfurl*.008);
    depth=13.0;
  }
  gl_Position=vec4(projected,0.0,1.0);
  vDirection=normalize(projected+vec2(.0001));
  float size=aStyle.x*12.0/depth;
  if(uMode>6.5)size*=mix(.30,1.0,uLetter);
  if(uMode>1.5&&uMode<2.5)size*=1.0+uFlight*5.0;
  gl_PointSize=clamp(size*uDpr,.65,180.0);
  vSpark=step(4.5,aStyle.x)*step(1.5,uMode)*step(uMode,2.5);
  float shimmer=.88+.12*sin(uTime*(.55+aStyle.z)+aStyle.z*100.0);
  float alpha=aStyle.y*shimmer*uIntensity;
  if(uMode<1.5||uMode>2.5&&uMode<3.5||uMode>4.5&&uMode<5.5)alpha*=uAwake;
  vec3 color=mix(vec3(.83,.85,.86),vec3(1.0,.93,.80),aStyle.w);
  vColor=vec4(color,alpha);
}`;
const fragment=`
precision mediump float;
varying mediump vec4 vColor;
varying mediump vec2 vDirection;
varying mediump float vSpark;
uniform mediump float uMode, uFlight;
void main(){
  vec2 q=gl_PointCoord-.5;
  if(uMode>1.5&&uMode<2.5)q=vec2(dot(q,vec2(-vDirection.y,vDirection.x))*(1.0+uFlight*5.0),dot(q,vDirection));
  float r=length(q)*2.0;
  if(r>1.0)discard;
  float alpha=(exp(-r*r*7.0)+exp(-r*r*3.0)*.16)*(1.0-smoothstep(.65,1.0,r))*vColor.a;
  if(uMode>.5&&uMode<1.5)alpha=exp(-r*r*4.0)*(1.0-smoothstep(.4,1.0,r))*vColor.a;
  if(uMode>5.5&&uMode<6.5){
    float cross=(exp(-abs(q.x)*170.0)*exp(-abs(q.y)*8.0)+exp(-abs(q.y)*170.0)*exp(-abs(q.x)*8.0))*.18;
    alpha=(exp(-r*r*160.0)+.055*exp(-r*r*3.0)+cross)*(1.0-smoothstep(.7,1.0,r))*vColor.a;
  }
  if(vSpark>.5){alpha+=(exp(-abs(q.x)*110.0)*exp(-abs(q.y)*7.0)+exp(-abs(q.y)*110.0)*exp(-abs(q.x)*7.0))*.12*vColor.a;}
  gl_FragColor=vec4(vColor.rgb,alpha);
}`;
export function random(seed = 1487) {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}
const mix = (a,b,t) => a + (b-a)*t;
const smooth = (a,b,x) => { const t = Math.max(0,Math.min(1,(x-a)/(b-a))); return t*t*(3-2*t); };

export class Universe {
  constructor(canvas, { reduced = false, onFallback = () => {} } = {}) {
    this.canvas = canvas; this.reduced = reduced; this.onFallback = onFallback;
    this.time = 0; this.motion = 0; this.scene = 'landing'; this.progress = 0; this.dim = 1;
    this.camera = 16.5; this.rotation = -.32; this.tilt=.54; this.offset = [0, .08]; this.quality = 1; this.elapsed=0; this.flow=1;
    this.view=[0,0];this.look=[0,0];this.distance=0;this.zoomed=0;this.breath=0;
    this.mobile = matchMedia('(max-width: 700px)').matches || (matchMedia('(pointer: coarse)').matches && Math.min(innerWidth,innerHeight)<700);
    try {
      this.gl = canvas.getContext('webgl', { alpha: false, antialias: false, powerPreference: 'low-power', depth: false, stencil: false, preserveDrawingBuffer: false });
      if(!this.gl) throw new Error('WebGL unavailable');
      this.init();
    } catch(error) { this.fallback(error); }
    canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); this.fallback(new Error('WebGL context lost')); });
    this.resize = this.resize.bind(this); window.addEventListener('resize',this.resize); this.resize();
  }
  fallback(error) {
    console.info('Using accessible universe fallback:', error.message);
    this.failed = true; this.canvas.hidden = true; document.documentElement.classList.add('no-webgl'); this.onFallback();
  }
  init() {
    const gl=this.gl;
    const compile=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;};
    const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
    this.program=gl.createProgram();gl.attachShader(this.program,vs);gl.attachShader(this.program,fs);gl.linkProgram(this.program);
    if(!gl.getProgramParameter(this.program,gl.LINK_STATUS)) throw Error(gl.getProgramInfoLog(this.program));
    gl.deleteShader(vs);gl.deleteShader(fs);gl.useProgram(this.program);
    this.attributes=['aPosition','aStyle','aOrigin'].map(n=>gl.getAttribLocation(this.program,n));
    this.u=Object.fromEntries(['Resolution','Time','Camera','Rotation','Intensity','Mode','Morph','Dpr','Offset','Travel','Flight','Stretch','Tilt','Awake','Flow','ObjectScale','Letter','LetterSize','Look'].map(n=>[n,gl.getUniformLocation(this.program,'u'+n)]));
    gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE);gl.disable(gl.DEPTH_TEST);
    const rand=random(); const normal=()=>Math.sqrt(-2*Math.log(Math.max(.00001,rand())))*Math.cos(6.283*rand());
    // 360° 闭合的体积环带。暗尘缝与亮结保留不规则性，角度没有截断。
    const ringPoint=()=>{
      const theta=rand()*Math.PI*2,filament=Math.floor(rand()*7),layer=rand();
      const wave=Math.sin(theta*2+filament*.14)*.20+Math.sin(theta*9+filament)*.10;
      const core=5.70+Math.sin(theta*3)*.14;
      let r=core+wave+(filament-3)*.12+normal()*(layer<.28?.24:.72);
      if(layer>.85)r=6.6+(filament-3)*.28+Math.sin(theta*3+filament*.3)*.35+normal()*.40;
      r=Math.max(3.6,r);
      return [Math.cos(theta)*r,Math.sin(theta)*r,normal()*(.045+Math.abs(r-core)*.28)];
    };
    this.ringPoint=ringPoint;
    const makeBand=(n,cloud=false)=>{
      const positions=[],styles=[];
      for(let i=0;i<n;i++){
        const point=ringPoint(),theta=Math.atan2(point[1],point[0]),r=Math.hypot(point[0],point[1]);
        const cluster=.38+.62*Math.pow(.5+.5*Math.sin(theta*4+r*3.8),1.5);
        const lane=.12+.88*smooth(-.35,.30,Math.sin(theta*2.2+r*12+.4*Math.sin(theta*7)));
        const spine=Math.exp(-Math.pow((r-5.7-Math.sin(theta*3)*.12)/.26,2));
        const bright=Math.pow(rand(),3.2);
        positions.push(...point);
        const lighting=.7+.6*Math.max(0,-Math.sin(theta));
        styles.push(cloud?15+rand()*43:.65+bright*2.05,cloud?(.009+spine*.007)*cluster:(.22+bright*.8+spine*.1)*cluster*lane*lighting,rand(),rand()>.985?.60:rand()*.09);
      }
      return this.buffer(positions,styles,cloud?1:0);
    };
    this.band=makeBand(this.mobile?340000:620000);this.cloud=makeBand(this.mobile?15000:26000,true);
    const p=[],s=[];
    for(let i=0;i<(this.mobile?6500:11000);i++) {
      p.push((rand()-.5)*34,(rand()-.5)*23,(rand()-.5)*13);
      const b=Math.pow(rand(),7);s.push(i%93===0?5+rand()*8:.55+b*3.0,.09+b*.7,rand(),rand()*.28);
    }
    this.stars=this.buffer(p,s,2);
    this.numbers=this.createNumbers(rand);
    this.cake=this.createCake(rand);
    this.candle=this.buffer(new Float32Array(3*180),new Float32Array(4*180),6,true);
    this.letter=this.createLetter(rand);
    this.orbits=this.buffer(new Float32Array(3*1300),new Float32Array(4*1300),4,true);
  }
  buffer(positions,styles,mode,dynamic=false,origins=null) {
    const gl=this.gl;
    const upload=(arr)=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),dynamic?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);return b;};
    return { position:upload(positions),style:upload(styles),origin:origins?upload(origins):null,count:positions.length/3,mode,positions:new Float32Array(positions),styles:new Float32Array(styles) };
  }
  createNumbers(rand) {
    const c=document.createElement('canvas');c.width=1000;c.height=300;const ctx=c.getContext('2d');
    ctx.fillStyle='white';ctx.font='200 240px Georgia, serif';ctx.textAlign='center';ctx.fillText('3016',500,240);
    const data=ctx.getImageData(0,0,1000,300).data,p=[],s=[];
    for(let y=15;y<280;y+=2)for(let x=60;x<940;x+=2)if(data[(y*1000+x)*4+3]>100&&rand()>.12){p.push((x-500+rand()*2-1)/100,(150-y+rand()*2-1)/100+.5,(rand()-.5)*.14);s.push(.8+rand()*1.3,.3+rand()*.6,rand(),.12);}
    const origins=p.flatMap((_,i)=>i%3===0?this.ringPoint():[]);
    return this.buffer(p,s,3,false,origins);
  }
  createCake(rand){
    const p=[],s=[],origins=[],n=this.mobile?19000:32000;
    for(let i=0;i<n;i++){
      const tier=rand()<.57?0:1, radius=tier?1.80:2.85, bottom=tier?-.62:-1.8, top=tier?.44:-.62;
      const theta=rand()*Math.PI*2,part=rand();let x,y,z;
      if(part<.48){x=Math.cos(theta)*radius;y=mix(bottom,top,rand());z=Math.sin(theta)*radius;}
      else if(part<.76){const r=radius*Math.sqrt(rand());x=Math.cos(theta)*r;y=top;z=Math.sin(theta)*r;}
      else if(part<.985){const r=radius+(rand()-.5)*.045;x=Math.cos(theta)*r;y=rand()<.65?top:bottom;z=Math.sin(theta)*r;}
      else {const r=.055;x=Math.cos(theta)*r;y=.44+rand()*1.05;z=Math.sin(theta)*r;}
      p.push(x+(rand()-.5)*.015,y+(rand()-.5)*.015,z);
      s.push(.67+Math.pow(rand(),3)*1.4,part>.76?.62:.27+rand()*.36,rand(),.2+rand()*.2);
      origins.push(...this.ringPoint());
    }
    return this.buffer(p,s,5,false,origins);
  }
  createLetter(rand){
    const p=[],s=[];
    for(let i=0;i<7600;i++){
      const t=rand(),side=rand()<.5?-1:1,filament=Math.floor(rand()*4);
      const spread=(rand()+rand()+rand()-1.5)*(.12+.16*t);
      const x=side*(.08+Math.pow(Math.sin(t*Math.PI*.5),.70)*1.02+filament*.035)+spread;
      const y=.91-t*1.97+Math.sin(t*14+filament)*.026+(rand()-.5)*.055;
      const mist=i%21===0,bright=Math.pow(rand(),4);
      p.push(x,y,0);
      s.push(mist?14+rand()*23:.65+bright*2.3,mist?.025:.14+bright*.64,rand(),.16);
    }
    return this.buffer(p,s,7);
  }
  resize() {
    this.width=this.canvas.clientWidth||innerWidth;this.height=this.canvas.clientHeight||innerHeight;
    this.dpr=Math.min(devicePixelRatio||1,this.mobile?1.5:1.6)*this.quality;
    this.canvas.width=Math.round(this.width*this.dpr);this.canvas.height=Math.round(this.height*this.dpr);
    if(!this.failed)this.gl.viewport(0,0,this.canvas.width,this.canvas.height);
  }
  setScene(scene,progress=0,elapsed=0) { this.scene=scene;this.progress=progress;this.elapsed=elapsed; }
  orbit(dx,dy){this.view[0]=Math.max(-.62,Math.min(.62,this.view[0]+dx*2));this.view[1]=Math.max(-.22,Math.min(.30,this.view[1]-dy*.85));}
  zoom(delta){this.distance=Math.max(-3.7,Math.min(5,this.distance+delta));}
  resetView(){this.view=[0,0];this.distance=0;}
  drawBuffer(buffer,intensity=1,morph=1) {
    const gl=this.gl;
    for(const [i,field] of ['position','style'].entries()) {gl.bindBuffer(gl.ARRAY_BUFFER,buffer[field]);gl.enableVertexAttribArray(this.attributes[i]);gl.vertexAttribPointer(this.attributes[i],i===0?3:4,gl.FLOAT,false,0,0);}
    if(buffer.origin){gl.bindBuffer(gl.ARRAY_BUFFER,buffer.origin);gl.enableVertexAttribArray(this.attributes[2]);gl.vertexAttribPointer(this.attributes[2],3,gl.FLOAT,false,0,0);}
    else {gl.disableVertexAttribArray(this.attributes[2]);gl.vertexAttrib3f(this.attributes[2],0,0,0);}
    gl.uniform1f(this.u.Mode,buffer.mode);gl.uniform1f(this.u.Intensity,intensity*this.dim);gl.uniform1f(this.u.Morph,morph);
    gl.drawArrays(gl.POINTS,0,Math.round(buffer.count*(buffer.mode===0?this.quality*(this.density||.86):1)));
  }
  render(dt,{paused=false,reading=false,energy=0}={}) {
    this.time+=dt;
    if(!paused&&!this.reduced)this.motion+=dt*(reading?.45:1);
    if(this.failed)return;
    const gl=this.gl,scene=this.scene,p=this.progress,e=this.elapsed,portrait=this.width/this.height<.8;
    let camera=16.1,rotation=-.36,tilt=.56,offset=[.06,.11],intensity=1.55,flow=1;
    if(scene==='prologue'){camera=16.0-p*.7;tilt=.58;intensity=1.35+.3*p;}
    if(scene==='days'){camera=17.5;tilt=.65;intensity=1.05;flow=.85;}
    if(scene==='memories'){camera=19.1;tilt=.48;rotation=-.42;offset=[.12,.06];intensity=.8;flow=.5;}
    if(scene==='orbits'){camera=17.9;tilt=.58;intensity=1.1;flow=1.15;}
    if(scene==='eternity'){camera=15.2-smooth(0,.12,p)*1.5+smooth(.12,.7,p)*1.4;tilt=.62;rotation=-.24;intensity=1.9+energy*.2;flow=1.45;}
    if(scene==='cake'){camera=18.2;tilt=.62;offset=[0,.10];intensity=.80;flow=.8;}
    if(scene==='nineteen'){camera=20.6;tilt=.58;offset=[.05,.04];intensity=.7;flow=.55;}
    if(scene==='finale'){camera=17.3;tilt=.65;intensity=1.4;flow=1.1;}
    if(scene==='explore'){camera=19.0;tilt=.61;offset=[0,-.02];intensity=1.55;flow=1.15;}
    if(portrait){camera+=3;tilt=Math.max(.72,tilt);rotation*=.65;offset[0]*=.7;if(scene==='explore'){camera=22;tilt=.76;offset=[0,-.03];}}
    if(this.reduced){camera=portrait?20:17;rotation=-.08;tilt=portrait?.86:.74;offset=[0,-.04];}
    const ease=1-Math.exp(-dt*.85);
    const controlled=!['cake','nineteen'].includes(scene);
    this.look[0]=mix(this.look[0],controlled?this.view[0]:0,1-Math.exp(-dt*4));this.look[1]=mix(this.look[1],controlled?this.view[1]:0,1-Math.exp(-dt*4));
    this.zoomed=mix(this.zoomed,controlled?this.distance:0,1-Math.exp(-dt*3));camera+=this.zoomed;
    this.camera=mix(this.camera,camera,ease);this.rotation=mix(this.rotation,rotation,ease);this.tilt=mix(this.tilt,tilt,ease);this.flow=mix(this.flow,flow,ease);
    if(!paused&&!this.reduced)this.flowTime=(this.flowTime||0)+dt*this.flow*(reading?.45:1);
    this.offset[0]=mix(this.offset[0],offset[0],ease);this.offset[1]=mix(this.offset[1],offset[1],ease);
    this.stretch=mix(this.stretch||1,scene==='explore'?(portrait?1.48:1.35):(portrait?1.55:1.28),ease);
    this.density=mix(this.density||.86,scene==='eternity'?1:scene==='explore'?.95:['memories','cake','nineteen'].includes(scene)?.72:.86,ease);
    this.dim=mix(this.dim,reading?.62:1,1-Math.exp(-dt*2));
    this.angle=this.rotation+(this.reduced?0:Math.sin(this.motion*.055)*.045);
    this.liveTilt=Math.max(.32,Math.min(.98,this.tilt+this.look[1]+(this.reduced?0:Math.sin(this.motion*.09)*.018)));
    const flight=this.reduced?0:(scene==='orbits'?smooth(.84,.98,p):scene==='eternity'?1-smooth(0,.10,p):0);
    if(!paused&&!this.reduced)this.travel=(this.travel||0)+dt*(.1+flight*7.5);
    gl.clearColor(2/255,2/255,3/255,1);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(this.program);
    gl.uniform2f(this.u.Resolution,this.width,this.height);gl.uniform1f(this.u.Dpr,this.dpr);gl.uniform1f(this.u.Stretch,this.stretch);
    gl.uniform1f(this.u.Time,this.reduced?0:this.flowTime||0);gl.uniform1f(this.u.Camera,this.camera);gl.uniform1f(this.u.Rotation,this.angle);gl.uniform1f(this.u.Tilt,this.liveTilt);
    gl.uniform2f(this.u.Look,this.look[0],this.look[1]);
    gl.uniform1f(this.u.Awake,this.reduced?1:smooth(.1,4.2,this.time));gl.uniform1f(this.u.Flow,1);
    gl.uniform1f(this.u.Travel,this.travel||0);gl.uniform1f(this.u.Flight,flight);gl.uniform2f(this.u.Offset,...this.offset);
    gl.uniform1f(this.u.ObjectScale,portrait?1.42:1.1);gl.uniform1f(this.u.Letter,0);
    this.drawBuffer(this.stars,.78);this.drawBuffer(this.cloud,intensity);this.drawBuffer(this.band,intensity*(1+.035*Math.sin(this.motion*.35)));
    const digitMorph=scene==='days'?(this.reduced?1:Math.min(smooth(0,.13,p),1-smooth(.81,1,p))):0;
    this.drawBuffer(this.numbers,mix(.62,1.65,digitMorph),digitMorph);
    let cakeMorph=scene==='cake'?(this.reduced?1:smooth(0,4.6,e)):scene==='nineteen'?1-smooth(.7,4.5,e):0;
    this.drawBuffer(this.cake,mix(.6,1.8,cakeMorph),cakeMorph);
    if(scene==='cake'||scene==='nineteen')this.drawCandle(scene==='cake'?-1:e,cakeMorph,portrait);
    if(scene==='nineteen'){
      const compact=this.height<=520&&this.width>this.height;
      const opened=smooth(4.8,8.4,e),w=Math.min(680,this.width-(compact?90:32)),h=this.height-(compact?84:132);
      gl.uniform2f(this.u.LetterSize,w/this.width,h/this.height);gl.uniform1f(this.u.Letter,opened);
      if(opened>0)this.drawBuffer(this.letter,opened*(1-.48*smooth(8.4,11.4,e)));
    }
    if(scene==='orbits')this.drawOrbits(p,portrait);
    this.canvas.dataset.motion=this.motion.toFixed(3);this.canvas.dataset.particles=String(this.band.count);
    this.canvas.dataset.cake=cakeMorph.toFixed(3);
    this.canvas.dataset.view=`${this.look[0].toFixed(3)},${this.look[1].toFixed(3)},${this.zoomed.toFixed(3)}`;
  }
  projectRing(theta,r){
    theta+=(this.flowTime||0)*.012;
    let x=Math.cos(theta)*r,y=Math.sin(theta)*r,z=-y*Math.sqrt(1-this.liveTilt*this.liveTilt);
    const yaw=this.look[0],newX=x*Math.cos(yaw)+z*Math.sin(yaw);z=-x*Math.sin(yaw)+z*Math.cos(yaw);x=newX;
    const c=Math.cos(this.angle||0),s=Math.sin(this.angle||0),px=c*x+s*y*this.liveTilt,py=-s*x+c*y*this.liveTilt;
    const aspect=this.width/this.height,depth=this.camera-z;
    return [((px*2.15/depth*Math.min(1,aspect/1.24)/aspect*(this.stretch||1)+this.offset[0])+1)/2,(1-(py*2.15/depth+this.offset[1]))/2];
  }
  wishPositions(){
    if(this.liveTilt===undefined)this.liveTilt=this.tilt;
    return [[.12,6.0],[.56,7.0],[1.06,5.8],[1.64,6.7],[2.16,6.0],[2.70,6.9],[3.18,5.8],[3.73,6.7],[4.19,5.9],[4.78,6.8],[5.31,6.1],[5.83,7.0]].map(([t,r])=>this.projectRing(t,r));
  }
  drawCandle(seconds,morph,portrait){
    const gl=this.gl,b=this.candle,scale=portrait?1.42:1.1;
    const lift=seconds<0?0:smooth(.6,3.9,seconds),grow=seconds<0?0:smooth(3.7,5.5,seconds),fade=seconds<0?1:1-smooth(5.4,7.9,seconds);
    const dim=seconds<0?1:seconds<.5?1-.92*smooth(0,.5,seconds):.08+.92*smooth(.5,1,seconds);
    const compact=this.height<=520&&this.width>this.height;
    const h=this.height-(compact?84:132);
    const targetY=(h/this.height-76/this.height-this.offset[1])*(this.camera+.3)/2.15;
    const aspect=this.width/this.height;
    const targetX=-this.offset[0]*(this.camera+.3)/2.15/(Math.min(1,aspect/1.24)/aspect*this.stretch);
    for(let i=0;i<180;i++){
      const trail=i/180,l=Math.max(0,lift-trail*.25),x=Math.sin(l*Math.PI)*.20+targetX*l,y=mix(1.55*scale,targetY,l);
      b.positions.set([x+(seconds<0?Math.sin(this.time*22)*this.breath*.09:0),y,-.3],i*3);
      b.styles.set([i===0?60+grow*110:1.2,(i===0?1.5:(1-trail)*.3)*dim*fade*(seconds<0?smooth(.6,.95,morph)*(1-this.breath*.65):1),i/180,.48],i*4);
    }
    gl.bindBuffer(gl.ARRAY_BUFFER,b.position);gl.bufferSubData(gl.ARRAY_BUFFER,0,b.positions);gl.bindBuffer(gl.ARRAY_BUFFER,b.style);gl.bufferSubData(gl.ARRAY_BUFFER,0,b.styles);
    this.drawBuffer(b,1.2);
  }
  drawOrbits(progress,portrait) {
    const gl=this.gl,b=this.orbits;
    const phase=this.reduced?.38:progress;
    for(let i=0;i<1300;i++) {
      const star=i<650?0:1,j=i%650,t=phase*6.283-j*.0016;
      const x=Math.sin(t)*(star?-3.8:4.3);
      const y=Math.sin(t*2)*(star?-1.3:.8)+1;
      const k=i*3,l=i*4;
      b.positions[k]=x;b.positions[k+1]=y;b.positions[k+2]=Math.sin(t)*1.2;
      const meeting=Math.exp(-Math.pow(Math.sin(phase*6.283)*9,2));
      b.styles[l]=j===0?18+meeting*14:(j<3?5:.9);b.styles[l+1]=j===0?1+meeting*.4:Math.pow(1-j/650,2)*.18;b.styles[l+2]=i/1300;b.styles[l+3]=star?.65:.05;
    }
    gl.uniform1f(this.u.Camera,13);gl.uniform2f(this.u.Offset,0,portrait?.12:.15);
    gl.bindBuffer(gl.ARRAY_BUFFER,b.position);gl.bufferSubData(gl.ARRAY_BUFFER,0,b.positions);
    gl.bindBuffer(gl.ARRAY_BUFFER,b.style);gl.bufferSubData(gl.ARRAY_BUFFER,0,b.styles);
    this.drawBuffer(b,1.4);
  }
  adapt(ms) {
    if(this.failed||this.reduced)return;
    this.samples=(this.samples||0)+1;this.slow=(this.slow||0)+(ms>35?1:0);
    if(this.samples===150){if(this.slow>65&&this.quality>.65){this.quality=Math.max(.65,this.quality-.12);this.resize();}this.samples=0;this.slow=0;}
  }
}
