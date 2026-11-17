import * as THREE from 'three';

const cache=new Map();
const material=c=>{
 if(!cache.has(c))cache.set(c,new THREE.MeshStandardMaterial({color:c,roughness:.77}));
 return cache.get(c);
};

const PALETTES={
 'resident-01':{shirt:'#fffaf1',pants:'#252a36',hair:'#252a36',skirt:false}, // 小方：蒙德里安
 'resident-02':{shirt:'#224b8f',pants:'#252a36',hair:'#5a3d31',skirt:true},  // 剪剪：馬諦斯
 'resident-03':{shirt:'#a9cf8b',pants:'#545978',hair:'#67627e',skirt:true},  // 點點：秀拉
 'resident-04':{shirt:'#e04338',pants:'#252a36',hair:'#343e60',skirt:false}, // 躍躍：凱斯·哈林
 'resident-05':{shirt:'#f7c936',pants:'#252a36',hair:'#2b262d',skirt:true},  // 圓圓：草間彌生
 'resident-06':{shirt:'#d63f32',pants:'#4d4b66',hair:'#4b3c4c',skirt:false}, // 印印：安迪·沃荷濃湯罐
 'resident-07':{shirt:'#e3b559',pants:'#224b8f',hair:'#8b624d',skirt:true},  // 光光：維梅爾
 'resident-08':{shirt:'#7ec8e3',pants:'#4f7a62',hair:'#b48b63',skirt:true},  // 晨晨：莫內
 'resident-09':{shirt:'#d95a38',pants:'#2b3e63',hair:'#343e60',skirt:false}, // 鳴鳴：孟克
 'resident-10':{shirt:'#7cc459',pants:'#252a36',hair:'#4b3c4c',skirt:false}, // 夢夢：馬格利特青蘋果
 'resident-11':{shirt:'#c83b3b',pants:'#2d4d3e',hair:'#2b262d',skirt:true},  // 蜂兒：芙烈達·卡蘿
 'resident-12':{shirt:'#4d8bc9',pants:'#e88442',hair:'#4b3c4c',skirt:false}, // 立方：畢卡索
 'resident-13':{shirt:'#1e4d7b',pants:'#153252',hair:'#2b262d',skirt:true},  // 藍浪：葛飾北齋
 'resident-14':{shirt:'#e53224',pants:'#1c1e24',hair:'#1c1e24',skirt:false}  // 婆憂：劉其偉《婆憂鳥》紅與黑
};

