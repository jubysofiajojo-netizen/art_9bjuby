import {createInterior} from './interior.mjs';
import {fitOverview,placeOverviewLabels,projectIslandBounds} from './overview-labels.mjs';
import {createSeascape} from './seascape.mjs';
import {layoutFor,bridgeStylesFor,connectionsFor} from './world.mjs';
import {createBridges} from './bridges.mjs';
import {createDecorations} from './decorations.mjs';
import {paletteFor} from './appearance.mjs';
import * as THREE from 'three';
import {OrbitControls} from '../vendor/OrbitControls.js';
import {CSS2DRenderer,CSS2DObject} from '../vendor/CSS2DRenderer.js';
import {buildNetwork,pointAt} from './navigation.mjs';
import {createResidents} from './residents.mjs';
export function createScene(host,data,{onSelect,onFailure,onHost,onResident,onFocus}){
 const ISLAND_LAYOUT=layoutFor(data.courses.length),palette=paletteFor(data.appearance);const mapExtent=Math.max(...ISLAND_LAYOUT.map(n=>Math.hypot(n.x,n.z)+n.radius)),mapWidth=Math.max(83,mapExtent*2.8);
 host.dataset.dense=String(data.courses.length>8);
 const scene=new THREE.Scene(),renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.shadowMap.enabled=true;renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.setClearColor(0xd7d0e7);
 // Labels and character prompts overlay the canvas; their wheel input must reach OrbitControls too.
 host.addEventListener('wheel',e=>{if(e.target===renderer.domElement)return;renderer.domElement.dispatchEvent(new WheelEvent('wheel',{deltaX:e.deltaX,deltaY:e.deltaY,deltaZ:e.deltaZ,deltaMode:e.deltaMode,clientX:e.clientX,clientY:e.clientY,ctrlKey:e.ctrlKey,shiftKey:e.shiftKey,altKey:e.altKey,metaKey:e.metaKey,cancelable:true,bubbles:false}));e.preventDefault();},{passive:false});
 host.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','拖曳旋轉課程群島，或使用課程清單選取');
 const leaders=document.createElementNS('http://www.w3.org/2000/svg','svg');leaders.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:hidden';leaders.setAttribute('aria-hidden','true');host.appendChild(leaders);const labelRenderer=new CSS2DRenderer();labelRenderer.domElement.style.cssText='position:absolute;inset:0;pointer-events:none;overflow:hidden';host.appendChild(labelRenderer.domElement);
 const camera=new THREE.OrthographicCamera(-40,40,30,-30,.1,Math.max(250,mapExtent*5));const cameraOffset=new THREE.Vector3(40,57,66).multiplyScalar(Math.max(1,mapExtent/35));camera.position.copy(cameraOffset).add(new THREE.Vector3(0,3,0));camera.lookAt(0,3,0);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enablePan=false;controls.enableDamping=true;controls.dampingFactor=.08;controls.minZoom=.2;controls.maxZoom=Math.max(12,mapWidth/8);controls.minPolarAngle=.2;controls.maxPolarAngle=Math.PI/2.6;controls.target.set(0,3,0);controls.update();
 const ambient=new THREE.HemisphereLight(0xfff2da,0xb8a8c5,1.9);scene.add(ambient);const sun=new THREE.DirectionalLight(0xfff7ef,2.5);sun.position.set(-30,55,22);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);Object.assign(sun.shadow.camera,{left:-mapExtent*1.25,right:mapExtent*1.25,top:mapExtent*1.25,bottom:-mapExtent*1.25,near:1,far:Math.max(140,mapExtent*5)});sun.shadow.bias=-.001;scene.add(sun);
 const mat=(color,extra={})=>new THREE.MeshStandardMaterial({color,roughness:.84,flatShading:true,...extra});
 const cream=mat('#fff0df'),rock=mat(palette.rock),grass=mat(palette.grass),wood=mat('#c9af9c'),rail=mat('#efd0a3'),green=mat('#b6c89f'),green2=mat('#e1c890'),pink=mat(palette.pink),white=mat('#fffaf1'),dark=mat('#84718d'),teal=mat(palette.roof),orange=mat('#efb77e'),purple=mat('#bba5d6');
 const artRed=mat('#d63f32'),artBlue=mat('#224b8f'),artYellow=mat('#f2c138'),artBlack=mat('#252a36'),artApple=mat('#7cc459'),prussian=mat('#1e4d7b');
 const warm=new THREE.MeshStandardMaterial({color:0xffe4a1,emissive:0xffd27c,emissiveIntensity:.1});const lamps=[];
 const water=new THREE.MeshBasicMaterial({color:'#d7d0e7'});const ocean=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(500,mapExtent*10),Math.max(500,mapExtent*10)),water);ocean.rotation.x=-Math.PI/2;ocean.position.y=-1.25;scene.add(ocean);const shadowOcean=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(150,mapExtent*4),Math.max(150,mapExtent*4)),new THREE.ShadowMaterial({color:0x514260,opacity:.16}));shadowOcean.rotation.x=-Math.PI/2;shadowOcean.position.y=-1.24;shadowOcean.receiveShadow=true;scene.add(shadowOcean);
 const mesh=(parent,geo,material,x=0,y=0,z=0)=>{let m=new THREE.Mesh(geo,material);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;};
 const box=(p,w,h,d,m,x=0,y=0,z=0)=>mesh(p,new THREE.BoxGeometry(w,h,d),m,x,y,z);
 const cyl=(p,r1,r2,h,m,x=0,y=0,z=0,n=8)=>mesh(p,new THREE.CylinderGeometry(r1,r2,h,n),m,x,y,z);
 const ball=(p,r,m,x=0,y=0,z=0)=>mesh(p,new THREE.IcosahedronGeometry(r,1),m,x,y,z);
 const cone=(p,r,h,m,x=0,y=0,z=0)=>mesh(p,new THREE.ConeGeometry(r,h,7),m,x,y,z);
 const torus=(p,r,t,m,x,y,z)=>mesh(p,new THREE.TorusGeometry(r,t,6,20),m,x,y,z);
 const lamp=(p,x,z)=>{cyl(p,.06,.08,2,dark,x,1.3,z);cyl(p,.2,.11,.16,wood,x,2.3,z);ball(p,.18,warm,x,2.55,z);lamps.push(p);};
 function tree(p,x,z,type=0,scale=1){
  const g=new THREE.Group();g.position.set(x,.25,z);g.scale.setScalar(scale);p.add(g);
  if(type===3){
   // 04 夢境奇想與變形城堡：墨西哥熱帶仙人掌＋紅黃小花
   cyl(g,.24,.28,1.55,green,0,1.0,0,10);ball(g,.24,green,0,1.78,0);
   cyl(g,.14,.16,.75,green,-.36,1.15,0,8).rotation.z=.5;ball(g,.14,green,-.52,1.45,0);
   cyl(g,.14,.16,.65,green,.34,.95,0,8).rotation.z=-.5;ball(g,.14,green,.48,1.22,0);
   ball(g,.12,artRed,0,2.04,0);ball(g,.09,artYellow,-.52,1.60,0);
   return;
  }
  cyl(g,.10,.16,1.15,wood,0,.55);
  if(type===0){
   // 01 色彩積木魔法島：蒙德里安幾何方塊樹
   box(g,.95,.75,.95,green,0,1.45,0);box(g,.55,.55,.55,artYellow,.32,1.92,.15);box(g,.48,.48,.48,artRed,-.28,1.82,-.12);box(g,.42,.42,.42,artBlue,0,2.18,0);
  }else if(type===1){
   // 02 街頭塗鴉與圓點樂園：草間彌生圓點樹
   ball(g,.78,artYellow,0,1.58,0);ball(g,.52,pink,.38,1.92,.12);
   for(const [dx,dy,dz] of [[-.42,1.6,.55],[.35,1.4,.6],[0,2.1,.45],[-.2,1.9,-.52]])ball(g,.13,artBlack,dx,dy,dz);
  }else if(type===2){
   // 03 光影捉迷藏與心情島：莫內印象派粉綠粉紫柔光樹
   ball(g,.72,green,0,1.55,0);ball(g,.55,purple,-.36,1.78,.2);ball(g,.52,pink,.38,1.82,-.15);ball(g,.42,warm,0,2.15,.1);
  }else if(type===4){
   // 05 東方巨浪與家鄉故事島：浮世繪層雲松樹＋櫻花
   for(const [dx,dy,dz,r,c] of [[0,1.35,0,.85,green],[-.45,1.7,.15,.62,green],[.45,1.85,-.1,.58,green2],[0,2.15,0,.5,green]]){
    const pad=ball(g,r,c,dx,dy,dz);pad.scale.set(1.25,.42,1.1);
   }
   for(const [dx,dy,dz] of [[-.5,1.85,.45],[.4,2.05,.35]])ball(g,.13,pink,dx,dy,dz);
  }else{
   // 中央藝術殿堂總部：美術館修剪雙球樹＋金色果實
   ball(g,.74,green,0,1.45,0);ball(g,.52,green2,0,2.15,0);
   for(const [dx,dy,dz] of [[-.5,1.5,.4],[.45,1.6,-.3],[.2,2.2,.35]])ball(g,.11,artYellow,dx,dy,dz);
  }
 }
 function island(x,z,r,accent,elevation=0){const g=new THREE.Group();g.position.set(x,elevation,z);g.userData.radius=r;g.userData.elevation=elevation;g.userData.walkRadius=Math.max(3.35,r*.75);scene.add(g);const depth=elevation+1.45;cyl(g,r*.98,r*1.08,depth,rock,0,.2-depth/2,0,7);for(let band=1;band<(elevation>2?3:2);band++){const t=band/3,rad=r*(.98+.1*t);cyl(g,rad+.01,rad+.02,.10,cream,0,.2-depth*t,0,7);}cyl(g,r,r,.25,accent,0,.14,0,7);g.userData.land=cyl(g,r*.98,r*.99,.2,grass,0,.35,0,7);cyl(g,r*1.17,r*1.15,.045,mat('#e1d4e9'),0,-1.20-elevation,0,7);return g;}

 function book(p,x,y,z,color=orange){box(p,1.05,.18,.8,color,x,y,z);box(p,.9,.12,.78,white,x,y+.13,z);box(p,1.05,.06,.8,color,x,y+.22,z);}
 function bench(p,x,z){box(p,1.3,.15,.45,wood,x,.75,z);box(p,1.3,.5,.12,wood,x,1,z-.2);for(const dx of [-.45,.45])box(p,.1,.65,.3,dark,x+dx,.35,z);}
 function house(p,color=teal){box(p,2.8,2,2.4,cream,0,1.45,0);const roof=cone(p,2.35,1.2,color,0,3.05);roof.rotation.y=Math.PI/4;box(p,.7,1.25,.08,wood,0,1.1,1.25);for(const x of [-.9,.9])box(p,.5,.6,.08,warm,x,1.65,1.25);}
 function gear(p,x,y,z){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);torus(g,.9,.16,orange,0,0,0);for(let i=0;i<8;i++){let b=box(g,.3,.5,.25,orange,Math.sin(i*Math.PI/4),Math.cos(i*Math.PI/4),0);b.rotation.z=-i*Math.PI/4;}cyl(g,.23,.23,.4,dark).rotation.x=Math.PI/2;return g;}
 const locations=new Map(),labels=[],buildingLabels=[],pickables=[],animated=[];
 const mainLayout=ISLAND_LAYOUT[0],center=island(mainLayout.x,mainLayout.z,mainLayout.radius,orange,mainLayout.elevation);locations.set('center',center);const centerLandmarkStart=center.children.length;
 cyl(center,2.5,2.8,.2,cream,0,.55,0,12);cyl(center,1,1.35,.5,white,0,.9,0);cyl(center,.7,1,5,white,0,3.5,0);for(const y of [1.7,3.1,4.5])cyl(center,.82,.86,.22,orange,0,y,0);cyl(center,1.15,1.15,.3,teal,0,6.15);cyl(center,.7,.7,.8,warm,0,6.7);cone(center,1.3,.7,teal,0,7.4);const halo=torus(center,1.05,.07,orange,0,8.25,0);animated.push({obj:halo,kind:'halo'});cone(center,.35,.8,orange,0,8.2,0);center.children.slice(centerLandmarkStart).forEach(o=>o.traverse(m=>{if(m.isMesh)m.userData.building='center';}));tree(center,-3,-1,'center');tree(center,3,-1,'center');bench(center,-2,2);bench(center,2,2);lamp(center,-3.5,2);lamp(center,3.5,2);
 // 中央島藝術畫室道具：木頭畫架、古典石膏像、調色盤與洗水皿、顏料管
 const easel=new THREE.Group();easel.position.set(-2.6,.45,1.1);easel.rotation.y=.55;center.add(easel);
 for(const dx of [-.35,.35]){const leg=box(easel,.09,1.7,.09,wood,dx,.85,0);leg.rotation.z=-dx*.25;}
 box(easel,.09,1.65,.09,wood,0,.85,-.38).rotation.x=.32;
 box(easel,1.05,.82,.08,white,0,1.18,.08).rotation.x=-.14;
 box(easel,.85,.28,.10,artBlue,0,1.32,.10).rotation.x=-.14;
 box(easel,.55,.26,.10,artYellow,-.12,1.05,.12).rotation.x=-.14;
 box(easel,.35,.24,.10,artRed,.22,1.08,.12).rotation.x=-.14;
 // 白色古典石膏像與底座
 const bust=new THREE.Group();bust.position.set(2.65,.45,1.05);bust.rotation.y=-.45;center.add(bust);
 box(bust,.78,.95,.78,cream,0,.48,0);box(bust,.62,.16,.62,white,0,1.02,0);
 cyl(bust,.26,.34,.45,white,0,1.32,0,10);cyl(bust,.11,.13,.22,white,0,1.62,0,10);ball(bust,.28,white,0,1.92,0);
 // 矮桌上的調色盤、玻璃洗筆水皿與畫筆
 const artTable=new THREE.Group();artTable.position.set(2.25,.45,-1.55);center.add(artTable);
 cyl(artTable,.55,.55,.12,wood,0,.55,0,12);cyl(artTable,.12,.16,.55,wood,0,.28,0,8);
 cyl(artTable,.28,.28,.04,white,-.16,.63,.06,12);
 for(const [px,pz,pc] of [[-.24,.12,artRed],[-.10,.15,artYellow],[-.22,-.02,artBlue]])ball(artTable,.055,pc,px,.67,pz);
 cyl(artTable,.13,.11,.24,mat('#7ec8e3',{transparent:true,opacity:.75}),.22,.72,-.05,12);
 cyl(artTable,.025,.02,.46,wood,.20,.88,-.07,6).rotation.z=.22;
 cyl(artTable,.025,.02,.42,artRed,.25,.86,-.03,6).rotation.z=-.18;
 // 長椅旁的油畫顏料管
 for(const [tx,tc] of [[-1.55,artRed],[-1.35,artYellow]]){const tube=cyl(center,.07,.09,.34,tc,tx,.52,2.45,8);tube.rotation.z=Math.PI/2;tube.rotation.y=.3;}
 // 巨大直立蠟筆（紅、黃、藍）、水彩筆、橡皮擦與地上大型調色盤
 for(const [cx,cz,cc,h] of [[-3.35,.10,artRed,1.95],[-2.95,.35,artYellow,1.7],[-3.55,.48,artBlue,2.1]]){
  const cr=new THREE.Group();cr.position.set(cx,.45,cz);center.add(cr);
  cyl(cr,.16,.16,h,cc,0,h/2,0,10);cyl(cr,.168,.168,h*.58,artBlack,0,h*.48,0,10);cyl(cr,.165,.165,h*.48,cc,0,h*.48,0,10);cone(cr,.16,.42,cc,0,h+.21,0);
 }
 for(const [bx,bz,bc] of [[3.25,-.2,artBlue],[3.55,.25,orange]]){
  const br=new THREE.Group();br.position.set(bx,.45,bz);center.add(br);
  cyl(br,.08,.11,1.65,wood,0,.82,0,10);cyl(br,.10,.10,.28,mat('#cfd5de'),0,1.76,0,10);cone(br,.11,.42,bc,0,2.10,0);
 }
 const eraser=new THREE.Group();eraser.position.set(2.95,1.0,2.25);eraser.rotation.y=-.35;center.add(eraser);
 box(eraser,.62,.85,.28,white,0,0,0);box(eraser,.64,.52,.30,artBlue,0,-.12,0);
 const bigPalette=new THREE.Group();bigPalette.position.set(-1.35,.48,-2.25);bigPalette.rotation.y=.4;center.add(bigPalette);
 const pDisc=cyl(bigPalette,1.35,1.38,.09,cream,0,0,0,16);pDisc.scale.set(1.2,1,.88);
 cyl(bigPalette,.22,.22,.11,grass,.65,.01,.35,10);
 for(const [px,pz,pc] of [[-.85,-.25,artRed],[-.45,-.65,artYellow],[.15,-.72,artBlue],[.72,-.48,green],[.88,.08,purple],[-.78,.38,orange]])ball(bigPalette,.18,pc,px,.10,pz);
 const accents=[orange,teal,orange,purple,teal,purple,orange];
 for(let i=0;i<data.courses.length;i++){const layout=ISLAND_LAYOUT[i+1],g=island(layout.x,layout.z,layout.radius,accents[i%accents.length],layout.elevation);g.rotation.y=[.12,-.22,.28,-.1,.2,-.3,.08][i%7];locations.set(data.courses[i].id,g);const landmarkStart=g.children.length;
  if(i%7===0){box(g,2.6,.35,2.4,artBlack,0,.65,0);box(g,1.3,1.8,1.3,white,-.55,1.7,-.2);box(g,1.1,1.3,1.2,artRed,.65,1.45,.2);box(g,1.2,1.1,1.1,artBlue,-.45,3.15,.15);box(g,1.0,1.4,1.0,artYellow,.6,2.85,-.15);box(g,2.4,.14,1.4,artBlack,0,2.55,0);box(g,.14,3.2,1.4,artBlack,0,2.25,0);box(g,.9,.9,.9,artRed,0,4.15,0);for(const [x,z,c] of [[-1.7,-.6,artYellow],[-1.5,.4,artRed],[1.7,-.4,artBlue],[1.5,.6,artYellow]])cyl(g,.22,.22,.10,c,x,.55,z,10);book(g,-1.8,.65,1.5,artBlue);bench(g,1.9,1.8);}
  if(i%7===1){cyl(g,1.55,1.62,.24,cream,0,.58,0,12);cyl(g,1.05,1.12,.20,artRed,0,.76,0,12);for(let s=0;s<6;s++){const a=s*Math.PI/3;ball(g,.46,artYellow,Math.sin(a)*.36,1.48,Math.cos(a)*.36);}ball(g,.72,artYellow,0,1.54,0);cyl(g,.09,.13,.40,artBlack,0,2.30,0);for(let k=0;k<8;k++){const a=k*Math.PI/4;ball(g,.11,artBlack,Math.sin(a)*.76,1.52,Math.cos(a)*.76);}torus(g,1.45,.14,artRed,0,2.1,-1.0);for(let j=0;j<7;j++){const a=-Math.PI/2+(j-3)*.32;const ray=box(g,.08,.32,.08,artYellow,Math.sin(a)*1.82,2.1+Math.cos(a)*1.82,-1.0);ray.rotation.z=-a;}for(const [x,z,c1,c2] of [[-1.35,.95,artRed,white],[-.85,1.25,pink,artYellow],[1.35,.95,artBlue,orange]]){cyl(g,.24,.24,.45,c1,x,.95,z,10);cyl(g,.24,.24,.40,c2,x,.56,z,10);}for(const [mx,mz,mc,dc,ms] of [[-2.05,-.35,artRed,white,.95],[2.05,-1.05,artYellow,artBlack,.85],[.05,-2.25,artRed,white,.80]]){const mr=new THREE.Group();mr.position.set(mx,.45,mz);mr.scale.setScalar(ms);g.add(mr);cyl(mr,.17,.22,.62,white,0,.31,0,10);const cap=ball(mr,.48,mc,0,.74,0);cap.scale.set(1.15,.65,1.15);for(const [dx,dz] of [[-.24,.28],[.25,.24],[0,-.30],[-.28,-.12],[.26,-.16]])ball(mr,.10,dc,dx,.86,dz);}const dog=new THREE.Group();dog.position.set(-.15,.45,2.20);dog.rotation.y=.25;g.add(dog);box(dog,.62,.28,.28,artApple,0,.44,0);for(const [lx,lz] of [[-.22,.09],[.22,.09],[-.22,-.09],[.22,-.09]])box(dog,.10,.34,.10,artApple,lx,.17,lz);box(dog,.34,.28,.26,artApple,.34,.68,0);box(dog,.18,.12,.20,artApple,.56,.72,0);box(dog,.18,.09,.18,artApple,.56,.58,0);box(dog,.08,.22,.08,artApple,.24,.88,.09);box(dog,.08,.22,.08,artApple,.24,.88,-.09);box(dog,.08,.26,.08,artApple,-.34,.58,0).rotation.z=.5;for(const ry of [-.16,0,.16])box(dog,.22,.055,.055,artYellow,.84,.67+ry,0).rotation.z=ry*1.5;book(g,1.8,.7,1.4,artBlue);}
  if(i%7===2){house(g,artBlue);box(g,.16,1.15,.95,warm,-1.46,1.65,0);ball(g,.26,white,-1.55,.85,1.15);cyl(g,1.5,1.5,.12,prussian,0,.58,1.65,14);for(const [x,z,c] of [[-.5,1.5,pink],[.4,1.8,white],[-.1,2.0,pink]]){cyl(g,.24,.24,.05,green,x,.66,z,8);ball(g,.14,c,x,.75,z);}box(g,1.3,.12,.45,green,0,.95,1.65);box(g,.12,1.6,1.2,artRed,1.65,1.45,-.3);for(let w=0;w<4;w++)box(g,.14,.18,1.1,w%2?artYellow:prussian,1.66,.95+w*.32,-.3).rotation.x=(w%2?.2:-.2);cyl(g,1.15,1.15,.22,white,0,3.2,0,12);ball(g,.95,artBlue,0,3.8,0);for(let k=0;k<6;k++){const a=k*Math.PI/3;ball(g,.13,artYellow,Math.sin(a)*1.05,3.95,Math.cos(a)*1.05);}}
  if(i%7===3){for(const x of [-.95,.95])box(g,.75,3.2,1.1,cream,x,2.05,0);box(g,2.7,.7,1.2,artBlue,0,3.85,0);cone(g,1.5,1.1,artYellow,0,4.75,0);cyl(g,.55,.55,.15,white,0,3.85,.65,12).rotation.x=Math.PI/2;const melt=cyl(g,.48,.42,.14,artYellow,1.25,3.4,.55,12);melt.rotation.x=Math.PI/2.5;melt.rotation.z=-.35;box(g,.32,.55,.08,artYellow,1.35,2.95,.7).rotation.z=-.15;ball(g,.60,artApple,0,1.95,.25);cyl(g,.06,.06,.35,wood,0,2.65,.25);cyl(g,.45,.45,.06,artBlack,0,2.85,.25,12);cyl(g,.26,.28,.28,artBlack,0,3.0,.25,12);for(const [x,c] of [[-1.65,artRed],[-1.55,artYellow],[1.65,pink]])ball(g,.16,c,x,1.1,.9);box(g,.55,.95,.5,artBlue,1.6,.95,-.8);box(g,.42,.65,.45,orange,1.72,1.55,-.75);book(g,-.4,.95,1.8,artRed);}
  if(i%7===4){cyl(g,1.3,1.6,.4,cream,0,.65,0,10);cyl(g,.65,.95,3.4,white,0,2.45,0,10);cyl(g,.72,.82,.35,prussian,0,3.45,0,10);cyl(g,.85,.85,.35,warm,0,4.25,0,10);cone(g,1.0,.8,artRed,0,4.85,0);for(let w=0;w<5;w++){const b=box(g,.62,.52+w*.24,1.35,prussian,-1.65+w*.34,.85+w*.22,1.05);b.rotation.z=-.28;}for(const [x,y] of [[-1.4,1.95],[-1.05,2.25]])ball(g,.26,white,x,y,1.05);cone(g,.85,1.1,prussian,1.55,1.05,-.95);cone(g,.42,.55,white,1.55,1.42,-.95);box(g,.65,.48,.42,artBlack,1.45,.82,1.15);for(const sx of [-1,1])box(g,.10,.26,.10,white,1.45+sx*.24,1.12,1.35).rotation.z=-sx*.5;cyl(g,.22,.22,.42,artRed,-1.5,.78,-1.1,10);cyl(g,.22,.22,.26,artBlack,-1.5,1.06,-1.1,10);book(g,.2,.7,1.7,prussian);}
  if(i%7===5){box(g,2,3.3,2,teal,0,2.1);box(g,2.5,.2,2.5,cream,0,3.9);cyl(g,.06,.06,1.8,dark,0,4.8);torus(g,1.1,.12,orange,0,5.8,0);ball(g,.25,warm,0,5.8,0);for(const [x,z] of [[-1.8,1.6],[1.8,1.6],[0,-2.2]]){box(g,.8,.6,.8,white,x,.9,z);box(g,.5,.4,.1,teal,x,1,.45+z);const line=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,1,z),new THREE.Vector3(0,2.8,0)]);g.add(new THREE.Line(line,new THREE.LineBasicMaterial({color:0xdf8e51})));}}
  if(i%7===6){for(const x of [-1.4,1.4]){box(g,1.6,2.2,1.7,x<0?orange:teal,x,1.7);torus(g,.75,.15,x<0?teal:orange,x,3.5,.2);box(g,.6,.7,.1,warm,x,1.8,.9);}box(g,3.4,.3,.8,wood,0,.8,2);book(g,-1.1,1,2,orange);book(g,1.1,1,2,teal);}
  if(i>=7){const variant=Math.floor(i/7);for(let v=0;v<Math.min(variant,3);v++){const x=-1.8+v*.65,h=1.4+variant*.24;box(g,.5,h,.55,v%2?purple:teal,x,.45+h/2,-1.8);cone(g,.43,.7,orange,x,.45+h+.35,-1.8);}}
  g.children.slice(landmarkStart).forEach(o=>o.traverse(m=>{if(m.isMesh)m.userData.building=data.courses[i].id;}));tree(g,-2.3,-1,i%5,.9);tree(g,2.3,-1,i%5,.75);lamp(g,-2.6,1.3);lamp(g,2.6,1.3);cyl(g,.25,.3,.25,orange,-2.1,.6,1.5);ball(g,.3,pink,-2.1,.95,1.5);
 }
 const nodes=[...locations].map(([id,g])=>({id,x:g.position.x,z:g.position.z,radius:g.userData.radius,height:g.position.y+.49,elevation:g.position.y,walkRadius:g.userData.walkRadius}));
 const connections=connectionsFor(data.courses.length),styles=bridgeStylesFor(connections.length),network=buildNetwork(nodes,connections.map((edge,i)=>[...edge,styles[i]])),walkSurfaces=[];
 const pathMat=mat('#f4dec1');for(const n of nodes){const ring=mesh(scene,new THREE.RingGeometry(n.walkRadius-.3,n.walkRadius+.3,72),pathMat,n.x,n.height-.018,n.z);ring.rotation.x=-Math.PI/2;walkSurfaces.push(ring);}
 const bridgeView=createBridges(scene,network);walkSurfaces.push(...bridgeView.surfaces);
 const residents=createResidents(scene,network,data.residents,{onResident,onHost});
 pickables.push(...residents.pickables);
 function inspectWalkways(){scene.updateMatrixWorld(true);const ray=new THREE.Raycaster(),down=new THREE.Vector3(0,-1,0),bridges=[];for(const p of network.paths.filter(p=>p.kind==='bridge')){const ends=[];for(const [key,point]of [[p.from,p.points[0]],[p.to,p.points.at(-1)]]){const g=locations.get(network.vertices[key].island),dx=p.points.at(-1).x-p.points[0].x,dz=p.points.at(-1).z-p.points[0].z,len=p.length;let hits=0;for(const width of [-(p.width||1.2)*.45,0,(p.width||1.2)*.45]){ray.set(new THREE.Vector3(point.x+dz/Math.hypot(dx,dz)*width,30,point.z-dx/Math.hypot(dx,dz)*width),down);if(ray.intersectObject(g.userData.land,false).length)hits++;}ends.push({island:network.vertices[key].island,landHits:hits,samples:3});}bridges.push({from:p.from,to:p.to,ends});}let supported=0,samples=0;const gaps=[];const surfaces=[...walkSurfaces,...[...locations.values()].map(g=>g.userData.land)];for(const p of network.paths){for(let d=0;d<=p.length;d+=.35){const pt=pointAt(p,d).point;ray.set(new THREE.Vector3(pt.x,30,pt.z),down);samples++;const hit=ray.intersectObjects(surfaces,false)[0];if(hit&&Math.abs(hit.point.y-pt.y)<.32)supported++;else gaps.push({path:p.style?.id||p.island,point:pt,surfaceY:hit?.point.y});}}return {bridges,supported,samples,gaps};}
 for(const [x,z,r,h] of [[-29,3,2.5,.5],[-13,-28,2.1,1.8],[31,-6,3.1,.35],[0,31,2.7,.9]]){const factor=Math.max(1,mapExtent/27);let g=island(x*factor,z*factor,r,cream,h);tree(g,-.7,0,2,.7);tree(g,.7,-.4,0,.8);}

 const halloween=createDecorations(scene,camera,locations,data.appearance);
 const environment=createSeascape(scene,locations);
 // 細短水紋保留安靜的海面，不使用外部紋理。
 const waveMat=mat('#ece1ed');for(let i=0;i<45;i++){let x=Math.sin(i*5.13)*37,z=Math.cos(i*2.71)*32;if([...locations.values()].some(g=>Math.hypot(x-g.position.x,z-g.position.z)<6))continue;box(scene,1.1+(i%3)*.4,.015,.055,waveMat,x,-1.2,z);}
 function courseNameFor(id){return data.courses.find(c=>c.id===id)?.name||data.center.name;}
 for(const [id,g]of locations){g.userData.islandId=id;g.traverse(o=>{if(o.isMesh){o.userData.island=id;pickables.push(o)}});const button=document.createElement('button');button.title=id==='center'?data.center.name:courseNameFor(id);button.setAttribute('aria-label',button.title);button.className='island-label'+(id==='center'?' center':'');button.dataset.island=id;const course=data.courses.find(c=>c.id===id);const plate=document.createElement('span');plate.className='island-name-plate';const number=document.createElement('b');number.textContent=id==='center'?'✦':String(course.order).padStart(2,'0');plate.append(number,document.createTextNode(id==='center'?data.center.name:course.name));button.append(plate);button.addEventListener('click',e=>{e.stopPropagation();focusIsland(id)});const object=new CSS2DObject(button);object.position.set(0,id==='center'?10.2:[7,7.4,7,7.5,6.8,8.2,6.4][data.courses.findIndex(c=>c.id===id)%7],0);g.add(object);labels.push({id,object,button});}
 for(const [id,g]of locations){const button=document.createElement('button');button.className='building-label';button.dataset.building=id;button.innerHTML=id==='center'?'<span>進入備課室 ↗</span>':'<span>教材 ↗</span>';button.setAttribute('aria-label',id==='center'?'點選中央主建築進入3D備課室':'點選主建築閱讀詳細教材');button.addEventListener('click',e=>{e.stopPropagation();enterBuilding(id);});const object=new CSS2DObject(button);object.position.set(0,id==='center'?10.2:[7,7.4,7,7.5,6.8,8.2,6.4][data.courses.findIndex(c=>c.id===id)%7],0);g.add(object);buildingLabels.push({id,object,button});}
 let reduced=false,frame=null,flight=null,selected=null,light='day',theme='morning',elapsed=0,last=0,rendering=false,shadowElapsed=0;
 let layoutKey='',overviewNeedsSpace='fit';
 function layoutLabels(){labels.forEach(l=>l.button.style.visibility=selected?'hidden':'visible');buildingLabels.forEach(l=>l.button.style.visibility=l.id===selected?'visible':'hidden');if(selected){if(layoutKey!==selected){leaders.replaceChildren();layoutKey=selected;}return;}const w=host.clientWidth,h=host.clientHeight;const key=[w,h,selected,camera.zoom,...camera.matrixWorld.elements].map(n=>typeof n==='number'?n.toFixed(3):n).join(',');if(key===layoutKey)return;layoutKey=key;const top=h<350?65:85,guideHeight=host.parentElement.querySelector('.map-guide')?.offsetHeight||45,bottom=h-Math.max(80,guideHeight+35);const entries=labels.map(l=>{const p=l.object.getWorldPosition(new THREE.Vector3()).project(camera);return {...l,w:l.button.querySelector('.island-name-plate').offsetWidth,h:l.button.querySelector('.island-name-plate').offsetHeight,rawX:(p.x+1)*w/2,rawY:(-p.y+1)*h/2};}).sort((a,b)=>a.id===selected?-1:b.id===selected?1:a.rawY-b.rawY);placeOverviewLabels(entries,w,h);
 leaders.replaceChildren();for(const l of entries){l.button.style.left=`${l.x-l.rawX}px`;l.button.style.top=`${l.y-l.rawY}px`;}}

 const personLines=document.createElementNS('http://www.w3.org/2000/svg','g');
 function layoutPeople(){if(!selected){residents.labels.forEach(l=>l.button.style.visibility='hidden');personLines.replaceChildren();return;}const selectedIsland=locations.get(selected);const w=host.clientWidth,h=host.clientHeight,hostRect=host.getBoundingClientRect(),occupied=[];const rectFor=e=>{const r=e.getBoundingClientRect();return{x:r.left-hostRect.left,y:r.top-hostRect.top,w:r.width,h:r.height};};
 for(const l of [...labels,...buildingLabels])if(l.button.style.visibility!=='hidden')occupied.push(rectFor(l.button));for(const el of host.parentElement.querySelectorAll('.map-guide,.overview,.map-heading')){const r=rectFor(el);if(r.y<h&&r.y+r.h>0)occupied.push(r);}
 const entries=[...residents.labels].sort((a,b)=>Number(b.actor.hover)-Number(a.actor.hover));if(!personLines.isConnected)leaders.appendChild(personLines);personLines.replaceChildren();
 for(const l of entries){const position=l.actor.g.position;const isHost=l.button.dataset.hostIsland;const near= Math.hypot(position.x-selectedIsland.position.x,position.z-selectedIsland.position.z)<selectedIsland.userData.radius+.7;if((isHost&&isHost!==selected)||!near){l.button.style.visibility='hidden';continue;}const p=l.object.getWorldPosition(new THREE.Vector3()).project(camera),rawX=(p.x+1)*w/2,rawY=(-p.y+1)*h/2;const bw=l.button.offsetWidth,bh=l.button.offsetHeight;if(p.z>1||rawX<-30||rawX>w+30||rawY<-30||rawY>h+30){l.button.style.visibility='hidden';continue;}l.button.style.visibility='visible';
 const fits=(x,y)=>x>=bw/2+3&&x<=w-bw/2-3&&y>=bh/2+6&&y<=h-bh/2-8&&!occupied.some(r=>x-bw/2<r.x+r.w+2&&x+bw/2>r.x-2&&y-bh/2<r.y+r.h+2&&y+bh/2>r.y-2);
 let choices=[];for(const dy of [0,-24,24,-48,48,-72,72])for(const dx of [0,-25,25,-50,50,-75,75]){let x=rawX+dx,y=rawY+dy;if(fits(x,y))choices.push({x,y,cost:Math.hypot(dx,dy)});}
 if(!choices.length)for(let y=bh/2+8;y<h-bh/2-10;y+=12)for(let x=bw/2+6;x<w-bw/2-5;x+=12)if(fits(x,y))choices.push({x,y,cost:Math.hypot(x-rawX,y-rawY)});
 choices.sort((a,b)=>a.cost-b.cost);const best=choices[0]||{x:Math.max(bw/2+3,Math.min(w-bw/2-3,rawX)),y:Math.max(bh/2+8,Math.min(h-bh/2-8,rawY))};l.button.style.left=`${best.x-rawX}px`;l.button.style.top=`${best.y-rawY}px`;occupied.push({x:best.x-bw/2,y:best.y-bh/2,w:bw,h:bh});

 }
 }
 function render(now=0){frame=null;rendering=true;const dt=Math.min((now-last)/1000,.05)||0;last=now;if(interior.active){renderer.shadowMap.autoUpdate=true;interior.render(dt,reduced);renderer.shadowMap.autoUpdate=false;rendering=false;if(!reduced)frame=requestAnimationFrame(render);return;}if(!reduced&&!flight){elapsed+=dt;shadowElapsed+=dt;if(shadowElapsed>.8){renderer.shadowMap.needsUpdate=true;shadowElapsed=0;}residents.update(dt);halloween.update(dt);environment.update(dt);animated.forEach(({obj,kind,base})=>{if(kind==='boat')obj.position.y=base+Math.sin(elapsed*.8+obj.position.x)*.07;if(kind==='halo')obj.rotation.y=elapsed*.2;if(kind==='gear')obj.rotation.z=elapsed*.12;});}if(flight&&!reduced){const t=Math.min((performance.now()-flight.start)/650,1),s=t*t*t*(10+t*(-15+6*t));controls.target.lerpVectors(flight.targetFrom,flight.targetTo,s);const orbit=new THREE.Spherical(THREE.MathUtils.lerp(flight.orbitFrom.radius,flight.orbitTo.radius,s),THREE.MathUtils.lerp(flight.orbitFrom.phi,flight.orbitTo.phi,s),THREE.MathUtils.lerp(flight.orbitFrom.theta,flight.orbitTo.theta,s));camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(orbit));camera.zoom=Math.exp(THREE.MathUtils.lerp(Math.log(flight.zoomFrom),Math.log(flight.zoomTo),s));camera.updateProjectionMatrix();if(t===1){camera.position.copy(flight.to);controls.target.copy(flight.targetTo);camera.zoom=flight.zoomTo;flight=null;controls.enableDamping=!reduced;}}controls.update();if(!selected&&!flight&&overviewNeedsSpace){fitOverview(camera,controls,locations,host.clientWidth,host.clientHeight);if(overviewNeedsSpace==='fit')fitOverview(camera,controls,locations,host.clientWidth,host.clientHeight,true);else{camera.zoom*=.90;camera.updateProjectionMatrix();fitOverview(camera,controls,locations,host.clientWidth,host.clientHeight);}overviewNeedsSpace=false;}halloween.faceCamera();renderer.render(scene,camera);labelRenderer.render(scene,camera);layoutLabels();layoutPeople();rendering=false;if(!reduced||flight)frame=requestAnimationFrame(render);}
 function invalidate(){if(frame===null&&!rendering)frame=requestAnimationFrame(render);}
 function resize(){const w=host.clientWidth,h=host.clientHeight;const worldWidth=mapWidth*(w<500?76/83:w<800?79/83:1);camera.left=-worldWidth/2;camera.right=worldWidth/2;camera.top=worldWidth/(w/h)/2;camera.bottom=-camera.top;if(!selected){camera.zoom=1;overviewNeedsSpace='fit';}layoutKey='';camera.updateProjectionMatrix();renderer.setSize(w,h);labelRenderer.setSize(w,h);invalidate();}new ResizeObserver(resize).observe(host);window.addEventListener('resize',resize);
 controls.addEventListener('change',invalidate);controls.addEventListener('start',()=>{flight=null;controls.enableDamping=!reduced;});
 function clearOrbitInertia(){const position=camera.position.clone(),target=controls.target.clone(),zoom=camera.zoom;controls.enableDamping=false;controls.update();camera.position.copy(position);controls.target.copy(target);camera.zoom=zoom;controls.update();}
 function fly(target,zoom,position=null,kind='island'){const destination=position||target.clone().add(cameraOffset.clone());clearOrbitInertia();if(reduced){controls.target.copy(target);camera.position.copy(destination);camera.zoom=zoom;camera.updateProjectionMatrix();controls.update();flight=null;}else{const orbitFrom=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)),orbitTo=new THREE.Spherical().setFromVector3(destination.clone().sub(target));orbitTo.theta=orbitFrom.theta+Math.atan2(Math.sin(orbitTo.theta-orbitFrom.theta),Math.cos(orbitTo.theta-orbitFrom.theta));flight={kind,start:performance.now(),from:camera.position.clone(),to:destination.clone(),targetFrom:controls.target.clone(),targetTo:target.clone(),orbitFrom,orbitTo,zoomFrom:camera.zoom,zoomTo:zoom};}invalidate();}
 function bestOverview(){const target=new THREE.Vector3(0,3,0),preview=camera.clone();preview.position.copy(target).add(cameraOffset.clone());preview.zoom=1;preview.lookAt(target);preview.updateProjectionMatrix();preview.updateMatrixWorld(true);fitOverview(preview,{target},locations,host.clientWidth,host.clientHeight,true);return {target,position:preview.position.clone(),zoom:preview.zoom};}
 function overview(){if(interior.active)leaveInterior();const pose=bestOverview();selected=null;overviewNeedsSpace=false;labels.forEach(l=>l.button.classList.remove('selected'));onFocus?.(null);fly(pose.target,pose.zoom,pose.position,'overview');}
 const interior=createInterior(renderer,host,{appearance:data.appearance,onMaterial:()=>onSelect('center'),onExit:leaveInterior,onInvalidate:invalidate});
 function leaveInterior(){interior.leave();controls.enabled=true;labelRenderer.domElement.hidden=false;leaders.style.display='';onFocus?.('center');invalidate();}
 function enterBuilding(id){if(id!=='center'){onSelect(id);return;}interior.enter();controls.enabled=false;flight=null;labelRenderer.domElement.hidden=true;leaders.style.display='none';onFocus?.('interior');invalidate();}
 const pointer=new THREE.Vector2(),raycaster=new THREE.Raycaster();let down=null;renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});renderer.domElement.addEventListener('pointerup',e=>{if(!down)return;if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>6){if(!selected){overviewNeedsSpace=true;invalidate();}return;}if(interior.active){interior.pick(e);return;}const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(pickables,false)[0];if(hit?.object.userData.resident)onResident?.(hit.object.userData.resident);else if(hit?.object.userData.host)onHost?.();else if(hit){const id=hit.object.userData.island;if(selected===id&&hit.object.userData.building===id)enterBuilding(id);else focusIsland(id);}});
 renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();if(frame)cancelAnimationFrame(frame);onFailure?.();});
 function focusIsland(id){if(interior.active)leaveInterior();const g=locations.get(id);if(!g)return;selected=id;labels.forEach(l=>l.button.classList.toggle('selected',l.id===id));onFocus?.(id);const phone=host.clientWidth<500,target=g.position.clone();target.y+=id==='center'?1.5:1;const zoom=(camera.right-camera.left)*(id==='center'?(phone?.72:.36):(phone?.82:.46))/(g.userData.radius*2);fly(target,Math.min(controls.maxZoom,zoom));requestAnimationFrame(()=>{if(selected===id&&!document.querySelector('#panel:not([hidden]),dialog[open]'))buildingLabels.find(l=>l.id===id)?.button.focus({preventScroll:true});});}resize();invalidate();return {overview,select(id){if(interior.active&&id==='center')return;focusIsland(id);},setTheme(t){theme=t;layoutKey='';const color=t==='night'?palette.night:t==='mist'?palette.mist:palette.water;water.color.set(color);renderer.setClearColor(color);waveMat.color.set(t==='night'?'#68577f':'#ece1ed');invalidate();},setLighting(v){renderer.shadowMap.needsUpdate=true;light=v;const night=v==='night';ambient.intensity=night?1.65:v==='dusk'?1.8:1.9;sun.intensity=night?.7:v==='dusk'?1.6:2.5;sun.color.set(night?'#dec8f1':v==='dusk'?'#ffd39b':'#fff0dd');sun.position.set(night?-25:-30,night?35:55,v==='dusk'?-20:22);warm.emissiveIntensity=night?2.8:v==='dusk'?1.1:.15;halloween.setLighting(v);environment.setLighting(v);invalidate();},setReduced(v){renderer.shadowMap.needsUpdate=true;reduced=v;controls.enableDamping=!v;if(v){residents.pause();if(flight){camera.position.copy(flight.to);controls.target.copy(flight.targetTo);camera.zoom=flight.zoomTo;camera.updateProjectionMatrix();}flight=null;if(frame){cancelAnimationFrame(frame);frame=null;}animated.forEach(a=>{if(a.kind==='boat')a.obj.position.y=a.base;});}invalidate();},inspectWalkways,getDiagnostics(){return {transition:flight?.kind||null,target:controls.target.toArray(),labelAnchors:labels.map(l=>{const p=l.object.getWorldPosition(new THREE.Vector3()).project(camera);return {id:l.id,x:(p.x+1)*host.clientWidth/2,y:(1-p.y)*host.clientHeight/2};}),labelSafeBounds:projectIslandBounds(locations,camera,host.clientWidth,host.clientHeight),interior:interior.snapshot(),environment:environment.snapshot(),islandLayout:nodes.map(n=>({...n})),bridges:bridgeView.summary(),decorations:halloween.snapshot(),halloween:halloween.snapshot(),residents:residents.snapshot(),hosts:residents.hostSnapshot(),selected,islands:locations.size,labels:labels.length,reduced,theme,light,camera:camera.position.toArray(),zoom:camera.zoom};}};
}
