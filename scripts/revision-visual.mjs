async function hold(p){const b=await p.locator('#hold-breath').boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await p.waitForTimeout(1400);await p.mouse.up();}
import { createRequire } from 'node:module';
import { mkdir,writeFile } from 'node:fs/promises';
const require=createRequire(import.meta.url),{chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||undefined,headless:true,args:['--disable-audio-output']});
const base=process.env.QA_URL||'http://127.0.0.1:4173/';await mkdir('artifacts/v3',{recursive:true});
const errors=[];
try{
 const page=await browser.newPage({viewport:{width:1180,height:820}});page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(['error','info'].includes(m.type()))console.log(m.type(),m.text());});
 await page.goto(base);await page.waitForTimeout(5500);await page.screenshot({path:'artifacts/v3/01-opening.png'});
 await page.goto(base+'?preview=eternity');await page.waitForTimeout(6500);await page.screenshot({path:'artifacts/v3/02-eternity.png'});
 await page.goto(base+'?preview=cake');await page.waitForTimeout(8500);await page.screenshot({path:'artifacts/v3/03-cake.png'});
 await hold(page);await page.waitForTimeout(2600);await page.screenshot({path:'artifacts/v3/04-ascent.png'});await page.waitForTimeout(3900);await page.screenshot({path:'artifacts/v3/05-unfold.png'});await page.waitForTimeout(3300);await page.screenshot({path:'artifacts/v3/06-letter.png'});
 await page.goto(base+'?preview=explore');await page.waitForTimeout(6000);await page.screenshot({path:'artifacts/v3/07-explore.png'});
 const a=await page.locator('canvas').getAttribute('data-motion');await page.waitForTimeout(2200);const b=await page.locator('canvas').getAttribute('data-motion');console.log('Motion',a,b,'Errors',errors);await page.screenshot({path:'artifacts/v3/08-explore-motion.png'});
 await page.setViewportSize({width:390,height:844});await page.goto(base);await page.waitForTimeout(5500);await page.screenshot({path:'artifacts/v3/phone-opening.png'});
 await page.goto(base+'?preview=cake');await page.waitForTimeout(7500);await page.screenshot({path:'artifacts/v3/phone-cake.png'});await hold(page);await page.waitForTimeout(10000);await page.screenshot({path:'artifacts/v3/phone-letter.png'});
 await writeFile('artifacts/v3/visual-errors.json',JSON.stringify(errors));
}finally{await browser.close();}
