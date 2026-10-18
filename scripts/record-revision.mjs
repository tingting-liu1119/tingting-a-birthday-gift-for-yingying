// Local visual review only. Captures the real browser; no music is embedded.
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {setTimeout as delay} from 'node:timers/promises';
const {chromium}=createRequire(import.meta.url)(process.env.PLAYWRIGHT_MODULE||'playwright');
const ffmpeg=process.env.FFMPEG_PATH||'ffmpeg';
const base=process.env.QA_URL||'http://127.0.0.1:4173/';
const out='artifacts/v3';await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true,args:['--disable-audio-output']});
const errors=[];
async function record(name,url,seconds,action=async()=>{}){
 const page=await browser.newPage({viewport:{width:1180,height:820}});
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url);const session=await page.context().newCDPSession(page);let latest;
 session.on('Page.screencastFrame',({data,sessionId})=>{latest=Buffer.from(data,'base64');session.send('Page.screencastFrameAck',{sessionId}).catch(()=>{});});
 await session.send('Page.startScreencast',{format:'jpeg',quality:90,maxWidth:1180,maxHeight:820,everyNthFrame:1});
 while(!latest)await delay(10);
 const encoder=spawn(ffmpeg,['-y','-loglevel','error','-f','image2pipe','-framerate','24','-vcodec','mjpeg','-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','19','-threads','2','-pix_fmt','yuv420p','-movflags','+faststart',`${out}/${name}.mp4`],{stdio:['pipe','ignore','pipe']});
 let stderr='';encoder.stderr.on('data',b=>stderr+=b);const complete=once(encoder,'close');
 const start=Date.now(),interaction=action(page);
 for(let i=0;i<seconds*24;i++){
  if(!encoder.stdin.write(latest))await once(encoder.stdin,'drain');
  await delay(Math.max(0,start+(i+1)*1000/24-Date.now()));
 }
 await interaction;await session.send('Page.stopScreencast');encoder.stdin.end();
 const [code]=await complete;if(code!==0)throw new Error(stderr);await page.close();console.log('Recorded',name,seconds+'s');
}
try{
 const only=process.env.RECORD_ONLY;
 if(!only)await record('01-opening',base,7);
 if(!only)await record('02-climax',base+'?preview=eternity',7);
 await record('03-star-letter',base+'?preview=cake',20,async p=>{await delay(8000);const b=await p.locator('#hold-breath').boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await delay(1400);await p.mouse.up();});
 if(!only)await record('04-living-universe',base+'?preview=explore',10,async p=>{await delay(6000);const b=await p.locator('[data-star="12"]').boundingBox();await p.mouse.click(b.x+b.width/2,b.y+b.height/2);});
 const clips=['01-opening','02-climax','03-star-letter','04-living-universe'];
 await writeFile(`${out}/clips.txt`,clips.map(n=>`file '${n}.mp4'`).join('\n'));
 const concat=spawn(ffmpeg,['-y','-loglevel','error','-f','concat','-safe','0','-i',`${out}/clips.txt`,'-c','copy','-movflags','+faststart',`${out}/本轮四个重点-无声录屏.mp4`],{stdio:'inherit'});
 const [code]=await once(concat,'close');if(code!==0)throw Error('Video concatenation failed');
 await writeFile(`${out}/recording-errors.json`,JSON.stringify(errors));if(errors.length)throw Error(errors.join('\n'));
}finally{await browser.close();}
