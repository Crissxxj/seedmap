import {existsSync,mkdirSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {dirname,join} from 'node:path'
import {fileURLToPath} from 'node:url'
const dir=dirname(fileURLToPath(import.meta.url))
const run=(cmd,args)=>{const r=spawnSync(cmd,args,{cwd:dir,stdio:'inherit',shell:true});if(r.status!==0){console.error(`\nFalló: ${cmd}`);process.exit(1)}}
if(spawnSync('emcc',['--version'],{shell:true,stdio:'ignore'}).status!==0){
  console.error('No encuentro emcc. Ejecuta C:\\emsdk\\emsdk_env.ps1 en esta misma terminal.');process.exit(1)}
if(!existsSync(join(dir,'cubiomes')))run('git',['clone','--depth','1','https://github.com/Cubitect/cubiomes.git'])
mkdirSync(join(dir,'obj'),{recursive:true});mkdirSync(join(dir,'..','src','wasm'),{recursive:true})
const srcs=[['api.c','api'],...['noise','biomes','layers','biomenoise','generator','finders','util'].map(f=>[`cubiomes/${f}.c`,f])]
for(const [s,o] of srcs)run('emcc',['-O3','-c',s,'-Icubiomes','-o',`obj/${o}.o`])
run('emcc',[...srcs.map(([,o])=>`obj/${o}.o`),'-O0','-sMODULARIZE','-sEXPORT_ES6','-sENVIRONMENT=web,worker','-sALLOW_MEMORY_GROWTH',
 '-sEXPORTED_FUNCTIONS=_set_world,_px_ptr,_out_ptr,_render,_find_structs,_render_ex,_ex_ptr','-sEXPORTED_RUNTIME_METHODS=HEAPU8,HEAP32','-o','../src/wasm/cubiomes.js'])
console.log('\nListo: src/wasm/cubiomes.js + cubiomes.wasm')