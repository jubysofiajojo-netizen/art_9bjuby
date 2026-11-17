import * as THREE from 'three';
import {createHalloween} from './halloween.mjs';
import {paletteFor} from './appearance.mjs';

export function createDecorations(scene,camera,locations,appearance={}){
 const theme=appearance.theme||'nature';
 if(theme==='halloween'){
  const d=createHalloween(scene,camera,locations);
  return {...d,snapshot:()=>({theme,...d.snapshot()})};
 }
 const p=paletteFor(appearance),items=[],mats=[];
 const anchors=[...locations.values()];
 if(theme==='custom'){
  const appleMat=new THREE.MeshStandardMaterial({color:'#7cc459',roughness:.55,emissive:'#4f8c36',emissiveIntensity:.12});
  const stemMat=new THREE.MeshStandardMaterial({color:'#8b5e3c',roughness:.85});
  const bubbleColors=['#f2c138','#7ec8e3','#e2a4b0','#ff8fa3','#a6d8a8','#c7a8f2','#ffa96b'];
  const bubbleMats=bubbleColors.map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.18,metalness:.08,transparent:true,opacity:.68,emissive:c,emissiveIntensity:.22}));
  mats.push(appleMat,...bubbleMats);
  const count=36;
  for(let i=0;i<count;i++){
   const anchor=anchors[i%anchors.length].position.clone(),g=new THREE.Group();
   scene.add(g);
   const kind=i%6===0?0:1;
   if(kind===0){
    // 漂浮青蘋果（致敬馬格利特《人子》）
    const apple=new THREE.Mesh(new THREE.SphereGeometry(.26+(i%2)*.05,12,10),appleMat);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.16,6),stemMat);
    stem.position.y=.28;
    const leaf=new THREE.Mesh(new THREE.SphereGeometry(.08,6,4),appleMat);
    leaf.scale.set(1.4,.4,.8);leaf.position.set(.08,.29,0);leaf.rotation.z=.35;
    g.add(apple,stem,leaf);
   }else{
    // 彩色透明泡泡
    const bMat=bubbleMats[i%bubbleMats.length];
    const r=.18+(i%5)*.065;
    const bubble=new THREE.Mesh(new THREE.SphereGeometry(r,16,12),bMat);
    g.add(bubble);
   }
   items.push({g,anchor,wings:[],phase:i*.58,radius:2.6+(i%5)*.95,height:4.4+(i%6)*.85,speed:.15+(i%3)*.04,spin:kind===0});
  }
  let time=0;
  function update(dt){
   time+=dt;
   for(const a of items){
    const t=time*a.speed+a.phase;
    a.g.position.set(a.anchor.x+Math.sin(t)*a.radius,a.anchor.y+a.height+Math.sin(t*1.6)*.75,a.anchor.z+Math.cos(t)*a.radius);
    if(a.spin)a.g.rotation.y=time*.6+a.phase;
   }
  }
  update(0);
  return {
   update,
   faceCamera(){},
   setLighting(v){for(const m of mats)m.emissiveIntensity=v==='night'?.55:.15;},
   snapshot(){return {theme,objects:items.map(a=>({position:a.g.position.toArray()})),pumpkins:0,witchRoofs:0,bats:[],pathObstructions:0};}
  };
 }

 const mat=new THREE.MeshStandardMaterial({color:theme==='ocean'?'#effaff':theme==='space'?'#ffe4a3':p.pink,roughness:.6,transparent:theme==='ocean',opacity:theme==='ocean'?.55:1,emissive:'#c5c4d5',emissiveIntensity:.1});
 for(let i=0;i<Math.max(8,Math.min(24,anchors.length*2));i++){
  const anchor=anchors[i%anchors.length].position.clone(),g=new THREE.Group();scene.add(g);
  const add=(geo,x=0,y=0,z=0)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);g.add(m);return m;};
  const wings=[];
  if(theme==='space'){const shape=new THREE.Shape();for(let k=0;k<10;k++){const a=k*Math.PI/5,r=k%2?.14:.34;if(k)shape.lineTo(Math.sin(a)*r,Math.cos(a)*r);else shape.moveTo(Math.sin(a)*r,Math.cos(a)*r);}shape.closePath();add(new THREE.ExtrudeGeometry(shape,{depth:.10,bevelEnabled:false}));}
  else if(theme==='ocean'){add(new THREE.SphereGeometry(.24+(i%3)*.05,10,8));}
  else {add(new THREE.SphereGeometry(.08,6,4));for(const side of [-1,1]){const w=add(new THREE.SphereGeometry(.23,8,6),side*.18);w.scale.set(1,1.2,.18);wings.push(w);}}
  items.push({g,anchor,wings,phase:i*.72});
 }
 let time=0;function update(dt){time+=dt;for(const a of items){const t=time*.15+a.phase;a.g.position.set(a.anchor.x+Math.sin(t)*3.4,a.anchor.y+5.8+Math.sin(t*1.4)*.7,a.anchor.z+Math.cos(t)*3.2);a.wings.forEach((w,i)=>w.rotation.y=Math.sin(time*6+a.phase)*.6*(i?1:-1));}}
 update(0);return {update,faceCamera(){for(const a of items)a.g.quaternion.copy(camera.quaternion);},setLighting(v){mat.emissiveIntensity=v==='night'?.8:.1;},snapshot(){return {theme,objects:items.map(a=>({position:a.g.position.toArray()})),pumpkins:0,witchRoofs:0,bats:[],pathObstructions:0};}};
}
