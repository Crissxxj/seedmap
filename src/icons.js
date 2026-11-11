/* Iconos pixel-art 8×8 estilo Minecraft por estructura y variante.
   ¿Iconos tuyos? Suelta PNGs en src/icons/custom/ con el nombre de la clave
   (mirar src/icons/custom/LEEME.txt) y se usan automáticamente en el mapa y las listas. */

const PAL={
  o:'#0e141b',O:'#39404a',
  r:'#b03a30',R:'#7a271f',
  h:'#e6e2d8',H:'#b8b4aa',
  d:'#5a4632',W:'#7a5230',w:'#a2703c',
  g:'#7fb743',G:'#5d8f33',a:'#93ac3e',
  s:'#e8dc9e',S:'#cfb87c',
  t:'#8f9296',T:'#6c7076',
  m:'#4ea5a0',M:'#2f7f7c',
  b:'#3f7cd6',B:'#2c5ba8',
  n:'#eef6fc',N:'#c2d8e8',
  y:'#f2c94c',Y:'#c7982e',
  p:'#b04ee0',P:'#7a2f9d',
  k:'#5b1f1d',K:'#8a3a34',
  c:'#3ce6c8',C:'#1fa08c',
  e:'#e4dfb2',E:'#a8a274',
  u:'#c1683a',U:'#83402a',
  v:'#7ca23a',V:'#437a24',
  l:'#4a4e57',L:'#33363d',
  f:'#f0842f',x:'#8f56c2',q:'#fff2c4'
}

/* Arte 8×8 (8 filas de 8 columnas) */
const ART={
  village_plains:['........','..rrrr..','.rrrrrr.','.rrrrrr.','.hhddhh.','.hhddhh.','.Ghhhhg.','.gggggg.'],
  village_desert:['........','.SsSSsS.','.SoSSoS.','.SoSSoS.','.SSddSS.','.SSddSS.','.ssssss.','ssssssss'],
  village_savanna:['........','..UUUU..','.UUUUUU.','.uuuuuu.','.uodduo.','.uodduo.','.uuuuuu.','.aaaaaa.'],
  village_taiga:['........','..LLLL..','.LLLLLL.','.LLLLLL.','.wwddww.','.wwddww.','.WwwwwW.','.GGGGGG.'],
  village_snowy:['........','..nnnn..','.nnnnnn.','.NNNNNN.','.hhddhh.','.hhddhh.','.NhhhhN.','.nnnnnn.'],
  village_zombie:['........','..RRRR..','.RRRRRR.','.RRRRRR.','.vodvov.','.vodvov.','.VvvvvV.','.gggggg.'],
  desert_pyramid:['...SS...','..SSSS..','.SSSSSS.','.SSSSSS.','SSSbbSSS','SSSbbSSS','SSSSSSSS','ssssssss'],
  jungle_temple:['...vv...','..TvTv..','.TtvttT.','.TtTTtT.','.TtddtT.','.TtddtT.','.TTTTTT.','ggGggGgg'],
  witch_hut:['........','.WWWWWW.','.LxxLlL.','.LLLLLL.','..L..L..','..w..w..','bbw..wbb','bbbbbbbb'],
  igloo:['........','..nnnn..','.nnnnnn.','.NbbNnn.','.nnddnn.','.nnddnn.','.nnnnnn.','.nnnnnn.'],
  igloo_basement:['........','..nnnn..','.nnnnnn.','.nNddNn.','.llllll.','.lCCCll.','.llCCll.','llllllll'],
  monument:['........','..M..M..','..MMMM..','.MMyyMM.','.MMyyMM.','.MMMMMM.','bbMMMMbb','bbbbbbbb'],
  mansion:['........','.rrrrrr.','.rrrrrr.','.WWWWWW.','.WoddoW.','.WoddoW.','.WoddoW.','.gggggg.'],
  outpost:['...RRR..','....w...','..wwww..','..wlow..','..wwww..','..wlow..','.wwwwww.','.TTTTTT.'],
  ruined_portal:['........','.dd..dd.','.dpp.dd.','.d.p..d.','..dppd..','........','.o....o.','.gggggg.'],
  ruined_portal_giant:['..dddd..','.d....d.','.d....d.','.d.pp.d.','.d.pp.d.','.d....d.','.dddd...','.gggggg.'],
  ruined_portal_n:['........','.dd..dd.','.dpp.dd.','.d.p..d.','..dppd..','........','.fk..kf.','.kkkkkk.'],
  ancient_city:['........','..LLLL..','.LccllL.','.LLCLLL.','.LlccLL.','..LLLL..','.l....l.','llllllll'],
  trail_ruins:['........','.tT..tT.','.Tt..tT.','.Tt...T.','.vt..tv.','.Tt..tT.','.t....t.','.gggggg.'],
  trial_chamber:['........','..LLLL..','.LuuuuL.','.LuYYuL.','.LuuuuL.','..LLLL..','.f....f.','llllllll'],
  shipwreck:['...hh...','...hh...','...hh...','.WWWWWW.','.wwwwww.','..wwww..','...ww...','.bbbbbb.'],
  ocean_ruin_warm:['........','...Ss...','..Ss.S..','..S..Ss.','..s..S..','.Ss..Ss.','.S....S.','bSbbbbbb'],
  ocean_ruin_cold:['........','...tT...','..t..T..','..t..T..','..G..t..','..G..T..','.tT..tT.','btbbbbbb'],
  treasure:['........','.dddddd.','.dyyyyd.','.dyddyd.','.dyyyyd.','.dddddd.','.ssssss.','ssssssss'],
  fortress:['........','..LLLL..','LLLLLLLL','..LLLL..','..LLLL..','..LLLL..','.k....k.','kkkkkkkk'],
  bastion_housing:['........','..dddd..','.dyddyd.','.dddddd.','.ddyydd.','..dddd..','.k....k.','kkkkkkkk'],
  bastion_hoglin:['........','..dddd..','.dKddKd.','.dKKKKd.','.dddddd.','..dddd..','.k....k.','kkkkkkkk'],
  bastion_treasure:['........','..dddd..','.dyddyd.','.dyYYyd.','.dyyyyd.','..dddd..','.k....k.','kkkkkkkk'],
  bastion_bridge:['........','.dddddd.','dd....dd','dd....dd','dd....dd','..f..f..','.dddddd.','kkkkkkkk'],
  end_city:['........','...x....','...ee...','..eeee..','..exxe..','..eeee..','.eeeeee.','eeeeeeee']
}

