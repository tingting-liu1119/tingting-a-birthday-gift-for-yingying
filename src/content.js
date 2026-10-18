// 正式文字逐句保留。数组中的每一项是一张字幕，不会同时堆叠。
export const scenes = [
  { id: 'prologue', label: '序幕', name: '致莹莹酱', lines: [
    '宇宙有无数颗星星。',
    '而这一次，我想带你去看一片只属于你的星空。',
    '准备好了吗？\n我们的旅程，要开始了。',
  ] },
  { id: 'days', label: '第一幕', name: '3016天', lines: [
    '今天是我们相遇的第3016天。',
    '从小学时的开学第一天，到你十九岁的今天。\n原来我们已经认识这么久了。',
    '那时候的我们，大概都没想过，很多年以后，还会以这样的方式出现在彼此的生活里。',
    '时间带着我们向前走。\n而有些故事，居然一直没有写完。',
  ] },
  { id: 'memories', label: '第二幕', name: '那些没有被记录的瞬间', lines: [
    '其实，我本来想在这里放很多很多照片。\n想翻出一些我们一起长大的证据。',
    '结果找了半天才发现……\n除了小学毕业照，我们竟然没有第二张合影。',
    '有点好笑，也有点遗憾。',
    '不过好在，相册里没留下的那些日子，也并没有真的消失。\n至少，我还记得。',
  ] },
  { id: 'orbits', label: '第三幕', name: '远近之间', lines: [
    '后来，我们也走过了很多不一样的阶段。',
    '有过聊到停不下来的时候，\n有过很久很久不联系的时候，',
    '也有过争吵、别扭，和那些说不清的情绪。\n我们并不是一直亲密无间。',
    '但很奇妙的是，\n兜兜转转这么多年，\n你依然是我心里很特别的一个人。',
    '就像宇宙里的两颗星星。\n有时靠近，有时远离。',
    '各自沿着自己的轨道向前，\n却始终记得，曾经交会的那一刻。',
  ] },
  { id: 'eternity', label: '第四幕', name: '12万亿年', lines: [
    '“下次和你相遇，就要等12万亿年之后了。”',
    '宇宙这么大。\n时间这么漫长。',
    '有那么多擦肩而过，\n也有那么多来不及说再见。',
    '而我们居然在这短短的一生里，\n从茫茫人海中遇见，\n又陪伴彼此走过了这么多年。',
    '所以我想，\n如果相遇真的需要跨越漫长的时间，',
    '那这一次，\n我们已经足够幸运。',
  ] },
  { id: 'cake', label: '第五幕', name: '粒子蛋糕', duration: 8, interactive: true, lines: [] },
  { id: 'nineteen', label: '第六幕', name: '写给十九岁的你', leadIn: 8.4, lines: [
    '莹莹酱，十九岁生日快乐。',
    '十九岁，是一个很特别的年纪。',
    '世界正在一点点向你展开，而你也会慢慢走向更远的地方。',
    '我希望你始终拥有探索世界的勇气，也拥有遵从自己内心的自由。',
    '希望你遇见更广阔的天地，见识更多不一样的风景，去体验、去感受，去成为你真正想成为的人。',
    '当然，也允许自己偶尔迷茫、偶尔脆弱，允许有些事情暂时找不到答案。',
    '你不必急着证明什么。\n因为人生从来不是一场必须抢先抵达的比赛。',
    '愿你有奔赴远方的勇气，也有安放自己的底气。',
    '愿你自由而坚定，柔软而有力量。\n愿未来的每一年，你都越来越喜欢自己。',
    '生日快乐，莹莹酱。\n很高兴认识你。\n——婷婷酱',
  ] },
  { id: 'finale', label: '终幕', name: '送你一整片星空', lines: [
    '如果祝福可以变成星星，\n那我想送你的，一定不止一颗。',
    '所以，我把一些还没说完的话，\n悄悄藏在了这片宇宙里。',
    '接下来，\n请你亲自去发现它们吧。',
    '点击星星，收下属于你的祝福。',
  ] },
];

