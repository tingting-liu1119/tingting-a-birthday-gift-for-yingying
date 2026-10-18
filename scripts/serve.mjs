import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root=resolve(process.argv[2]||'.');const port=Number(process.env.PORT||4173);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json','.m4a':'audio/mp4','.mp3':'audio/mpeg','.png':'image/png'};
const server=http.createServer(async(req,res)=>{
  try{
    const path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    let file=resolve(root,'.'+path);if(file!==root&&!file.startsWith(root+sep))throw Error('forbidden');
    if((await stat(file)).isDirectory())file=resolve(file,'index.html');
    const data=await readFile(file);res.setHeader('Content-Type',types[extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-cache');res.setHeader('Accept-Ranges','bytes');
    if(req.headers.range){const [,start,end]=/bytes=(\d+)-(\d*)/.exec(req.headers.range)||[];const s=Number(start),e=end?Number(end):data.length-1;if(start===undefined||s>e||e>=data.length){res.writeHead(416);res.end();return;}res.writeHead(206,{'Content-Range':`bytes ${s}-${e}/${data.length}`,'Content-Length':e-s+1});res.end(data.subarray(s,e+1));}
    else {res.writeHead(200,{'Content-Length':data.length});res.end(req.method==='HEAD'?undefined:data);}
  }catch{res.writeHead(404);res.end('Not found');}
});
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://localhost:${port}`));
