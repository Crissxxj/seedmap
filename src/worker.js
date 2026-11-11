/* Worker: toda la generación de Cubiomes vive aquí; el hilo principal solo pinta. */
import createModule from './wasm/cubiomes.js'
let M=null,WV=null,WS=null
/* set_world es caro (setupGenerator×3 + applySeed×3): solo rehacer si cambia versión/seed */
function setWorld(v,seed){
  const s=BigInt(seed)
  if(WV===v&&WS===s)return
  M._set_world(v,s);WV=v;WS=s
}
self.onmessage=async e=>{
  const m=e.data
  try{await handle(m)}catch(ex){
    console.error('[worker] fallo',m&&m.t,ex)
    self.postMessage({t:'booterr',msg:'worker: '+String(ex&&ex.stack||ex)})
  }
}
async function handle(m){
  if(m.t==='boot'){
    if(M)return self.postMessage({t:'ok'})
    try{M=await createModule();self.postMessage({t:'ok'})}
    catch(ex){self.postMessage({t:'booterr',msg:String(ex)})}
    return
  }
  if(!M)return
  if(m.t==='r'){
    setWorld(m.v,m.seed)
    let ok,p3,pi
    if(m.iso){
      ok=M._render_ex(m.dim,m.x,m.z,m.sx,m.sz,m.scale)
      p3=M._px_ptr();pi=M._ex_ptr()
    }else{
      ok=M._render(m.dim,m.x,m.z,m.sx,m.sz,m.scale)
      p3=M._px_ptr();pi=0
    }
    if(!ok)return self.postMessage({t:'img',id:m.id,rid:m.rid,buf:null})
    const n=m.sx*m.sz,rgb=M.HEAPU8.subarray(p3,p3+n*3)
    if(!m.iso){
      const rgba=new Uint8ClampedArray(n*4)
      for(let i=0,j=0;i<n;i++,j+=4){const k=i*3;rgba[j]=rgb[k];rgba[j+1]=rgb[k+1];rgba[j+2]=rgb[k+2];rgba[j+3]=255}
      self.postMessage({t:'img',id:m.id,rid:m.rid,x:m.x,z:m.z,sx:m.sx,sz:m.sz,scale:m.scale,buf:rgba.buffer},[rgba.buffer])
      return
    }
    /* ---- proyección isométrica (estilo diorama) ----
       Por columna: cara superior (rombo) + laterales. Pintor: diagonales i+j lejos→cerca.
       T ≈ px de pantalla por celda (m.ppc) para que la imagen salga del tamaño del lienzo. */
    const exv=M.HEAP32.subarray(pi>>2,pi>>2+n)
    const T=Math.max(3,Math.min(18,Math.round(m.ppc||8))),W2=T/2,H4=T/4,HZ=T/11
    const ID=0xFFF,hgt=i=>exv[i]&ID
    let hmin=320,hmax=0
    for(let i=0;i<n;i++){const h=hgt(i);if(h<hmin)hmin=h;if(h>hmax)hmax=h}
    const dr=Math.max(1,hmax-hmin)
    const spanW=((m.sx+m.sz)*W2)|0,offW=(m.sz-1)*W2
    const spanH=(((m.sx+m.sz)*H4+dr*HZ+T*2)|0)+1
    const img=new Uint8ClampedArray(spanW*spanH*4)
    const rowAt=py=>py*spanW*4
    const shade=(c,f)=>Math.min(255,c*f|0)
    for(let d=0;d<=m.sx+m.sz-2;d++){
      for(let j=Math.max(0,d-m.sx+1);j<=Math.min(m.sz-1,d);j++){
        const i=d-j,idx=j*m.sx+i
        const wx=((i-j)*W2+offW)|0            // centro-x del rombo
        const h=hgt(idx)
        const wy=((i+j)*H4+(hmax-h)*HZ+2)|0   // y del pico superior del rombo
        const k=idx*3,r0=rgb[k],g0=rgb[k+1],b0=rgb[k+2]
        const br=0.76+0.30*((h-hmin)/dr)      // terreno alto = más iluminado
        const tr=shade(r0,br),tg=shade(g0,br),tb=shade(b0,br)
        // cara superior: rombo centro (wx, wy+H4), semiancho W2, semialto H4
        for(let yy=0;yy<H4*2;yy++){
          const half=Math.max(1,((yy<H4?yy+1:H4*2-yy)*W2/H4)|0)
          const row=rowAt(wy+yy)+wx*4
          for(let xx=-half;xx<half;xx++){const p=row+xx*4;img[p]=tr;img[p+1]=tg;img[p+2]=tb;img[p+3]=255}
        }
        // laterales: de los bordes inferiores del rombo hacia el nivel del valle
        const sl=shade(r0,br*0.55),slg=shade(g0,br*0.55),slb=shade(b0,br*0.55) // cara SO (izq)
        const sr=shade(r0,br*0.78),srg=shade(g0,br*0.78),srb=shade(b0,br*0.78) // cara SE (der)
        const bottom=wy+H4*2+(h-hmin)*HZ+H4  // nivel del valle + grosor mínimo
        for(let xx=-W2;xx<W2;xx++){
          const topY=xx<0?wy+H4+(xx+W2)*H4/W2:wy+H4*2-xx*H4/W2
          for(let yy=Math.max(0,topY|0);yy<bottom&&wy+yy<spanH;yy++){
            const p=rowAt(wy+yy)+(wx+xx)*4
            img[p]=xx<0?sl:sr;img[p+1]=xx<0?slg:srg;img[p+2]=xx<0?slb:srb;img[p+3]=255
          }
        }
      }
    }
    self.postMessage({t:'img',id:m.id,rid:m.rid,iso:1,x:m.x,z:m.z,sx:m.sx,sz:m.sz,scale:m.scale,
      W2,H4,HZ,hmin,hmax,buf:img.buffer,w:spanW,h:spanH},[img.buffer])
    return
  }
  if(m.t==='s'){
    setWorld(m.v,m.seed)
    const res=[]
    for(const it of m.items){
      const n=M._find_structs(it.i,it.x0,it.z0,it.x1,it.z1)
      res.push(it.i,n)
      const o=M._out_ptr()>>2,H=M.HEAP32
      for(let k=0;k<n;k++)res.push(H[o+k*3],H[o+k*3+1],H[o+k*3+2])
    }
    const buf=Int32Array.from(res)
    self.postMessage({t:'found',id:m.id,buf:buf.buffer},[buf.buffer])
  }
}
