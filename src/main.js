import { scenes, blessings, timeline, DURATION, CAKE_CUE, LETTER_START, LETTER_CUE, FINAL_START, letterParagraphs, advanceFilm, cueAt, sceneProgress } from './content.js';
import { Universe } from './universe.js';
import { Soundtrack } from './audio.js';
import { BreathInput } from './breath.js';
const $=id=>document.getElementById(id);
const reducedQuery=matchMedia('(prefers-reduced-motion: reduce)');
const state={mode:'landing',time:0,paused:false,cue:null,scene:null,modal:false,visited:new Set(),lastFrame:0,ritualReleased:false,motionOverride:false,auto:false,letterRead:false,letterFocused:false,transitioning:false};
const universe=new Universe($('universe'),{reduced:reducedQuery.matches,onFallback:()=>{}});
const sound=new Soundtrack(status=>{
  $('audio-retry').hidden=status==='playing';
  if(status==='unavailable'){ $('audio-retry').hidden=true; toast('音乐暂时无法载入，你仍可以继续观看。'); }
});
sound.loadEnvelope();
for(const text of letterParagraphs){const p=document.createElement('p');p.textContent=text;$('letter-body').append(p);}
const breath=new BreathInput({
  onStatus:status=>{
    const messages={requesting:'请允许麦克风，把这个愿望交给星光。',calibrating:'先安静一小会儿……',listening:'现在，对着麦克风轻轻吹气。',denied:'没有开启麦克风也没关系，可以长按下方吹灭。',unsupported:'这里暂时无法开启麦克风，可以长按下方吹灭。',unavailable:'暂时听不到麦克风，可以重试或长按下方。',timeout:'星烛还在等你，可以再试一次。'};
    $('breath-status').textContent=messages[status]||'';
    $('blow-candle').textContent=['requesting','calibrating','listening'].includes(status)?'取消聆听':'准备吹蜡烛';
    if(!breath.active)sound.setDuck(1);
    document.body.dataset.microphone=status;
  },onLevel:value=>setBreathLevel(value),onBlow:()=>releaseStar()
});
function setBreathLevel(value){$('breath-meter').style.setProperty('--breath',value);$('breath-meter').setAttribute('aria-valuenow',Math.round(value*100));universe.breath=value;}
function stopBreath(){const listening=breath.active;breath.stop();state.holdSince=0;sound.setDuck(1);$('blow-candle').textContent='准备吹蜡烛';if(listening)$('breath-status').textContent='聆听已暂停，准备好后可以再试一次。';document.body.dataset.microphone='off';}
function releaseStar(){
  if(state.scene!=='cake'||state.ritualReleased)return;
  stopBreath();state.ritualReleased=true;seekTo(LETTER_START);resume();
}
const isReduced=()=>reducedQuery.matches&&!state.motionOverride;
$('motion-toggle').hidden=!reducedQuery.matches;
reducedQuery.addEventListener?.('change',()=>{universe.reduced=isReduced();$('motion-toggle').hidden=!reducedQuery.matches;});
$('motion-toggle').addEventListener('click',()=>{state.motionOverride=!state.motionOverride;universe.reduced=isReduced();document.body.classList.toggle('motion-enabled',state.motionOverride);$('motion-toggle').setAttribute('aria-pressed',state.motionOverride);$('motion-toggle').textContent=state.motionOverride?'减弱动态':'开启星海流动';});
let toastTimer,controlsTimer,landingTimer,nextTimer,returnFocus,menuWasPaused=false;
const formatTime=t=>`${String(Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
function toast(text){$('toast').textContent=text;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4500);}
function wakeControls(){ $('controls').classList.remove('idle');clearTimeout(controlsTimer);controlsTimer=setTimeout(()=>{if(!state.paused&&$('chapters').hidden)$('controls').classList.add('idle');},4500); }
function updatePause(){
  $('play-pause').setAttribute('aria-label',state.mode==='explore'?(state.paused?'继续星海与音乐':'暂停星海与音乐'):(state.paused?'继续电影':'暂停电影'));
  $('play-shape').setAttribute('d',state.paused?'M8 5l11 7-11 7z':'M9 6v12M15 6v12');
  $('paused-indicator').hidden=!state.paused||state.mode!=='film';
  document.body.classList.toggle('is-paused',state.paused);wakeControls();
}
function pause(){state.paused=true;sound.pause();stopBreath();updatePause();}
async function resume(){state.paused=false;updatePause();await sound.start();}
function setScene(id){
  if(state.scene===id)return;
  if(state.scene==='cake')stopBreath();
  document.body.classList.remove(`scene-${state.scene}`);state.scene=id;document.body.classList.add(`scene-${id}`);
  const i=scenes.findIndex(s=>s.id===id),s=scenes[i];
  if(s){$('scene-index').textContent=String(i).padStart(2,'0');$('scene-name').textContent=s.name;$('control-scene').textContent=s.label;}
  document.querySelectorAll('#chapter-list button').forEach(b=>b.setAttribute('aria-current',String(b.dataset.scene===id)));
}
function updateFilm(){
  const cue=cueAt(state.time);
  if(state.cue!==cue){state.cue=cue;$('subtitle').textContent=cue.text;setScene(cue.scene);}
  const local=state.time-cue.start,remaining=cue.end-state.time;
  const fade=isReduced()?.25:.75;
  $('subtitle-wrap').style.opacity=state.transitioning?0:Math.max(0,Math.min(1,local/fade,state.auto?remaining/fade:1));
  $('next-moment').hidden=cue.kind!=='text'||state.auto||local<.8;
  $('next-moment').disabled=state.transitioning;
  const elapsed=state.time-timeline.find(c=>c.scene===cue.scene).start;
  document.body.dataset.ritual=cue.scene==='cake'?(elapsed<4.6?'gathering':'waiting'):cue.scene==='nineteen'?(elapsed<.6?'extinguish':elapsed<3.9?'ascent':elapsed<4.8?'expand':elapsed<8.4?'unfold':'letter'):'none';
  universe.setScene(cue.scene,sceneProgress(state.time,cue.scene),elapsed);
  const unfolding=cue.scene==='nineteen'?Math.max(0,Math.min(1,(elapsed-4.8)/3.6)):0;
  const open=unfolding*unfolding*(3-2*unfolding);
  $('letter-sheet').style.setProperty('--unfold',open);
  $('letter-sheet').style.setProperty('--letter-ink',cue.scene==='nineteen'?Math.max(0,Math.min(1,(elapsed-7.2)/1.2)):0);
  $('letter-sheet').style.clipPath='';
  $('letter-sheet').style.opacity=open;
  const letterOpen=cue.kind==='letter';
  $('letter-sheet').inert=!letterOpen;$('letter-sheet').setAttribute('aria-hidden',String(!letterOpen));
  document.body.classList.toggle('letter-open',letterOpen);
  if(letterOpen&&!state.letterFocused){state.letterFocused=true;$('letter-scroll').scrollTop=0;$('letter-scroll').focus({preventScroll:true});}
  $('ritual-action').hidden=cue.scene!=='cake'||elapsed<4.6;
  $('fallback-cake').style.opacity=cue.scene==='cake'?Math.min(1,elapsed/3.6):cue.scene==='nineteen'?Math.max(0,1-elapsed/4):0;
  $('fallback-candle').style.transform=cue.scene==='nineteen'?`translateY(${-Math.min(1,elapsed/4)*160}px) scale(${1+Math.max(0,elapsed-3)})`:'none';
  $('seek').value=(state.time/DURATION*100).toFixed(2);$('seek').style.setProperty('--progress',`${state.time/DURATION*100}%`);
  $('seek').setAttribute('aria-valuetext',`${formatTime(state.time)}，${scenes[cue.sceneIndex].name}`);
  $('time-label').textContent=formatTime(state.time);
  $('time-label').title=`总时长 ${formatTime(DURATION)}`;
}
async function start(){
  stopBreath();clearTimeout(nextTimer);state.transitioning=false;
  state.mode='entering';state.time=0;state.paused=false;state.cue=null;state.ritualReleased=false;state.letterRead=false;state.letterFocused=false;
  document.body.classList.remove('letter-open');
  $('enter').disabled=true;$('landing').classList.add('leaving');$('landing-footer').classList.add('leaving');
  // Do not await visual transitions before the gesture-bound audio start.
  const starting=sound.start(true);
  $('film').hidden=true;$('controls').hidden=true;$('explore').hidden=true;document.body.classList.remove('explore-open');
  universe.setScene('prologue');
  clearTimeout(landingTimer);landingTimer=setTimeout(()=>{
    $('landing').hidden=true;$('landing-footer').hidden=true;state.mode='film';state.lastFrame=0;
    $('film').hidden=false;$('controls').hidden=false;updateFilm();updatePause();
  },isReduced()?250:1000);
  await starting;
}
function explore(){
  stopBreath();document.body.classList.remove('letter-open');
  state.mode='explore';state.time=DURATION;state.paused=false;$('film').hidden=true;$('explore').hidden=false;$('controls').hidden=false;
  document.body.classList.add('explore-open');setScene('explore');universe.setScene('explore');$('control-scene').textContent='星海漫游';updatePause();positionStars();
}
function seekTo(time){
  stopBreath();clearTimeout(nextTimer);state.transitioning=false;state.letterFocused=false;
  state.time=Math.max(0,Math.min(DURATION,time));state.cue=null;
  state.ritualReleased=state.time>=CAKE_CUE.end;
  state.letterRead=state.time>=FINAL_START;
  if(state.time>=DURATION){explore();return;}
  state.mode='film';$('film').hidden=false;$('explore').hidden=true;document.body.classList.remove('explore-open');updateFilm();
}
function closeMenu(resumePrevious=true){$('chapters').hidden=true;$('chapters-button').setAttribute('aria-expanded','false');if(resumePrevious&&!menuWasPaused)resume();}
function openMenu(){menuWasPaused=state.paused;pause();$('chapters').hidden=false;$('chapters-button').setAttribute('aria-expanded','true');$('chapter-list').querySelector('[aria-current="true"]')?.focus();}
$('enter').addEventListener('click',start);
$('blow-candle').addEventListener('click',()=>{
  if(breath.active){stopBreath();$('breath-status').textContent='星烛还在，可以准备好了再吹。';return;}
  if(state.paused)resume();sound.setDuck(.12);breath.start();
});
const beginHold=e=>{if(state.scene!=='cake'||state.ritualReleased)return;if(e.type==='keydown'&&!['Space','Enter'].includes(e.code))return;e.preventDefault();if(e.repeat)return;stopBreath();if(state.paused)resume();state.holdSince=performance.now();$('breath-status').textContent='让这阵风，轻轻带走星光。';if(e.pointerId!==undefined)$('hold-breath').setPointerCapture(e.pointerId);};
const endHold=()=>{if(state.holdSince){state.holdSince=0;setBreathLevel(0);$('breath-status').textContent='持续按住，让这阵风吹向星烛。';}};
for(const event of ['pointerdown','keydown'])$('hold-breath').addEventListener(event,beginHold);
for(const event of ['pointerup','pointercancel','keyup','blur'])$('hold-breath').addEventListener(event,endHold);
function nextMoment(){
  if(state.mode!=='film'||state.cue?.kind!=='text'||state.transitioning)return;
  const next=state.cue.end+.01;state.transitioning=true;updateFilm();
  nextTimer=setTimeout(()=>{seekTo(next);if(state.paused)resume();},isReduced()?100:380);
}
$('next-moment').addEventListener('click',nextMoment);
$('auto-play').addEventListener('click',()=>{state.auto=!state.auto;document.body.classList.toggle('automatic-journey',state.auto);$('auto-play').setAttribute('aria-pressed',state.auto);$('auto-play').textContent=state.auto?'由我继续':'自动漫游';if(state.mode==='film')updateFilm();});
$('keep-letter').addEventListener('click',()=>{state.letterRead=true;seekTo(FINAL_START+.01);resume();});
$('letter-scroll').addEventListener('scroll',()=>{const e=$('letter-scroll');$('letter-sheet').classList.toggle('read-to-end',e.scrollTop+e.clientHeight>=e.scrollHeight-30);});
$('play-pause').addEventListener('click',()=>state.paused?resume():pause());
$('mute').addEventListener('click',()=>{const muted=sound.toggleMute();$('mute').setAttribute('aria-pressed',muted);$('mute').setAttribute('aria-label',muted?'开启声音':'静音');$('sound-waves').style.opacity=muted?'0':'1';});
$('replay').addEventListener('click',()=>{closeMenu(false);start();});
$('audio-retry').addEventListener('click',()=>sound.start());
$('chapters-button').addEventListener('click',()=>{$('chapters').hidden?openMenu():closeMenu();});
$('fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement){await document.exitFullscreen();}else if($('experience').requestFullscreen){await $('experience').requestFullscreen();}else if($('experience').webkitRequestFullscreen){$('experience').webkitRequestFullscreen();}else toast('当前浏览器已采用沉浸布局；横屏可展开更宽阔的星空。');}catch{toast('当前浏览器不支持网页全屏，可以使用横屏观看。');}
});
document.querySelector('.wordmark').addEventListener('click',e=>{e.preventDefault();if(state.mode!=='landing'){clearTimeout(landingTimer);clearTimeout(nextTimer);state.transitioning=false;pause();state.mode='landing';state.paused=false;document.body.classList.remove('is-paused','letter-open');universe.setScene('landing');$('landing').hidden=false;$('landing-footer').hidden=false;$('landing').classList.remove('leaving');$('landing-footer').classList.remove('leaving');$('enter').disabled=false;$('film').hidden=true;$('controls').hidden=true;$('explore').hidden=true;closeMenu(false);document.body.classList.remove('explore-open');}});
for(const [i,scene] of scenes.entries()){
  const b=document.createElement('button');b.type='button';b.dataset.scene=scene.id;
  const n=document.createElement('span');n.textContent=String(i).padStart(2,'0');b.append(n,document.createTextNode(scene.name));
  b.addEventListener('click',()=>{closeMenu(false);seekTo(timeline.find(c=>c.scene===scene.id).start+.05);resume();$('chapters-button').focus();});$('chapter-list').append(b);
}
const exploreButton=document.createElement('button');exploreButton.type='button';exploreButton.textContent='✧　自由探索星海';exploreButton.dataset.scene='explore';exploreButton.addEventListener('click',()=>{closeMenu(false);explore();resume();});$('chapter-list').append(exploreButton);
let scrubWasPaused=false;
$('seek').addEventListener('pointerdown',()=>{scrubWasPaused=state.paused;pause();});
$('seek').addEventListener('input',e=>seekTo(Number(e.target.value)/100*DURATION));
$('seek').addEventListener('change',()=>{if(!scrubWasPaused)resume();});

const starButtons=blessings.map(([title],i)=>{
  const b=document.createElement('button');b.type='button';b.className='wish-star'+(i===11?' special':'');b.dataset.star=String(i+1);b.style.setProperty('--delay',`${-i*.61}s`);b.setAttribute('aria-label',i===11?'一颗暖白色星星，藏起来的特别祝福':`祝福星星 ${String(i+1).padStart(2,'0')}，${title}`);
  const label=document.createElement('span');label.className='star-label';label.textContent=i===11?'一颗特别的星':title;b.append(label);b.addEventListener('click',()=>openBlessing(i));$('blessing-stars').append(b);return b;
});
// Art-directed touch constellations: irregular, distinct layouts rather than cropping desktop.
const landscapeStars=[[.19,.46],[.26,.34],[.39,.33],[.59,.36],[.73,.42],[.81,.56],[.71,.66],[.58,.72],[.42,.69],[.29,.62],[.17,.66],[.52,.48]];
const portraitStars=[[.17,.40],[.32,.33],[.58,.35],[.78,.42],[.82,.56],[.69,.64],[.53,.70],[.34,.67],[.17,.59],[.28,.49],[.54,.55],[.73,.76]];
function positionStars(){
  const width=innerWidth,height=innerHeight,points=universe.failed?(width/height<.8?portraitStars:landscapeStars):universe.wishPositions();
  const positions=points.map(([x,y])=>[x*width,y*height]);
  const bound=p=>{p[0]=Math.max(32,Math.min(width-32,p[0]));p[1]=Math.max(height*(height<520?.33:.29),Math.min(height-(height<520?115:160),p[1]));};
  // Keep touch targets separate even on a 320px screen; stars stay near their dust cloud.
  for(let pass=0;pass<14;pass++){
    positions.forEach(bound);
    for(let i=0;i<positions.length;i++)for(let j=0;j<i;j++){
      const a=positions[i],b=positions[j],dx=a[0]-b[0],dy=a[1]-b[1],d=Math.max(.01,Math.hypot(dx,dy));
    if(d<58){const push=(58-d)*.51;a[0]+=dx/d*push;a[1]+=dy/d*push;b[0]-=dx/d*push;b[1]-=dy/d*push;}
    }
  }
  positions.forEach(bound);
  starButtons.forEach((b,i)=>{b.style.left=`${positions[i][0]}px`;b.style.top=`${positions[i][1]}px`;});
}
window.addEventListener('resize',positionStars);positionStars();
function openBlessing(i){
  state.modal=true;returnFocus=starButtons[i];state.visited.add(i);returnFocus.classList.add('seen');
  $('collected').textContent=`已点亮 ${state.visited.size} 颗星星`;
  $('star-number').textContent=`STAR ${String(i+1).padStart(2,'0')} / 12`;$('blessing-title').textContent=blessings[i][0];$('blessing-text').textContent=blessings[i][1];$('blessing-dialog').classList.toggle('special',i===11);
  $('blessing-dialog').showModal();
}
function closeBlessing(){$('blessing-dialog').close();}
$('close-blessing').addEventListener('click',closeBlessing);$('return-stars').addEventListener('click',closeBlessing);
$('blessing-dialog').addEventListener('click',e=>{if(e.target===$('blessing-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeBlessing();}});
$('blessing-dialog').addEventListener('close',()=>{state.modal=false;returnFocus?.focus({preventScroll:true});});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state.mode!=='landing'){pause();if(!$('chapters').hidden)closeMenu(false);}state.lastFrame=0;});
window.addEventListener('pagehide',stopBreath);
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!$('chapters').hidden){closeMenu();$('chapters-button').focus();}
  if(e.code==='Space'&&state.mode==='film'&&!state.modal&&!e.target.closest('#letter-sheet')&&e.target.tagName!=='INPUT'&&e.target.tagName!=='BUTTON'){e.preventDefault();state.paused?resume():pause();}
  if(e.code==='ArrowRight'&&state.mode==='film'&&!state.modal&&e.target.tagName!=='INPUT')nextMoment();
  wakeControls();
});
for(const event of ['pointermove','pointerdown','focusin'])document.addEventListener(event,wakeControls,{passive:true});
document.addEventListener('pointerdown',e=>{if(!$('chapters').hidden&&!$('chapters').contains(e.target)&&!$('chapters-button').contains(e.target))closeMenu();});
let lastRender=0;
function frame(now){
  requestAnimationFrame(frame);if(document.hidden){state.lastFrame=0;return;}
  const elapsed=state.lastFrame?now-state.lastFrame:0;state.lastFrame=now;
  const dt=Math.min(elapsed/1000,.15);
  if(state.holdSince){const progress=Math.min(1,(now-state.holdSince)/1300);setBreathLevel(progress);if(progress>=1)releaseStar();}
  if(state.mode==='film'&&!state.paused&&!state.transitioning){state.time=advanceFilm(state.time,dt,{released:state.ritualReleased,letterRead:state.letterRead,manual:!state.auto});if(state.time>=DURATION)explore();else updateFilm();}
  sound.update();
  const interval=(universe.mobile||isReduced())?1000/30:1000/60;
  if(now-lastRender>=interval-1){universe.render(Math.min((now-lastRender)/1000,.1),{paused:state.paused,reading:state.modal||(state.mode==='film'&&state.cue?.kind==='letter'),energy:sound.energy});universe.adapt(now-lastRender);lastRender=now;if(state.mode==='explore')positionStars();}
  document.body.dataset.mode=state.mode;
}
requestAnimationFrame(frame);
// Touch and pointer gestures move the actual star volume. Reading and controls keep native behavior.
const pointers=new Map();let pinchDistance=0;
const ignoreGesture=e=>e.target.closest('button,a,input,dialog,#letter-sheet,#chapters')||state.modal||(state.mode==='film'&&state.cue?.kind==='letter');
$('experience').addEventListener('pointerdown',e=>{if(ignoreGesture(e))return;pointers.set(e.pointerId,[e.clientX,e.clientY]);$('experience').setPointerCapture(e.pointerId);document.body.classList.add('is-dragging');});
$('experience').addEventListener('pointermove',e=>{
  if(!pointers.has(e.pointerId))return;const last=pointers.get(e.pointerId);pointers.set(e.pointerId,[e.clientX,e.clientY]);
  if(pointers.size===1)universe.orbit((e.clientX-last[0])/innerWidth,(e.clientY-last[1])/innerHeight);
  else{const[a,b]=[...pointers.values()],distance=Math.hypot(a[0]-b[0],a[1]-b[1]);if(pinchDistance)universe.zoom((pinchDistance-distance)/innerWidth*6);pinchDistance=distance;}
});
for(const event of ['pointerup','pointercancel','lostpointercapture'])$('experience').addEventListener(event,e=>{pointers.delete(e.pointerId);pinchDistance=0;if(!pointers.size)document.body.classList.remove('is-dragging');});
$('experience').addEventListener('wheel',e=>{if(ignoreGesture(e))return;e.preventDefault();universe.zoom(e.deltaY*.003);},{passive:false});
$('closer').addEventListener('click',()=>universe.zoom(-1));$('farther').addEventListener('click',()=>universe.zoom(1));$('reset-view').addEventListener('click',()=>universe.resetView());
// Author preview links start visual playback without bypassing the audio gesture requirement.
const preview=new URLSearchParams(location.search).get('preview');
if(['eternity','cake','nineteen','explore'].includes(preview)){
  $('landing').hidden=true;$('landing-footer').hidden=true;$('controls').hidden=false;$('audio-retry').hidden=false;
  if(preview==='explore')explore();else {seekTo(timeline.find(c=>c.scene===preview).start);updatePause();}
}
