import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
import { LETTER_CUE, DURATION, letterParagraphs } from '../src/content.js';
const { chromium }=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const base=process.env.QA_URL||'http://127.0.0.1:4173/';
const out='artifacts/v3.1';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true,args:['--disable-audio-output']});
const errors=[],results=[];
const pass=name=>{results.push(name);console.log('PASS',name)};
async function pageFor(options={}){const p=await browser.newPage(options);p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});return p;}
async function seek(p,time){await p.locator('#seek').evaluate((e,v)=>{e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))},time/DURATION*100);}
try{
 const p=await pageFor({viewport:{width:1180,height:820}});
 await p.goto(base+'?preview=cake');await p.waitForTimeout(5300);
 const b=await p.locator('#hold-breath').boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await p.waitForTimeout(1400);await p.mouse.up();
 await p.waitForTimeout(3100);await p.screenshot({path:`${out}/01-rising-star.png`});
 await p.waitForTimeout(2500);await p.screenshot({path:`${out}/02-stardust-opens.png`});
 await p.waitForTimeout(3600);await p.screenshot({path:`${out}/03-starlight-blessing.png`});
 assert.equal(await p.locator('#letter-sheet').getAttribute('aria-hidden'),'false');assert.deepEqual(await p.locator('#letter-body p').allTextContents(),letterParagraphs);
 const m=Number(await p.locator('canvas').getAttribute('data-motion'));await p.waitForTimeout(3500);
 assert.ok(Number(await p.locator('canvas').getAttribute('data-motion'))>m+.8);
 const time=await p.locator('#seek').inputValue();await p.waitForTimeout(1200);assert.equal(await p.locator('#seek').inputValue(),time);
 pass('Hold → ascending star → stardust opens continuously; full text waits while the galaxy moves');
 await p.locator('#letter-scroll').evaluate(e=>e.scrollTop=e.scrollHeight);await p.screenshot({path:`${out}/04-signature.png`});await p.locator('#keep-letter').click();assert.equal(await p.locator('#scene-name').textContent(),'送你一整片星空');pass('Reading to the signature and returning to the journey works');await p.close();
 for(const [name,width,height] of [['small',320,568],['phone',390,844],['landscape',844,390],['ipad',1024,768],['ipad-wide',1180,820]]){
  const p=await pageFor({viewport:{width,height},hasTouch:true,isMobile:width<900});await p.goto(base+'?preview=nineteen');await seek(p,LETTER_CUE.start+3);await p.waitForTimeout(1800);
  const bounds=await p.locator('#letter-sheet').boundingBox();assert.ok(bounds.x>=0&&bounds.y>=0&&bounds.x+bounds.width<=width+1&&bounds.y+bounds.height<=height+1);
  assert.deepEqual(await p.locator('#letter-body p').allTextContents(),letterParagraphs);
  await p.screenshot({path:`${out}/${name}-starlight.png`});
  const cdp=await p.context().newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width/2,y:height*.7}]});
  for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width/2,y:height*.7-i*height*.035}]});await p.waitForTimeout(20)}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(250);assert.ok(await p.locator('#letter-scroll').evaluate(e=>e.scrollTop)>30);
  await p.locator('#keep-letter').scrollIntoViewIfNeeded();await p.locator('#keep-letter').tap();assert.equal(await p.locator('#scene-name').textContent(),'送你一整片星空');pass(`${name} ${width}×${height}: complete copy, bounds, touch scrolling and exit`);await p.close();
 }
 const f=await pageFor({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await f.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return type.includes('webgl')?null:original.call(this,type,...args)}});
 await f.goto(base+'?preview=nineteen');await seek(f,LETTER_CUE.start+3);await f.waitForTimeout(300);
 assert.ok(await f.locator('html').evaluate(e=>e.classList.contains('no-webgl')));assert.equal(await f.locator('.starlight-source').evaluate(e=>getComputedStyle(e).animationName),'none');assert.deepEqual(await f.locator('#letter-body p').allTextContents(),letterParagraphs);
 await f.locator('#keep-letter').focus();await f.keyboard.press('Enter');assert.equal(await f.locator('#scene-name').textContent(),'送你一整片星空');pass('No WebGL + reduced motion: full blessing and keyboard exit remain available');await f.close();
 assert.deepEqual(errors,[]);pass('No browser runtime or console errors');
 await writeFile('docs/starlight-qa.json',JSON.stringify({testedAt:new Date().toISOString(),engine:'Headless Chrome; emulated touch and viewports, not physical devices',results,errors},null,2));
}finally{await browser.close()}
