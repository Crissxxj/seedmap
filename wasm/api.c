#include <emscripten.h>
#include <stdlib.h>
#include "generator.h"
#include "finders.h"
#include "util.h"
#define MAXOUT 16384
static Generator gs[3]; static int mc=MC_NEWEST; static uint64_t seed;
static unsigned char colors[256][3];
static int *cache; static size_t ccap; static unsigned char *px; static size_t pcap;
static int outbuf[MAXOUT*3];
/* Mismo orden que STRUCTS en src/engine.js */
static const int TYPES[]={Village,Desert_Pyramid,Jungle_Pyramid,Swamp_Hut,Igloo,Monument,Mansion,Outpost,Ruined_Portal,Ancient_City,Trail_Ruins,Trial_Chambers,Shipwreck,Ocean_Ruin,Treasure,Fortress,Bastion,Ruined_Portal_N,End_City};
static const int DIMI[]={0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,1,1,2}; /* 0=Overworld 1=Nether 2=End */
static const int DIMV[]={DIM_OVERWORLD,DIM_NETHER,DIM_END};
static const int MCS[]={MC_NEWEST,MC_1_21_3,MC_1_21_1,MC_1_20,MC_1_19,MC_1_18};
EMSCRIPTEN_KEEPALIVE void set_world(int mcIndex,int64_t s){
  mc=MCS[mcIndex]; seed=(uint64_t)s; initBiomeColors(colors);
  for(int d=0;d<3;d++){setupGenerator(&gs[d],mc,0);applySeed(&gs[d],DIMV[d],seed);}
}
EMSCRIPTEN_KEEPALIVE unsigned char* px_ptr(){return px;}
EMSCRIPTEN_KEEPALIVE int* out_ptr(){return outbuf;}
/* Altura estimada de superficie por bioma (para la vista diorama).
   Overworld: depth de getBiomeDepthAndScale ≈ (y-64)/17. Nether/End: relieve fijo por bioma. */
static int surface_height(int dim,int id){
  double d,s;int gr;
  if(dim!=0){
    if(dim==1){
      switch(id){
      case soul_sand_valley:return 58;
      case basalt_deltas:return 78;
      case warped_forest:return 62;
      case crimson_forest:return 68;
      default:return 66;
      }
    }
    switch(id){
    case end_highlands:return 78;
    case end_midlands:return 68;
    case end_barrens:return 67;
    case small_end_islands:return 52;
    default:return 40;
    }
  }
  getBiomeDepthAndScale(id,&d,&s,&gr);
  int h=(int)(64+d*17);
  return h<4?4:(h>200?200:h);
}
/* Como render(), pero además llena ex_ptr(): por celda (bioma<<12)|(altura&0xFFF) */
static int *ex; static size_t xcap;
EMSCRIPTEN_KEEPALIVE int* ex_ptr(){return ex;}
EMSCRIPTEN_KEEPALIVE int render_ex(int dim,int x,int z,int sx,int sz,int scale){
  Generator *g=&gs[dim]; Range r={scale,x,z,sx,sz,scale==1?63:15,1};
  size_t need=getMinCacheSize(g,scale,sx,1,sz);
  if(need>ccap){free(cache);cache=malloc(need*sizeof(int));ccap=need;}
  size_t pneed=(size_t)sx*sz*3;
  if(pneed>pcap){free(px);px=malloc(pneed);pcap=pneed;}
  size_t xneed=(size_t)sx*sz;
  if(xneed>xcap){free(ex);ex=malloc(xneed*sizeof(int));xcap=xneed;}
  if(genBiomes(g,cache,r)) return 0;
  biomesToImage(px,colors,cache,sx,sz,1,0);
  for(int i=0;i<sx*sz;i++) ex[i]=(cache[i]<<12)|(surface_height(dim,cache[i])&0xFFF);
  return 1;
}
/* Renderiza sx*sz celdas de una dimension; cada celda = scale bloques. RGB en px_ptr() */
EMSCRIPTEN_KEEPALIVE int render(int dim,int x,int z,int sx,int sz,int scale){
  Generator *g=&gs[dim]; Range r={scale,x,z,sx,sz,scale==1?63:15,1};
  size_t need=getMinCacheSize(g,scale,sx,1,sz);
  if(need>ccap){free(cache);cache=malloc(need*sizeof(int));ccap=need;}
  size_t pneed=(size_t)sx*sz*3;
  if(pneed>pcap){free(px);px=malloc(pneed);pcap=pneed;}
  if(genBiomes(g,cache,r)) return 0;
  biomesToImage(px,colors,cache,sx,sz,1,0); return 1;
}
static int fdiv(int a,int b){int q=a/b;return (a%b!=0&&((a<0)!=(b<0)))?q-1:q;}
/* Bioma de superficie en el centró del chunk (escala 4, y~79), como hace isViableStructurePos */
static int sampleSurface(int x,int z){
  int sxi=(x>>4)*4+2, szi=(z>>4)*4+2;
  return getBiomeAt(&gs[0],0,sxi,319>>2,szi);
}
/* Código de variante por tipo:
   Village: 0..4=plains/desert/savanna/taiga/snowy, +8=zombie
   Bastion: 0..3=housing/hoglin/treasure/bridge
   Igloo:   0 normal, 1 con sótano
   Ocean_Ruin: 0 warm, 1 cold
   Ruined_Portal(_N): bits underground=1, giant=2 (0=normal) */