export const blessings = [
  ['自由', '愿你始终拥有选择人生的自由，不必活成任何人期待的模样。'],
  ['勇气', '愿你即使面对未知，也依然有迈出下一步的勇气。'],
  ['热爱', '愿你喜欢的事物常伴左右，热爱不被岁月轻易消磨。'],
  ['温柔', '愿你被世界温柔以待，也始终保有温柔待人的能力。'],
  ['坚定', '愿你在人声嘈杂的时候，依然能听清自己内心的声音。'],
  ['快乐', '愿你拥有许多不需要理由的快乐，在平凡日子里也能找到小小的幸福。'],
  ['幸运', '愿那些你悄悄期待的好事，都在某个不经意的瞬间发生。'],
  ['成长', '愿你走过的路，无论平坦还是曲折，最终都成为滋养你的力量。'],
  ['自己', '愿你始终记得，你不需要成为谁的标准答案，你本身就是独一无二的存在。'],
  ['相遇', '愿你未来还会遇见很多很好的人，拥有很多值得珍藏的故事。'],
  ['时间', '愿很多年后的你回望十九岁，依然能温柔地拥抱此刻的自己。'],
  ['藏起来的特别祝福', '无论下一次见面是什么时候，\n无论未来我们各自走向哪里，\n我都希望你过得很好。\n\n不是因为今天是你的生日。\n而是因为，那个人是你。'],
];

export const MUSIC = { src: 'assets/audio/pxyz.m4a', duration: 179.364 };
// 原始音频响度分析结果见 docs/audio-analysis.json。阅读时间不受歌曲长度压缩。
export function readingSeconds(text, scene = '') {
  const count = [...text].filter(c => !/\s/.test(c)).length;
  return scene === 'nineteen' ? Math.max(6, 2.4 + count / 4.3) : Math.max(5.2, 2.2 + count / 4.9);
}
export function makeTimeline() {
  let cursor = 0;
  return scenes.flatMap((scene, sceneIndex) => {
    const entries=[];
    const append=(text,lineIndex,length,kind='text')=>{
      entries.push({text,scene:scene.id,sceneIndex,lineIndex,start:cursor,end:cursor+length,length,kind});cursor+=length;
    };
    if(scene.interactive)append('',-1,scene.duration,'ritual');
    if(scene.leadIn)append('',-1,scene.leadIn,'ascent');
    if(scene.id==='nineteen')append('',0,30,'letter');
    else scene.lines.forEach((text,lineIndex)=>append(text,lineIndex,scene.id==='eternity'&&lineIndex===0?15:readingSeconds(text,scene.id)));
    return entries;
  });
}
export const timeline = makeTimeline();
export const DURATION = timeline.at(-1).end;
export const CAKE_CUE = timeline.find(c => c.scene === 'cake');
export const LETTER_START = timeline.find(c => c.scene === 'nineteen').start;
export const LETTER_CUE = timeline.find(c => c.kind === 'letter');
export const FINAL_START = timeline.find(c => c.scene === 'finale').start;
export const letterParagraphs = scenes.find(s=>s.id==='nineteen').lines.flatMap(s=>s.split('\n'));
export function advanceFilm(time, delta, {released=false,letterRead=false,manual=false}={}) {
  let next=Math.min(DURATION,time+delta);
  const cue=cueAt(time);
  if(manual&&cue.kind==='text')next=Math.max(time,Math.min(next,cue.end-1));
  if(!released && time<CAKE_CUE.end && next>=CAKE_CUE.end)return CAKE_CUE.end-.001;
  if(!letterRead && time<LETTER_CUE.end && next>=LETTER_CUE.start+3)return Math.max(time,LETTER_CUE.start+3);
  return next;
}
export function cueAt(time) { return timeline.find(c => time >= c.start && time < c.end) ?? timeline.at(-1); }
export function sceneProgress(time, id) {
  const cues = timeline.filter(c => c.scene === id);
  return Math.max(0, Math.min(1, (time - cues[0].start) / (cues.at(-1).end - cues[0].start)));
}