export function createAnimeCharacter(index=0,owner=false,costumeId=''){
 const g=new THREE.Group();
 g.userData.characterStyle='anime-chibi';
 const look=!owner&&PALETTES[costumeId]?PALETTES[costumeId]:null;
 const skin=['#ffe0c1','#d6a178','#f2c5a3','#b78060'][index%4];
 const shirt=look?look.shirt:['#eaa6b1','#9ac9df','#dbc286','#bea5df','#a5cbb8','#edbedb'][index%6];
 const hair=owner?'#dc8740':look?look.hair:['#4b3c4c','#8b624d','#343e60','#b48b63','#67627e'][index%5];
 const iris=['#607eaa','#64836b','#8c69a0','#90684d'][index%4];
 const mesh=(p,geo,c,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,material(c));m.position.set(x,y,z);m.castShadow=true;p.add(m);return m;};
 const ball=(p,r,c,x,y,z)=>mesh(p,new THREE.SphereGeometry(r,12,10),c,x,y,z);
 const legs=[],arms=[];

 for(const side of [-1,1]){
  const leg=new THREE.Group();leg.position.set(side*.105,.30,0);g.add(leg);
  mesh(leg,new THREE.CylinderGeometry(.065,.07,.24,8),'#fff4e8',0,-.10);
  mesh(leg,new THREE.BoxGeometry(.13,.10,.23),'#4d4b66',0,-.25,.04);
  legs.push(leg);
  const arm=new THREE.Group();arm.position.set(side*.225,.77,0);g.add(arm);
  const sleeveColor=costumeId==='resident-12'?(side<0?'#e88442':'#f2c138'):shirt;
  mesh(arm,new THREE.CylinderGeometry(.075,.065,.26,8),sleeveColor,0,-.11);
  ball(arm,.077,skin,0,-.27,0);
  arms.push(arm);
 }

 // 身體與基礎服裝
 const hasSkirt=look?look.skirt:(!owner&&index%2);
 if(costumeId==='resident-06'){
  // 印印：安迪·沃荷紅白濃湯罐頭
  mesh(g,new THREE.CylinderGeometry(.24,.24,.23,14),'#d63f32',0,.70,0);
  mesh(g,new THREE.CylinderGeometry(.24,.24,.22,14),'#fffaf1',0,.48,0);
  mesh(g,new THREE.CylinderGeometry(.248,.248,.05,14),'#f2c138',0,.59,0);
  mesh(g,new THREE.CylinderGeometry(.07,.07,.03,12),'#f2c138',0,.59,.24).rotation.x=Math.PI/2;
 }else if(costumeId==='resident-10'){
  // 夢夢：馬格利特青蘋果身體
  const apple=ball(g,.29,'#7cc459',0,.57,0);
  apple.scale.set(1.06,.92,1.06);
  mesh(g,new THREE.CylinderGeometry(.025,.025,.12,6),'#6b442a',0,.86,0);
  const leaf=ball(g,.07,'#4f9937',.07,.86,0);leaf.scale.set(1.4,.4,.8);
 }else if(costumeId==='resident-05'){
  // 圓圓：草間彌生黃色圓點南瓜身
  const pumpkin=ball(g,.28,'#f7c936',0,.56,0);
  pumpkin.scale.set(1.08,.88,1.08);
  for(const [x,y,z] of [[-.14,.62,.22],[.15,.54,.21],[0,.46,.25],[-.18,.52,-.19],[.16,.62,-.18]]){
   ball(g,.048,'#252a36',x,y,z);
  }
 }else{
  mesh(g,new THREE.CylinderGeometry(.18,.22,.42,10),owner?'#8fc5b8':shirt,0,.62);
  if(owner||!hasSkirt)mesh(g,new THREE.BoxGeometry(.36,.19,.26),look?look.pants:'#545978',0,.37);
  if(hasSkirt)mesh(g,new THREE.CylinderGeometry(.20,.29,.20,12),costumeId==='resident-08'?'#84b882':shirt,0,.43);
 }

 // 領口與專屬服裝細節
 if(!look){
  mesh(g,new THREE.BoxGeometry(.21,.19,.035),'#fff8ef',0,.76,.17);
  for(const side of [-1,1]){const collar=mesh(g,new THREE.BoxGeometry(.13,.045,.04),'#535b80',side*.065,.83,.20);collar.rotation.z=side*.38;}
  mesh(g,new THREE.BoxGeometry(.055,.13,.045),owner?'#efa753':'#a56583',0,.70,.20);
 }else if(costumeId==='resident-01'){
  // 小方：紅黃藍黑線格子方塊衣
  for(const z of [.19,-.19]){
   mesh(g,new THREE.BoxGeometry(.32,.30,.04),'#252a36',0,.62,z);
   mesh(g,new THREE.BoxGeometry(.13,.13,.05),'#d63f32',-.08,.69,z);
   mesh(g,new THREE.BoxGeometry(.13,.13,.05),'#f2c138',.08,.69,z);
   mesh(g,new THREE.BoxGeometry(.13,.11,.05),'#224b8f',-.08,.54,z);
   mesh(g,new THREE.BoxGeometry(.13,.11,.05),'#fffaf1',.08,.54,z);
  }
 }else if(costumeId==='resident-02'){
  // 剪剪：馬諦斯彩色剪紙拼貼
  mesh(g,new THREE.BoxGeometry(.10,.12,.04),'#f2c138',-.07,.67,.19).rotation.z=.3;
  mesh(g,new THREE.BoxGeometry(.11,.10,.04),'#e04338',.07,.57,.20).rotation.z=-.4;
  mesh(g,new THREE.BoxGeometry(.09,.09,.04),'#f59b42',-.04,.50,.21).rotation.z=.2;
 }else if(costumeId==='resident-03'){
  // 點點：秀拉黃點點＋藍點點
  for(const [x,y,c] of [[-.09,.69,'#f2c138'],[.08,.68,'#224b8f'],[-.03,.58,'#224b8f'],[.10,.55,'#f2c138'],[-.11,.46,'#f2c138'],[.06,.45,'#224b8f']]){
   ball(g,.038,c,x,y,.21);
  }
 }else if(costumeId==='resident-04'){
  // 躍躍：凱斯·哈林塗鴉愛心
  ball(g,.06,'#fffaf1',-.04,.64,.19);ball(g,.06,'#fffaf1',.04,.64,.19);
  mesh(g,new THREE.ConeGeometry(.085,.10,4),'#fffaf1',0,.58,.19).rotation.x=Math.PI;
 }else if(costumeId==='resident-07'){
  // 光光：維梅爾白領
  mesh(g,new THREE.BoxGeometry(.22,.08,.04),'#fffaf1',0,.78,.19);
 }else if(costumeId==='resident-08'){
  // 晨晨：莫內睡蓮花點綴
  ball(g,.05,'#e2a4b0',-.12,.48,.22);ball(g,.05,'#fffaf1',.12,.45,.23);
 }else if(costumeId==='resident-09'){
  // 鳴鳴：孟克《吶喊》晚霞與深藍波紋
  mesh(g,new THREE.BoxGeometry(.28,.06,.05),'#f2c138',0,.70,.19).rotation.z=.15;
  mesh(g,new THREE.BoxGeometry(.30,.07,.05),'#2b3e63',0,.59,.20).rotation.z=-.18;
 }else if(costumeId==='resident-11'){
  // 蜂兒：芙烈達民族披肩＋小蜂鳥點綴
  mesh(g,new THREE.CylinderGeometry(.24,.27,.14,12),'#f2c138',0,.74,0);
  ball(g,.045,'#4fb887',0,.68,.23);
 }else if(costumeId==='resident-12'){
  // 立方：畢卡索幾何拼接
  mesh(g,new THREE.BoxGeometry(.15,.28,.04),'#e88442',.08,.62,.19);
  mesh(g,new THREE.ConeGeometry(.09,.15,3),'#f2c138',-.06,.64,.21);
 }else if(costumeId==='resident-13'){
  // 藍浪：北齋藍和服＋白色腰帶與浪花
  mesh(g,new THREE.CylinderGeometry(.20,.23,.09,12),'#fffaf1',0,.57,0);
  ball(g,.055,'#fffaf1',-.10,.43,.24);ball(g,.045,'#fffaf1',.09,.41,.24);
 }else if(costumeId==='resident-14'){
  // 婆憂：劉其偉《婆憂鳥》紅胸黑背與小黑尾
  mesh(g,new THREE.CylinderGeometry(.23,.27,.30,12),'#1c1e24',0,.63,-.06);
  mesh(g,new THREE.CylinderGeometry(.21,.24,.34,12),'#e53224',0,.62,.05);
  for(const side of [-1,1]){
   const wing=ball(g,.11,'#1c1e24',side*.25,.64,-.04);
   wing.scale.set(.45,1.25,.9);
  }
  const tail=mesh(g,new THREE.ConeGeometry(.09,.18,6),'#1c1e24',0,.44,-.26);tail.rotation.x=-Math.PI/2.4;
 }

 // 頭部與五官
 const head=ball(g,.335,skin,0,1.075,0);head.name='anime-face';
 ball(g,.072,skin,-.33,1.06,0);ball(g,.072,skin,.33,1.06,0);
 const cap=mesh(g,new THREE.SphereGeometry(.35,16,10,0,Math.PI*2,0,Math.PI*.48),costumeId==='resident-07'?'#224b8f':hair,0,1.095,0);
 cap.name='anime-hair';
 for(const side of [-1,1]){
  const bang=ball(g,.15,costumeId==='resident-07'?'#224b8f':hair,side*.18,1.28,.20);
  bang.scale.set(.85,1.15,.45);
  if(!owner&&!look&&index%3===1){const tail=ball(g,.17,hair,side*.34,1.10,-.07);tail.scale.set(.8,1.4,.8);}
 }
 for(const side of [-1,1]){
  const x=side*.125;
  const outline=ball(g,.087,'#41354f',x,1.09,.297);outline.scale.set(.80,1.22,.28);
  const eye=ball(g,.069,iris,x,1.085,.316);eye.scale.set(.76,1.18,.28);
  const pupil=ball(g,.037,'#293247',x,1.085,.333);pupil.scale.set(.70,1.30,.25);
  ball(g,.024,'#ffffff',x-.018,1.122,.346);ball(g,.011,'#fffdf4',x+.020,1.066,.347);
  const cheek=ball(g,.049,'#edacb1',side*.235,1.00,.257);cheek.scale.set(1,.45,.20);
 }
 const smile=mesh(g,new THREE.TorusGeometry(.055,.009,5,12,Math.PI),'#a9696c',0,.97,.317);smile.rotation.z=Math.PI;

 // 頭飾／帽子
 if(owner){
  const beret=mesh(g,new THREE.CylinderGeometry(.38,.36,.10,16),'#224b8f',0,1.42,-.02);beret.rotation.z=-.12;
  mesh(g,new THREE.SphereGeometry(.33,14,8,0,Math.PI*2,0,Math.PI/2),'#224b8f',-.02,1.45,-.02);
  mesh(g,new THREE.SphereGeometry(.09,10,8),'#f2c138',-.03,1.79,-.02);
 }else if(costumeId==='resident-01'){
  mesh(g,new THREE.BoxGeometry(.44,.14,.44),'#252a36',0,1.46,0);
 }else if(costumeId==='resident-02'){
  for(const side of [-1,1]){const blade=mesh(g,new THREE.BoxGeometry(.07,.28,.04),'#d6dce5',side*.08,1.50,0);blade.rotation.z=side*.45;}
 }else if(costumeId==='resident-03'||costumeId==='resident-08'){
  mesh(g,new THREE.CylinderGeometry(.42,.42,.05,16),'#e8d5a3',0,1.40,0);
  mesh(g,new THREE.CylinderGeometry(.25,.28,.16,14),'#e8d5a3',0,1.48,0);
  if(costumeId==='resident-08')ball(g,.08,'#e2a4b0',.22,1.45,.15);
 }else if(costumeId==='resident-04'){
  for(let k=-2;k<=2;k++){const ray=mesh(g,new THREE.BoxGeometry(.04,.22,.04),'#f2c138',k*.13,1.54-Math.abs(k)*.04,0);ray.rotation.z=-k*.28;}
 }else if(costumeId==='resident-05'){
  mesh(g,new THREE.CylinderGeometry(.05,.08,.16,8),'#4f9937',0,1.47,0);
 }else if(costumeId==='resident-06'){
  mesh(g,new THREE.CylinderGeometry(.30,.30,.14,16),'#cfd5de',0,1.44,0);
 }else if(costumeId==='resident-07'){
  // 維梅爾：珍珠耳環＋長頭巾尾
  for(const side of [-1,1])ball(g,.07,'#fffaf1',side*.35,.94,.04);
  mesh(g,new THREE.BoxGeometry(.18,.28,.12),'#e3b559',-.18,1.18,-.28).rotation.z=.2;
 }else if(costumeId==='resident-10'){
  // 夢夢：馬格利特黑色紳士禮帽
  mesh(g,new THREE.CylinderGeometry(.40,.40,.05,16),'#252a36',0,1.41,0);
  mesh(g,new THREE.CylinderGeometry(.24,.26,.24,14),'#252a36',0,1.54,0);
 }else if(costumeId==='resident-11'){
  // 蜂兒：芙烈達三朵熱帶花冠
  for(const [x,c] of [[-.18,'#e04338'],[0,'#f2c138'],[.18,'#e86f99']])ball(g,.11,c,x,1.44,.12);
 }else if(costumeId==='resident-12'){
  // 立方：雙色幾何帽
  mesh(g,new THREE.ConeGeometry(.26,.28,4),'#f2c138',0,1.52,0);
 }else if(costumeId==='resident-13'){
  // 藍浪：白色浪花頭飾
  for(const [x,y,r] of [[-.12,1.45,.10],[0,1.50,.12],[.12,1.45,.09]])ball(g,r,'#fffaf1',x,y,.05);
 }else if(costumeId==='resident-14'){
  // 婆憂：劉其偉《婆憂鳥》紅黑頭套＋黑喙白眼點
  mesh(g,new THREE.SphereGeometry(.36,14,10,0,Math.PI*2,0,Math.PI*.46),'#1c1e24',0,1.12,-.02);
  mesh(g,new THREE.SphereGeometry(.35,14,10,0,Math.PI,0,Math.PI*.36),'#e53224',0,1.14,.04);
  const beak=mesh(g,new THREE.ConeGeometry(.065,.18,6),'#1c1e24',0,1.38,.30);beak.rotation.x=Math.PI/2;
  for(const side of [-1,1])ball(g,.032,'#fffaf1',side*.10,1.40,.26);
 }else if(index%3===0){
  mesh(g,new THREE.CylinderGeometry(.36,.36,.07,14),shirt,0,1.39);
  mesh(g,new THREE.SphereGeometry(.28,12,6,0,Math.PI*2,0,Math.PI/2),shirt,0,1.40);
 }
 return {g,legs,arms};
}
