/* Puente JS ↔ Cubiomes (Web Worker): no bloquea nunca el hilo principal. */
export const STRUCTS=[['#e8b04a',0],['#dccb85',0],['#6fbf73',0],['#9a7fd0',0],['#bfe3ee',0],['#4f8fd9',0],['#c0553f',0],['#a86a48',0],['#b050c8',0],['#38e6d2',0],['#c9a27a',0],['#f0a35e',0],['#7a9cc0',0],['#5f7fa0',0],['#f0d040',0],['#d4503c',1],['#8c7b6a',1],['#b050c8',1],['#e6d9f2',2]]
export const FEATURED=[11,9] // trial chambers, ancient city
export const DIMS=['Overworld','Nether','End']
// Orden de MCS en api.c. 26.3 usa el modelo más nuevo de Cubiomes (1.21.x)
export const VERSIONS=[['26.3 (modelo 1.21.x)',0],['1.21.3',1],['1.21.1',2],['1.20',3],['1.19',4],['1.18',5]]

export function parseSeed(s){
  s=s.trim()
  if(/^-?\d+$/.test(s))return BigInt.asIntN(64,BigInt(s))
  let h=0;for(const c of s)h=(Math.imul(31,h)+c.charCodeAt(0))|0 // String.hashCode de Java
  return BigInt(h)
}

let wk=null,readyP=null,idn=0
const pend=new Map()

function req(msg,transfer=[]){
  const id=++idn
  return new Promise((res,rej)=>{
    pend.set(id,{res,rej})
    wk.postMessage({...msg,id},transfer)
  })
}

export function initEngine(){
  if(readyP)return readyP
  readyP=new Promise((res,rej)=>{
    wk=new Worker(new URL('./worker.js',import.meta.url),{type:'module'})
    wk.onerror=e=>rej(new Error(e.message||'worker'))
    wk.onmessage=e=>{
      const m=e.data
      if(m.t==='ok'){res();return}
      if(m.t==='booterr'){console.error('[worker]',m.msg);rej(new Error(m.msg||'no se pudo iniciar Cubiomes'));return}
      const p=pend.get(m.id)
      if(!p)return
      pend.delete(m.id)
      p.res(m)
    }
    wk.postMessage({t:'boot'})
  })
  return readyP
}

/* Busca TODOS los tipos. items=[{i,x0,z0,x1,z1}] → [{i,x,z,v}] */
export async function searchStructs(ver,seed,items){
  const r=await req({t:'s',v:ver,seed:String(seed),items})
  const buf=new Int32Array(r.buf)
  const out=[]
  let w=0
  while(w<buf.length){
    const i=buf[w++],n=buf[w++]
    for(let k=0;k<n;k++)out.push({i,x:buf[w++],z:buf[w++],v:buf[w++]})
  }
  return out
}

/* Renderiza biomas; resuelve {rid,x,z,sx,sz,scale,data:Uint8ClampedArray RGBA} o null.
   Con iso=true devuelve una proyección isométrica (diorama): {iso,w,h,W2,H4,HZ,hmin,hmax,...}.
   ppc = px de pantalla por celda (scale·zoom) para dimensionar las teselas del diorama. */
export function renderBiomes(ver,seed,dim,x,z,sx,sz,scale,rid,iso,ppc){
  return req({t:'r',v:ver,seed:String(seed),dim,x,z,sx,sz,scale,rid,iso,ppc}).then(r=>{
    if(!r||r.buf===undefined)return null
    const base={rid:r.rid,x:r.x,z:r.z,sx:r.sx,sz:r.sz,scale:r.scale,data:new Uint8ClampedArray(r.buf)}
    return r.buf?(r.iso?{...base,iso:true,w:r.w,h:r.h,W2:r.W2,H4:r.H4,HZ:r.HZ,hmin:r.hmin,hmax:r.hmax}:base):null
  })
}