static int struct_variant(int idx,int t,int x,int z){
  StructureVariant sv; int id;
  switch(t){
  case Village:{
    if(mc<MC_1_18)return 0;
    const int vv[5]={plains,desert,savanna,taiga,snowy_tundra};
    int cx=x>>4,cz=z>>4;
    for(int i=0;i<5;i++){
      if(!getVariant(&sv,Village,mc,seed,x,z,vv[i]))continue;
      int sxp=(cx*32+2*sv.x+sv.sx-1)/2>>2;
      int szp=(cz*32+2*sv.z+sv.sz-1)/2>>2;
      id=getBiomeAt(&gs[0],0,sxp,319>>2,szp);
      if(id==vv[i]||(id==meadow&&vv[i]==plains))
        return sv.abandoned?i+8:i;
    }
    return 0;
  }
  case Bastion:{
    if(!getVariant(&sv,Bastion,mc,seed,x,z,-1))return 0;
    int s=sv.start;return s>=0&&s<4?s:0;
  }
  case Igloo:
    if(!getVariant(&sv,Igloo,mc,seed,x,z,0))return 0;
    return sv.basement?1:0;
  case Ruined_Portal:
    id=sampleSurface(x,z);
    if(!getVariant(&sv,Ruined_Portal,mc,seed,x,z,id))return 0;
    return (sv.underground?1:0)|(sv.giant?2:0);
  case Ruined_Portal_N:{
    id=getBiomeAt(&gs[1],4,(x>>4)*4+2,8,(z>>4)*4+2);
    if(!getVariant(&sv,Ruined_Portal_N,mc,seed,x,z,id))return 0;
    return sv.giant?2:0;
  }
  case Ocean_Ruin:{
    id=sampleSurface(x,z);
    int cold=(id==frozen_ocean||id==deep_frozen_ocean||id==cold_ocean||id==deep_cold_ocean||id==frozen_river||id==snowy_beach);
    return cold?1:0;
  }
  default:return 0;
  }
}
/* Estructuras en [x0,x1]x[z0,z1]. Salida: triples x,z,variante en out_ptr() */
EMSCRIPTEN_KEEPALIVE int find_structs(int idx,int x0,int z0,int x1,int z1){
  int t=TYPES[idx]; StructureConfig sc; int n=0; Generator *g=&gs[DIMI[idx]];
  if(!getStructureConfig(t,mc,&sc)) return 0;
  int len=sc.regionSize*16;
  for(int rz=fdiv(z0,len);rz<=fdiv(z1,len);rz++)
   for(int rx=fdiv(x0,len);rx<=fdiv(x1,len);rx++){
    Pos p; if(!getStructurePos(t,mc,seed,rx,rz,&p)) continue;
    if(p.x<x0||p.x>x1||p.z<z0||p.z>z1) continue;
    if(!isViableStructurePos(t,g,p.x,p.z,0)) continue;
    if(n<MAXOUT){int b=n*3;outbuf[b]=p.x;outbuf[b+1]=p.z;outbuf[b+2]=struct_variant(idx,t,p.x,p.z);n++;}
   }
  return n;
}
