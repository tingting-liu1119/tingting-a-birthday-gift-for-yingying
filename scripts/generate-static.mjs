import { writeFile } from 'node:fs/promises';
import { scenes,blessings } from '../src/content.js';
import { random } from '../src/universe.js';
const rand=random(814),p=[];
for(let i=0;i<16000;i++){
 const t=rand()*Math.PI*2,r=330+(rand()+rand()+rand()-1.5)*80;
 const x=600+Math.cos(t)*r,y=400-Math.sin(t)*r*.76;
 p.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(.25+rand()*.65).toFixed(2)}" opacity="${(.1+rand()*.48).toFixed(2)}"/>`);
}
for(let i=0;i<600;i++)p.push(`<circle cx="${(rand()*1200).toFixed(1)}" cy="${(rand()*800).toFixed(1)}" r=".55" opacity="${(.05+rand()*.25).toFixed(2)}"/>`);
await writeFile('assets/fallback-universe.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><rect width="1200" height="800" fill="#020203"/><g fill="#e5e2da">${p.join('')}</g></svg>`);
const cake=[];
for(let i=0;i<6500;i++){
 const tier=rand()<.58?0:1,r=tier?62:96,low=tier?105:150,high=tier?70:105,a=rand()*Math.PI*2,part=rand();
 const radius=part<.65?r:r*Math.sqrt(rand());
 const x=160+Math.cos(a)*radius,y=(part<.65?high+rand()*(low-high):high)+Math.sin(a)*radius*.24;
 cake.push(`<circle cx="${x.toFixed(2)}" cy="${y.toFixed(2)}" r="${(.2+rand()*.55).toFixed(2)}" opacity="${(.15+rand()*.55).toFixed(2)}"/>`);
}
for(let i=0;i<170;i++)cake.push(`<circle cx="${(159+rand()*2).toFixed(2)}" cy="${(31+rand()*39).toFixed(2)}" r=".4" opacity=".6"/>`);
await writeFile('assets/particle-cake.svg',`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200"><g fill="#eee6d3">${cake.join('')}</g></svg>`);
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
await writeFile('letter.html',`<!doctype html><html lang="zh-CN"><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>致莹莹酱的十九岁 · 完整的信</title><style>body{background:#050506;color:#ded9cd;font:18px/2.1 'Songti SC',serif;max-width:680px;margin:80px auto;padding:0 25px}h1{font-size:28px;font-weight:400}h2{font-size:21px;font-weight:400;margin-top:70px}p{white-space:pre-line}a{color:#c3b390}</style><h1>飘向宇宙尽头</h1><p>致莹莹酱的十九岁。——婷婷酱</p>${scenes.map(s=>`<section><h2>${escape(s.name)}</h2>${s.lines.map(l=>`<p>${escape(l)}</p>`).join('')}</section>`).join('')}${blessings.map(([t,s])=>`<section><h2>${escape(t)}</h2><p>${escape(s)}</p></section>`).join('')}<p><a href="./">返回星空</a></p></html>`);
console.log('Generated fallback galaxy and full accessible letter.');
