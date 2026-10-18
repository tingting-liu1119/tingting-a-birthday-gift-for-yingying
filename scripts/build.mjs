import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
await import('./generate-static.mjs');
await rm('dist',{recursive:true,force:true});await mkdir('dist',{recursive:true});
for(const name of ['index.html','letter.html','src','assets'])await cp(name,`dist/${name}`,{recursive:true});
await mkdir('dist/docs');await cp('docs/audio-analysis.json','dist/docs/audio-analysis.json');await writeFile('dist/.nojekyll','');
console.log('Built dist/ — dependency-free static site, all resource paths relative.');