/* 19 tipos (mismo orden que STRUCTS en engine.js) → sprite "base" */
const PLAIN=[
  'village_plains','desert_pyramid','jungle_temple','witch_hut','igloo',
  'monument','mansion','outpost','ruined_portal','ancient_city',
  'trail_ruins','trial_chamber','shipwreck','ocean_ruin_warm','treasure',
  'fortress','bastion_housing','ruined_portal_n','end_city']

export const BASE_NAMES=[
  'Village','Desert Pyramid','Jungle Pyramid','Witch Hut','Igloo',
  'Ocean Monument','Woodland Mansion','Pillager Outpost','Ruined Portal','Ancient City',
  'Trail Ruins','Trial Chambers','Shipwreck','Ocean Ruins','Buried Treasure',
  'Nether Fortress','Bastion Remnant','Ruined Portal (Nether)','End City']

const VARIANT_OF={
  0:v=>({type:'village',b:v&7,zombie:v>=8}),
  16:v=>({type:'bastion',s:v}),
  4:v=>({type:'igloo',b:v}),
  13:v=>({type:'ocean',b:v}),
  8:v=>({type:'portal',v}),
  17:v=>({type:'portal',v,dimN:1})
}
function varName(V){
  switch(V.type){
  case 'village':return V.zombie?'Zombie Village':['Plains','Desert','Savanna','Taiga','Snowy'][V.b]+' Village'
  case 'bastion':return ['Housing','Hoglin Stable','Treasure','Bridge'][V.s]+' Bastion'
  case 'igloo':return V.b?'Igloo (Basement)':'Igloo'
  case 'ocean':return V.b?'Ocean Ruins (Cold)':'Ocean Ruins (Warm)'
  case 'portal':return V.g?'Giant Ruined Portal':V.u?'Underground Ruined Portal':'Ruined Portal'
  default:return ''
  }
}
function varKey(V){
  switch(V.type){
  case 'village':return V.zombie?'village_zombie':['village_plains','village_desert','village_savanna','village_taiga','village_snowy'][V.b]
  case 'bastion':return ['bastion_housing','bastion_hoglin','bastion_treasure','bastion_bridge'][V.s]
  case 'igloo':return V.b?'igloo_basement':'igloo'
  case 'ocean':return V.b?'ocean_ruin_cold':'ocean_ruin_warm'
  case 'portal':return V.g?'ruined_portal_giant':V.dimN?'ruined_portal_n':'ruined_portal'
  default:return PLAIN[V.t]
  }
}
/* Nombre inglés completo de una estructura hallada */
export function label(t,v=0){
  const V=VARIANT_OF[t]
  if(V){const n=varName(V(v));if(n)return n}
  return BASE_NAMES[t]
}
/* Clave del sprite de una estructura hallada */
export function iconKey(t,v=0){
  const V=VARIANT_OF[t]
  if(V)return varKey(V(v))
  return PLAIN[t]
}
/* Sprite representativo de cada tipo p/ chips */
export const mainKey=t=>PLAIN[t]

if(import.meta.env.DEV){
  for(const [k,rows] of Object.entries(ART))
    rows.forEach((r,i)=>{if(r.length!==8)console.warn(`[icons] ${k} fila ${i} = ${r.length} cols: "${r}"`)})
}

/* ---------- motor de sprites ---------- */
const custom=import.meta.glob('./icons/custom/*.png',{eager:true,query:'?url',import:'default'})
const urls={},cache={}
function builtinCanvas(key){
  const rows=ART[key]
  const c=document.createElement('canvas');c.width=8;c.height=8
  const x=c.getContext('2d')
  rows&&rows.forEach((row,y)=>{for(let i=0;i<8;i++){const ch=row[i];if(ch&&ch!=='.'){x.fillStyle=PAL[ch]||'#f0f';x.fillRect(i,y,1,1)}}})
  return c
}
/* URL para <img> (listas/chips) */
export function iconURL(key){
  if(urls[key])return urls[key]
  const cu=custom[`./icons/custom/${key}.png`]
  return urls[key]=cu||builtinCanvas(key).toDataURL()
}
/* Imagen lista para dibujar; null si aún carga (PNG personalizado) */
function imageFor(key){
  if(key in cache)return cache[key]
  const cu=custom[`./icons/custom/${key}.png`]
  if(cu){const img=new Image();cache[key]=null;img.onload=()=>cache[key]=img;img.src=cu;return null}
  const c=builtinCanvas(key);cache[key]=c;return c
}
/* Dibuja el sprite centrado en (cx,cy) con tamaño s (px, escalado pixelado) */
export function drawIcon(ctx,key,cx,cy,s){
  const img=imageFor(key)
  if(!img)return
  ctx.imageSmoothingEnabled=false
  ctx.drawImage(img,cx-s/2,cy-s/2,s,s)
}
