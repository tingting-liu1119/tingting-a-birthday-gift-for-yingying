import test from 'node:test';
import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{scenes,blessings,timeline,DURATION,CAKE_CUE,LETTER_CUE,LETTER_START,FINAL_START,letterParagraphs,advanceFilm,cueAt}from'../src/content.js';
import{BreathAccumulator,breathFeatures}from'../src/breath.js';
const approved=JSON.parse(readFileSync(new URL('./approved-copy.json',import.meta.url)));
test('all approved words remain, including the complete letter and twelve blessings',()=>{
 assert.deepEqual(scenes.flatMap(s=>s.lines),approved.lines);assert.deepEqual(blessings,approved.blessings);
 assert.equal(letterParagraphs.join(''),scenes.find(s=>s.id==='nineteen').lines.join('').replaceAll('\n',''));
 assert.equal(timeline.filter(c=>c.scene==='nineteen'&&c.kind==='text').length,0);
 assert.equal(timeline.filter(c=>c.kind==='letter').length,1);
});
test('every stage is continuous and the main quote keeps its reading time',()=>{
 for(let i=0;i<timeline.length;i++){const c=timeline[i];assert.equal(c.start,i?timeline[i-1].end:0);assert.equal(cueAt(c.start),c);assert.equal(cueAt(c.end-.001),c);assert.ok(c.length>0);}
 assert.equal(timeline.find(c=>c.scene==='eternity').length,15);assert.equal(DURATION,timeline.at(-1).end);
});
test('manual journey waits, auto mode progresses, cake and full letter never auto-skip',()=>{
 assert.equal(advanceFilm(0,1000,{manual:true}),timeline[0].end-1);
 assert.ok(advanceFilm(timeline[0].end-.1,.5,{manual:false})>timeline[0].end);
 assert.equal(advanceFilm(CAKE_CUE.end-1,20),CAKE_CUE.end-.001);
 assert.ok(advanceFilm(CAKE_CUE.end-.1,.3,{released:true})>LETTER_START);
 assert.equal(advanceFilm(LETTER_CUE.start,100,{released:true}),LETTER_CUE.start+3);
 assert.ok(advanceFilm(FINAL_START,.5,{released:true,letterRead:true})>FINAL_START);
});
test('breath requires sustained broadband input, not a short transient or steady tone',()=>{
 const b=new BreathAccumulator(),quiet={rms:.006,high:.1,flatness:.01};for(let i=0;i<15;i++)b.sample(quiet,.05);
 assert.equal(b.sample({rms:.4,high:.6,flatness:.4},.05)<1,true);
 for(let i=0;i<25;i++)b.sample({rms:.2,high:.01,flatness:.002},.05);assert.equal(b.progress,0);
 for(let i=0;i<14;i++)b.sample({rms:.12,high:.6,flatness:.35},.05);assert.equal(b.progress,1);
});
test('silent microphone remains finite and cannot trigger the candle',()=>{
 const f=breathFeatures(new Float32Array(2048),new Float32Array(1024).fill(-Infinity),48000);
 assert.equal(f.rms,0);assert.equal(f.high,0);const b=new BreathAccumulator();for(let i=0;i<200;i++)assert.equal(b.sample(f,.05),0);
});
