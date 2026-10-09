const fs=require('fs');const h=fs.readFileSync(process.argv[2],'utf8');
const ms=[...h.matchAll(/<script>([\s\S]*?)<\/script>/g)];
for(const m of ms){try{new Function(m[1]);console.log('ok',m[1].length)}catch(e){console.log('ERR',e.message)}}
