import {useEffect,useMemo,useRef,useState} from 'react'
import {STRUCTS,FEATURED,DIMS,VERSIONS,initEngine,parseSeed,searchStructs,renderBiomes} from './engine.js'
import {iconKey,label,iconURL,drawIcon,mainKey,BASE_NAMES} from './icons.js'

const R=5000, TAU=Math.PI*2
/* Escalas de render; se elige la más gruesa cuya celda no pase de ~7px en pantalla */
const LVL_ASC=[1,4,16,64,256]
const fmt=n=>Math.round(n).toLocaleString('es')
const clampK=k=>Math.min(4,Math.max(0.004,k))
const LS_ON='sm:on', LS_HIDE='sm:hide', LS_FEAT='sm:feat', LS_ISO='sm:iso'

export default function App(){
  const [ready,setReady]=useState(false),[err,setErr]=useState('')
  const [seed,setSeed]=useState(''),[ver,setVer]=useState(0),[cxi,setCxi]=useState('0'),[czi,setCzi]=useState('0')
  const [dim,setDim]=useState(0),[active,setActive]=useState(null),[sel,setSel]=useState(null)
  const [open,setOpen]=useState(false),[q,setQ]=useState('')
  const [on,setOn]=useState(()=>{try{const s=new Set(JSON.parse(localStorage.getItem(LS_ON)||'null'));if(s.size)return s}catch{}return new Set(STRUCTS.map((_,i)=>i))})
  const [hideDone,setHideDone]=useState(()=>localStorage.getItem(LS_HIDE)==='1')
  const [featOn,setFeatOn]=useState(()=>localStorage.getItem(LS_FEAT)!=='0')
  const [allList,setAllList]=useState(false)
  const [done,setDone]=useState(new Set())
  const [iso,setIso]=useState(()=>localStorage.getItem(LS_ISO)==='1')
  const [found,setFound]=useState([]),[searching,setSearching]=useState(false)

  const cv=useRef(),S=useRef({}),V=useRef({x:0,z:0,k:0.25}),bg=useRef(null),drag=useRef(null)
  const hits=useRef([]),hover=useRef(null),tip=useRef(),cur=useRef(),pick=useRef()
  const size=useRef({w:0,h:0,dpr:1})
  const seq=useRef(0),inflight=useRef(false),doneR=useRef(null),pendR=useRef(null),timer=useRef(0)

  /* ---------- datos y persistencia ---------- */
  const sk=active&&`sm:done:${active.seed}`
  useEffect(()=>{if(!sk)return;try{setDone(new Set(JSON.parse(localStorage.getItem(sk)||'[]')))}catch{setDone(new Set())}},[sk])
  const toggleDone=id=>setDone(d=>{const n=new Set(d);n.has(id)?n.delete(id):n.add(id);localStorage.setItem(sk,JSON.stringify([...n]));return n})
  const toggleOn=i=>setOn(s=>{const n=new Set(s);n.has(i)?n.delete(i):n.add(i);localStorage.setItem(LS_ON,JSON.stringify([...n]));return n})
  const allOn=v=>{const n=v?new Set(STRUCTS.map((_,i)=>i)):new Set();localStorage.setItem(LS_ON,JSON.stringify([...n]));setOn(n)}
  const toggleFeat=v=>{setFeatOn(v);localStorage.setItem(LS_FEAT,v?'1':'0')}
  const center=(d,a=active)=>a?(d===1?[a.cx>>3,a.cz>>3]:[a.cx,a.cz]):[0,0]

  /* ---------- acciones ---------- */
  const goToSeed=s=>{setSeed(s);const a={seed:parseSeed(s).toString(),ver,cx:parseInt(cxi)||0,cz:parseInt(czi)||0};setActive(a);setSel(null);const[bx,bz]=center(dim,a);V.current={x:bx,z:bz,k:0.25};queueRender()}
  const go=()=>{if(!ready||!seed.trim())return;goToSeed(seed.trim())}
  const rnd=()=>{setCxi('0');setCzi('0');goToSeed(String(BigInt.asIntN(64,BigInt(Math.floor(Math.random()*2**44))-(1n<<43n))))}
  const changeDim=d=>{setDim(d);setSel(null);const[x,z]=center(d);V.current={x,z,k:d===1?0.5:0.25};queueRender()}
  const goTo=f=>{setSel(f);V.current={x:f.x,z:f.z,k:Math.max(V.current.k,0.7)};queueRender()}
  const conv=up=>{const f=v=>{const n=parseInt(v,10);return isNaN(n)?'0':String(up?n*8:n>>3)};setCxi(f(cxi));setCzi(f(czi))}

  /* ---------- arranque, hash compartible, teclado ---------- */
  useEffect(()=>{
    initEngine().then(()=>{
      setReady(true)
      try{
        const h=new URLSearchParams(location.hash.slice(1))
        if(h.get('s')){
          const a={seed:parseSeed(h.get('s')).toString(),ver:Math.min(5,Math.max(0,+(h.get('v')||0))),cx:Math.round(+h.get('x'))||0,cz:Math.round(+h.get('z'))||0}
          setSeed(h.get('s'));setVer(a.ver);setCxi(String(a.cx));setCzi(String(a.cz))
          setActive(a)
          const d=Math.min(2,Math.max(0,+h.get('d')||0));setDim(d)
          V.current={x:+h.get('x')||0,z:+h.get('z')||0,k:clampK(+h.get('k')||0.25)}
        }
      }catch{}
    }).catch(ex=>setErr('No se pudo iniciar Cubiomes: '+ex.message))
  },[])
  const hashNow=()=>{const a=S.current.active;if(!a)return
    history.replaceState(null,'',`#s=${a.seed}&v=${a.ver}&x=${Math.round(V.current.x)}&z=${Math.round(V.current.z)}&d=${S.current.dim}&k=${V.current.k.toPrecision(3)}`)}
  useEffect(()=>{const h=e=>{if(e.key==='Escape')setSel(null)};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h)},[])
  useEffect(()=>{if(!open)return;const h=e=>{if(!pick.current?.contains(e.target))setOpen(false)};document.addEventListener('pointerdown',h);return()=>document.removeEventListener('pointerdown',h)},[open])

  /* ---------- búsqueda de estructuras en el Worker ---------- */
  useEffect(()=>{
    if(!active||!ready){setFound([]);setSearching(false);return}
    let alive=true;setSearching(true)
    const items=STRUCTS.map(([ ,d])=>{
      const c=d===1?[active.cx>>3,active.cz>>3]:[active.cx,active.cz]
      return{i:0,x0:c[0]-R,x1:c[0]+R,z0:c[1]-R,z1:c[1]+R}
    }).map((it,i)=>({...it,i}))
    searchStructs(active.ver,BigInt(active.seed),items).then(list=>{
      if(!alive)return
      setFound(list.map(f=>{
        const d=STRUCTS[f.i][1],c=d===1?[active.cx>>3,active.cz>>3]:[active.cx,active.cz]
        return{...f,id:`${f.i}:${f.x}:${f.z}`,d:Math.hypot(f.x-c[0],f.z-c[1]),k:iconKey(f.i,f.v),n:label(f.i,f.v)}
      }))
      setSearching(false)
    }).catch(ex=>{if(alive){setErr('Error al buscar estructuras: '+ex.message);setSearching(false)}})
    return()=>{alive=false}
  },[active,ready])

  /* ---------- render de biomas en streaming (Worker) ---------- */
  function queueRender(){
    if(timer.current)return
    timer.current=setTimeout(flush,85)
  }
  function flush(){
    clearTimeout(timer.current);timer.current=0
    if(!S.current.active)return
    const a=S.current.active,{w,h}=size.current
    if(!w)return
    const v=V.current,iso=S.current.iso,bpp=1/v.k
    let scale=1
    for(const s of LVL_ASC){if(s*v.k<=7)scale=s;else break} // celda ≤7px: grueso primero (scale 1 solo al acercar de verdad)
    // rect de vista en bloques mundo
    const vx0=v.x-w*bpp/2,vx1=v.x+w*bpp/2,vz0=v.z-h*bpp/2,vz1=v.z+h*bpp/2
    const covered=r=>!!r&&r.ver===a.ver&&r.seed===a.seed&&r.dim===S.current.dim&&r.iso===iso
      &&r.scale<=scale&&r.x0<=vx0&&r.x1>=vx1&&r.z0<=vz0&&r.z1>=vz1
    if(covered(doneR.current))return // lo pintado ya cubre la vista a esta escala: no re-render
    if(inflight.current){
      if(covered(pendR.current))return // la petición en vuelo ya traerá esto: espera
      timer.current=setTimeout(flush,120);return
    }
    inflight.current=true;hashNow()
    // margen ~40% por lado (menos en diorama) para que pan/zoom leve no dispare render
    const px=iso?0:(vx1-vx0)*0.4,pz=iso?0:(vz1-vz0)*0.4
    const x0=Math.floor((vx0-px)/scale),z0=Math.floor((vz0-pz)/scale)
    const sx=Math.ceil((vx1+px)/scale)-x0+1,sz=Math.ceil((vz1+pz)/scale)-z0+1
    const sxI=iso?Math.min(sx,241):sx,szI=iso?Math.min(sz,161):sz
    const meta={ver:a.ver,seed:a.seed,dim:S.current.dim,iso,x0:vx0-px,z0:vz0-pz,x1:vx1+px,z1:vz1+pz,scale}
    pendR.current=meta
    const rid=++seq.current
    renderBiomes(a.ver,BigInt(a.seed),S.current.dim,x0,z0,sxI,szI,scale,rid,iso,iso?scale*v.k:0).then(res=>{
      inflight.current=false
      if(!res){pendR.current=null;return} // render falló: no reencolar en bucle
      if(res.rid!==rid){pendR.current=null;queueRender();return} // llegó una respuesta vieja
      const off=document.createElement('canvas');off.width=res.iso?res.w:res.sx;off.height=res.iso?res.h:res.sz
      off.getContext('2d').putImageData(new ImageData(res.data,off.width,off.height),0,0)
      bg.current=res.iso
        ?{iso:true,off,w:res.w,h:res.h,x0:res.x,z0:res.z,scale:res.scale,sx:res.sx,sz:res.sz,W2:res.W2,H4:res.H4,HZ:res.HZ,hmin:res.hmin,hmax:res.hmax}
        :{off,x0:res.x,z0:res.z,scale:res.scale,sx:res.sx,sz:res.sz}
      doneR.current=meta;pendR.current=null
      queueRender() // si la vista cambió mientras generaba, regenera (no-op si cubre)
    })
  }
  useEffect(()=>{if(active&&ready)queueRender()},[active,dim,ready,iso])
  const toggleIso=v=>{setIso(v);localStorage.setItem(LS_ISO,v?'1':'0')}

  /* ---------- lienzo: tamaño HiDPI, rueda ---------- */
  useEffect(()=>{
    const c=cv.current
    const fit=()=>{const dpr=window.devicePixelRatio||1
      size.current={w:c.clientWidth,h:c.clientHeight,dpr}
      c.width=Math.round(c.clientWidth*dpr);c.height=Math.round(c.clientHeight*dpr)
      queueRender()}
    fit()
    const wheel=e=>{e.preventDefault();V.current.k=clampK(V.current.k*(e.deltaY<0?1.18:1/1.18));queueRender()}
    c.addEventListener('wheel',wheel,{passive:false})
    window.addEventListener('resize',fit)
    return()=>{c.removeEventListener('wheel',wheel);window.removeEventListener('resize',fit);clearTimeout(timer.current)}
  },[])

  /* ---------- bucle de dibujo = SOLO pinta, nunca genera ---------- */
  useEffect(()=>{
    let raf
    const draw=()=>{
      raf=requestAnimationFrame(draw)
      try{
      const c=cv.current,{w,h,dpr}=size.current
      if(!c||!w)return
      const ctx=c.getContext('2d')
      ctx.setTransform(dpr,0,0,dpr,0,0)
      ctx.fillStyle='#0a0e13';ctx.fillRect(0,0,w,h)
      const {active:a,dim:cd,shown:ss,done:dn,sel:sl}=S.current
      if(!a)return
      const v=V.current,b=bg.current
      let proj=null
      if(b&&b.iso){ // vista diorama: la imagen ya viene proyectada; centramos y proyectamos iconos
        const s=Math.min(w/(b.w+16),h/(b.h+16))*Math.sqrt(Math.max(.06,v.k*4)) // el zoom amplía el diorama
        ctx.imageSmoothingEnabled=false
        ctx.drawImage(b.off,w/2-b.w*s/2,h/2-b.h*s/2,b.w*s,b.h*s)
        const L=w/2-b.w*s/2,Tt=h/2-b.h*s/2
        proj=(x,z)=>{const i=x/b.scale-b.x0,j=z/b.scale-b.z0
          return[L+((i-j)*b.W2+(b.sz-1)*b.W2)*s,Tt+((i+j)*b.H4+(b.hmax-64)*b.HZ+2+b.H4)*s]}
      }else if(b){ // mapa 2D
        ctx.imageSmoothingEnabled=false
        ctx.drawImage(b.off,(b.x0*b.scale-v.x)*v.k+w/2,(b.z0*b.scale-v.z)*v.k+h/2,b.sx*b.scale*v.k,b.sz*b.scale*v.k)
        proj=(x,z)=>[(x-v.x)*v.k+w/2,(z-v.z)*v.k+h/2]
      }else proj=(x,z)=>[(x-v.x)*v.k+w/2,(z-v.z)*v.k+h/2]
      const g=ctx.createRadialGradient(w/2,h/2,Math.min(w,h)*.35,w/2,h/2,Math.max(w,h)*.78)
      g.addColorStop(0,'#0000');g.addColorStop(1,'#000b');ctx.fillStyle=g;ctx.fillRect(0,0,w,h)
      const pulse=(Math.sin(performance.now()/450)+1)/2
      ctx.imageSmoothingEnabled=false
      hits.current.length=0
      for(const f of ss){
        const [px,pz]=proj(f.x,f.z)
        if(px<-40||pz<-40||px>w+40||pz>h+40)continue
        hits.current.push({px,pz,f})
        const col=STRUCTS[f.i][0],star=FEATURED.includes(f.i),was=dn.has(f.id)
        ctx.globalAlpha=was?.32:1
        if(star&&!was){ctx.beginPath();ctx.arc(px,pz,11+pulse*5,0,TAU);ctx.strokeStyle=col;ctx.globalAlpha=.55*(1-pulse);ctx.lineWidth=2;ctx.stroke();ctx.globalAlpha=1;ctx.shadowColor=col;ctx.shadowBlur=14}
        drawIcon(ctx,f.k,px,pz,star?25:17)
        ctx.shadowBlur=0
        if(hover.current===f&&!was){ctx.beginPath();ctx.arc(px,pz,11,0,TAU);ctx.strokeStyle='#ffffffb3';ctx.lineWidth=1.5;ctx.stroke()}
        if(was){ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px-3,pz);ctx.lineTo(px-1,pz+3);ctx.lineTo(px+4,pz-3);ctx.stroke()}
        ctx.globalAlpha=1
      }
      if(sl){const [px,pz]=proj(sl.x,sl.z);ctx.beginPath();ctx.arc(px,pz,15+pulse*3,0,TAU);ctx.strokeStyle='#fff';ctx.lineWidth=2;ctx.stroke()}
      }catch(ex){if(import.meta.env.DEV)console.error('[app] draw',ex)}
    }
    raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf)
  },[])

  /* ---------- derivados ---------- */
  const inDim=found.filter(f=>STRUCTS[f.i][1]===dim)
  const shown=useMemo(()=>inDim.filter(f=>on.has(f.i)&&!(hideDone&&done.has(f.id))).sort((a,b)=>a.d-b.d),[inDim,on,hideDone,done])
  const counts=useMemo(()=>{const c=new Array(STRUCTS.length).fill(0);for(const f of inDim)c[f.i]++;return c},[inDim])
  const feat=useMemo(()=>FEATURED.map(i=>{
    const all=found.filter(f=>f.i===i).sort((a,b)=>a.d-b.d)
    return{i,all,next:all.find(f=>!done.has(f.id)),n:all.filter(f=>done.has(f.id)).length}
  }),[found,done])
  const dimStructs=STRUCTS.map((s,i)=>({s,i})).filter(({s})=>s[1]===dim)
  const onCount=dimStructs.filter(({i})=>on.has(i)).length
  const qf=x=>x.toLowerCase()
  const list=shown.filter(f=>!q||f.n.toLowerCase().includes(qf(q))||BASE_NAMES[f.i].toLowerCase().includes(qf(q)))
  const doneCount=shown.filter(f=>done.has(f.id)).length
  S.current={active,dim,shown,done,sel,iso}

  /* ---------- ratón ---------- */
  const pos=e=>{const r=cv.current.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top]}
  const nearest=(mx,mz)=>{let b=null;for(const p of hits.current){const d=Math.hypot(p.px-mx,p.pz-mz);if(d<16&&(!b||d<b.d))b={d,f:p.f}}return b?.f}
  const onDown=e=>{drag.current={sx:e.clientX,sy:e.clientY,bx:V.current.x,bz:V.current.z,moved:false};if(tip.current)tip.current.hidden=true;if(cur.current)cur.current.hidden=true;e.target.setPointerCapture(e.pointerId)}
  const onMove=e=>{
    const d=drag.current,[mx,mz]=pos(e)
    if(d){V.current={x:d.bx-(e.clientX-d.sx)/V.current.k,z:d.bz-(e.clientY-d.sy)/V.current.k,k:V.current.k};d.moved=d.moved||Math.hypot(e.clientX-d.sx,e.clientY-d.sy)>4;queueRender();return}
    const v=V.current,{w,h}=size.current
    if(cur.current){cur.current.hidden=false;cur.current.textContent=`${fmt((mx-w/2)/v.k+v.x)}, ${fmt((mz-h/2)/v.k+v.z)}`}
    const f=nearest(mx,mz);hover.current=f
    const t=tip.current
    if(t){if(f){t.hidden=false;t.style.left=mx+14+'px';t.style.top=mz+14+'px';t.innerHTML=`<img src="${iconURL(f.k)}" width="18" height="18"><b>${f.n}</b><span>${fmt(f.x)}, ${fmt(f.z)}</span>`}else t.hidden=true}
  }
  const onUp=e=>{const d=drag.current;drag.current=null;if(!d)return
    if(!d.moved){const[mx,mz]=pos(e);setSel(nearest(mx,mz))}}
  const onLeave=()=>{hover.current=null;if(tip.current)tip.current.hidden=true;if(cur.current)cur.current.hidden=true}
  const zoomBy=f=>{V.current.k=clampK(V.current.k*f);queueRender()}

  const [copied,setCopied]=useState(false)
  const doCopy=f=>{navigator.clipboard?.writeText(`/tp @s ${f.x} ~ ${f.z}`);setCopied(true);setTimeout(()=>setCopied(false),1400)}

  return <div className="app">
    <aside>
      <div className="brand">
        <span className="logo">🗺️</span>
        <div><h1>SeedMap</h1><p>Explorador de semillas de Minecraft</p></div>
      </div>
      <div className="field"><label>Seed</label><input value={seed} onChange={e=>setSeed(e.target.value)} placeholder={'Ej: 8675309 o "Gargamel"'} onKeyDown={e=>e.key==='Enter'&&go()}/></div>
      <div className="field"><label>Versión</label><select value={ver} onChange={e=>setVer(+e.target.value)}>{VERSIONS.map(([n,v])=><option key={v} value={v}>{n}</option>)}</select></div>
      <div className="field"><label>Centro</label>
        <div className="coord"><input value={cxi} onChange={e=>setCxi(e.target.value)} aria-label="Centro X" placeholder="X"/><input value={czi} onChange={e=>setCzi(e.target.value)} aria-label="Centro Z" placeholder="Z"/>
          <button className="conv" title="Overworld → Nether (÷8)" onClick={()=>conv(false)}>÷8</button>
          <button className="conv" title="Nether → Overworld (×8)" onClick={()=>conv(true)}>×8</button>
        </div>
      </div>
      <div className="cta">
        <button className="go" disabled={!ready||!seed.trim()} onClick={go}>Generar mapa</button>
        <button className="dice" title="Seed aleatoria" onClick={rnd}>🎲</button>
      </div>
      {err&&<p className="err">{err}</p>}
      <div className="tabs">{DIMS.map((n,d)=><button key={d} className={d===dim?'on':''} onClick={()=>changeDim(d)}>{n}</button>)}</div>

      <div className={'picker'+(open?' open':'')} ref={pick}>
        <button className="pickBtn" onClick={()=>setOpen(o=>!o)}>
          <i className="dot"/><span>Estructuras visibles</span><b>{onCount}/{dimStructs.length}</b><em className="chev">▾</em>
        </button>
        {open&&<div className="pop">
          <div className="popHead"><span>{DIMS[dim]}</span><div><button onClick={()=>allOn(true)}>Todas</button><button onClick={()=>allOn(false)}>Ninguna</button><button className={featOn?'fon':''}>★ {featOn?'Sí':'No'}</button></div></div>
          <div className="chips">
            {dimStructs.map(({s,i})=><button key={i} className={'chip'+(on.has(i)?' on':'')+(FEATURED.includes(i)?' star':'')} style={{'--c':s[0]}} onClick={()=>toggleOn(i)} title={FEATURED.includes(i)?'Estructura destacada':''}>
              <em><img src={iconURL(mainKey(i))} width="16" height="16" alt=""/></em><span>{BASE_NAMES[i]}</span><small>{counts[i]||''}</small>
            </button>)}
          </div>
        </div>}
      </div>
      <p className="foot">Datos generados localmente con Cubiomes · 10.000 × 10.000 bloques</p>
    </aside>

    <main>
      {active&&featOn&&<div className="hero">{feat.filter(x=>STRUCTS[x.i][1]===dim).map(({i,all,next,n})=><div key={i} className="card" style={{'--c':STRUCTS[i][0]}}>
        <em className="gem"><img src={iconURL(mainKey(i))} width="20" height="20" alt=""/></em><div>
          <h3>{BASE_NAMES[i]}</h3>
          {next?<><p className="big">{fmt(next.d)}<small> bloques</small></p><p className="co">{fmt(next.x)}, {fmt(next.z)}</p></>
                :<p className="co">{all.length?'Todas hechas ✅':'Ninguna en la zona'}</p>}
          <div className="bar"><b style={{width:all.length?`${n/all.length*100}%`:0}}/></div><p className="co">{n}/{all.length} hechas</p>
          {next&&<button onClick={()=>goTo(next)}>Ir a la más cercana →</button>}
        </div>
        <button className="cx" onClick={()=>toggleFeat(false)} aria-label="Ocultar destacadas">✕</button>
      </div>)}</div>}
      <canvas ref={cv} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onLeave}/>
      <div className="tools">
        <button title="Acercar" onClick={()=>zoomBy(1.4)}>＋</button>
        <button title="Alejar" onClick={()=>zoomBy(1/1.4)}>−</button>
        <button title="Ir al centro" onClick={()=>{const[x,z]=center(dim);V.current={x,z,k:0.25};queueRender()}}>◎</button>
        <button title="Vista diorama (isométrica)" className={iso?'on':''} onClick={()=>toggleIso(!iso)}>⛰</button>
        <button title={featOn?'Ocultar destacadas':'Mostrar destacadas'} onClick={()=>toggleFeat(!featOn)}>{featOn?'★':'☆'}</button>
      </div>
      <div ref={tip} className="tip" hidden/>
      <div ref={cur} className="cur" hidden/>
      {sel&&<div className="sel" style={{'--c':STRUCTS[sel.i][0]}}>
        <em><img src={iconURL(sel.k)} width="18" height="18" alt=""/></em>
        <div className="selTx"><b>{sel.n}</b><span>{fmt(sel.x)}, {fmt(sel.z)} · {fmt(sel.d)} bloques</span></div>
        <button onClick={()=>doCopy(sel)}>{copied?'¡Copiado! 📋':'Copiar /tp'}</button>
        <button onClick={()=>toggleDone(sel.id)}>{done.has(sel.id)?'Quitar hecha':'✓ Hecha'}</button>
        <button className="x" onClick={()=>setSel(null)} aria-label="Cerrar">✕</button>
      </div>}
      {!active&&<div className="empty"><span className="ping"/><div className="emptyTx"><b>Escribe una seed</b><p>y genera tu mapa del mundo</p></div></div>}
    </main>

    <section>
      <div className="secHead">
        <h2>{DIMS[dim]}<small> · {searching?'buscando…':`${shown.length} en ±5.000`}</small></h2>
        <span className="badgeDone">{doneCount}<i>✓</i></span>
      </div>
      <input className="search" value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar estructura…" aria-label="Buscar"/>
      <label className="chk"><input type="checkbox" checked={hideDone} onChange={e=>{setHideDone(e.target.checked);localStorage.setItem(LS_HIDE,e.target.checked?'1':'0')}}/>Ocultar hechas</label>
      <ul>
        {(allList?list:list.slice(0,10)).map(f=>{const dn=done.has(f.id);return (
          <li key={f.id} className={(dn?'done ':'')+(sel?.id===f.id?'sel ':'')}>
            <input type="checkbox" checked={dn} onChange={()=>toggleDone(f.id)} aria-label="Hecha"/>
            <button onClick={()=>goTo(f)}><em><img src={iconURL(f.k)} width="18" height="18" alt=""/></em><span><b>{f.n}</b><small>{fmt(f.x)}, {fmt(f.z)} · {fmt(f.d)} bloques</small></span></button>
          </li>)})}
        {!list.length&&<li key="none" className="none">{searching?'Buscando estructuras…':shown.length?'Ninguna coincide con la búsqueda.':'Sin estructuras visibles: actívalas en el selector.'}</li>}
      </ul>
      {list.length>10&&<button className="more" onClick={()=>setAllList(a=>!a)}>{allList?'▲ Ver menos':'▼ Ver todas ('+list.length+')'}</button>}
    </section>
  </div>
}
