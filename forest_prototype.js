// Bosque del Río Antiguo — prototipo tridimensional jugable para Vayne Survivors.
// Generación determinista, geometría instanciada y sin descargas externas.
export function createForestPrototype(THREE, scene, sunlight, legacyProcedural, oldV2Scene, obstacleList) {
  for (const o of legacyProcedural) o.visible = false;
  for (const o of [...scene.children]) if (!oldV2Scene.has(o) && o !== sunlight.target) o.visible = false;
  obstacleList.length = 0;
  const root = new THREE.Group();root.name='Bosque del Rio Antiguo - prototipo v1';scene.add(root);
  scene.background = new THREE.Color(0x819889);
  scene.fog = new THREE.FogExp2(0x879d8c, 0.0047);
  sunlight.color.set(0xffedd1);sunlight.intensity=3.5;
  sunlight.shadow.bias=-0.00015;
  sunlight.shadow.normalBias=0.035;
  scene.add(new THREE.HemisphereLight(0xe3f7eb,0x35473c,1.25));

  let seed=8364107;
  const rnd=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const rand=(a,b)=>a+(b-a)*rnd();
  const pick=a=>a[Math.floor(rnd()*a.length)];
  const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const smooth=t=>t*t*(3-2*t);
  const hash=(x,z)=>{let q=Math.sin(x*127.1+z*311.7)*43758.5453;return q-Math.floor(q)};
  const noise=(x,z)=>{
    const i=Math.floor(x),k=Math.floor(z),u=smooth(x-i),v=smooth(z-k);
    const a=hash(i,k),b=hash(i+1,k),c=hash(i,k+1),d=hash(i+1,k+1);
    return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;
  };
  const fBm=(x,z)=>.54*noise(x*.037,z*.037)+.29*noise(x*.12,z*.12)+.17*noise(x*.41,z*.41);
  const riverX=z=>27+8*Math.sin(z*.049)+3*Math.sin(z*.135);
  const riverWidth=z=>9.2+1.7*Math.sin(z*.057+1.1);
  const riverDistance=(x,z)=>Math.abs(x-riverX(z));
  const pathDistance=(x,z)=>{
    const a=Math.abs(z-(-.18*x+2.2*Math.sin(x*.055)));
    const b=Math.abs(z-(.76*x-17+3*Math.sin(x*.045)));
    const c=Math.abs(z-(-.82*x-29));
    return Math.min(a,b,c);
  };
  const height=(x,z)=>{
    const soft=(fBm(x,z)-.5)*.38+.07*Math.sin(x*.087)*Math.sin(z*.092);
    const rise=clamp((Math.max(Math.abs(x),Math.abs(z))-64)/20,0,1);
    const edge=1.8*smooth(rise)*(.45+.5*noise(x*.07,z*.07));
    const d=riverDistance(x,z),w=riverWidth(z)*.5;
    const cut=1-smooth(clamp((d-w)/4.1,0,1));
    const bed=-.66*cut;
    const trail=1-smooth(clamp((pathDistance(x,z)-2.4)/4,0,1));
    const centre=1-smooth(clamp((Math.hypot(x,z)-12)/11,0,1));
    return soft*(1-.7*trail)*(1-.8*centre)+bed+edge;
  };
  const bridges=[-37,42];
  const usableHeight=(x,z)=>{
    if(bridges.some(q=>Math.abs(z-q)<2.7&&Math.abs(x-riverX(q))<11.3))return .58;
    return height(x,z);
  };
  const mat=(color,roughness=1,extra={})=>new THREE.MeshStandardMaterial({color,roughness,...extra});
  const bark=mat(0x705039,.96,{flatShading:false});
  const foliage=mat(0xffffff,.92,{side:THREE.DoubleSide});
  const grassMat=mat(0xffffff,.96,{side:THREE.DoubleSide});
  const rockMat=mat(0xffffff,1,{flatShading:true});
  const stone=mat(0x898d79,.94,{flatShading:false});
  const moss=mat(0x597e4b,.96);
  const dust=mat(0xc3b99d,1);
  const darkSoil=mat(0x4a513d,1);
  function makeTexture(size) {
    const c=document.createElement('canvas');c.width=c.height=size;
    const ctx=c.getContext('2d'),id=ctx.createImageData(size,size);
    for(let j=0;j<size;j++)for(let i=0;i<size;i++){
      const coarse=noise(i/68,j/68),fine=noise(i/11,j/11),grain=hash(i,j);
      const v=clamp((coarse-.5)*47+(fine-.5)*24+(grain-.5)*19,-52,52),k=(j*size+i)*4;
      id.data[k]=clamp(94+v,0,255);id.data[k+1]=clamp(101+v*.85,0,255);
      id.data[k+2]=clamp(76+v*.68,0,255);id.data[k+3]=255;
    }
    ctx.putImageData(id,0,0);
    const texture=new THREE.CanvasTexture(c);
    texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
    texture.repeat.set(14,14);
    texture.colorSpace=THREE.SRGBColorSpace;
    texture.anisotropy=8;
    return texture;
  }
  const baseTexture=makeTexture(768);
  const floorGeo=new THREE.PlaneGeometry(190,190,190,190);
  floorGeo.rotateX(-Math.PI/2);
  const p=floorGeo.attributes.position,colors=new Float32Array(p.count*3);
  for(let i=0;i<p.count;i++){
    const x=p.getX(i),z=p.getZ(i),d=riverDistance(x,z),trail=pathDistance(x,z);
    p.setY(i,height(x,z));
    const dirt=1-smooth(clamp((trail-2.7)/5,0,1)),clearing=1-smooth(clamp((Math.hypot(x,z)-9)/12,0,1));
    const bank=1-smooth(clamp((d-riverWidth(z)/2-1.8)/4,0,1));
    const patch=noise(x*.11,z*.11);
    const land=new THREE.Color().setRGB(.74+patch*.21,.99+patch*.14,.72+patch*.12);
    land.lerp(new THREE.Color(0xc3aa83),Math.max(dirt*.66,clearing*.5));
    land.lerp(new THREE.Color(0x796f57),bank*.5);
    const k=i*3;colors[k]=land.r;colors[k+1]=land.g;colors[k+2]=land.b;
  }
  floorGeo.setAttribute('color',new THREE.BufferAttribute(colors,3));floorGeo.computeVertexNormals();
  const floor=new THREE.Mesh(floorGeo,new THREE.MeshStandardMaterial({
    map:baseTexture,bumpMap:baseTexture,bumpScale:.095,vertexColors:true,roughness:1
  }));
  floor.name='Bosque: suelo caminable';floor.receiveShadow=true;root.add(floor);

  const waterCoords=[],uv=[],indices=[];
  const sections=255,across=12;
  for(let i=0;i<=sections;i++){
    const z=-95+i*190/sections,mid=riverX(z),w=riverWidth(z)/2;
    for(let j=0;j<=across;j++){
      const t=j/across,x=mid+(t*2-1)*w;
      waterCoords.push(x,-.47+.03*Math.sin(z*.21+j*.6),z);
      uv.push(t,i/sections*11);
      if(i<sections&&j<across){const a=i*(across+1)+j,b=a+across+1;indices.push(a,b,a+1,b,b+1,a+1)}
    }
  }
  const wGeo=new THREE.BufferGeometry();wGeo.setAttribute('position',new THREE.Float32BufferAttribute(waterCoords,3));
  wGeo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));wGeo.setIndex(indices);wGeo.computeVertexNormals();
  const waterTexture=(()=>{
    const c=document.createElement('canvas');c.width=256;c.height=512;const cx=c.getContext('2d');
    cx.fillStyle='#91c4bb';cx.fillRect(0,0,256,512);
    for(let i=0;i<240;i++){
      const y=rnd()*512,x=rnd()*256,w=rand(15,130);
      cx.strokeStyle=i%3?'rgba(217,251,236,.12)':'rgba(26,75,76,.12)';
      cx.lineWidth=rand(.4,2.8);cx.beginPath();cx.moveTo(x,y);
      cx.bezierCurveTo(x+w*.25,y-rand(0,5),x+w*.6,y+rand(0,5),x+w,y);cx.stroke();
    }
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.repeat.set(1,1);t.colorSpace=THREE.SRGBColorSpace;return t;
  })();
  const water=new THREE.Mesh(wGeo,new THREE.MeshPhysicalMaterial({
    color:0x72cec7,map:waterTexture,transparent:true,opacity:.86,
    metalness:.05,roughness:.15,clearcoat:.8,clearcoatRoughness:.13,
    side:THREE.DoubleSide,depthWrite:false
  }));
  water.renderOrder=2;water.name='Rio animado';root.add(water);

  const foamArr=[],banks=[],riverPebbles=[];
  for(let i=0;i<320;i++){
    const z=rand(-83,83),side=rnd()<.5?-1:1,center=riverX(z),w=riverWidth(z)*.5;
    const x=center+side*rand(w+.2,w+4.6);
    if(rnd()<.48)riverPebbles.push([x,height(x,z)+.09,z,rand(.1,.6),pick([0x69776b,0x858f7b,0x777e71])]);
    else banks.push([x,height(x,z)+.22,z,rand(.35,1.25),pick([0x626a57,0x707762,0x8b8970])]);
    if(i%2===0)foamArr.push([center+side*(w-rand(.15,.6)),z]);
  }
  const obj=new THREE.Object3D(),col=new THREE.Color();
  function instance(geometry,material,arr,fn,shadows=false){
    if(!arr.length)return null;
    const mesh=new THREE.InstancedMesh(geometry,material,arr.length);
    mesh.name='Bosque: objetos instanciados';mesh.castShadow=shadows;mesh.receiveShadow=true;
    arr.forEach((data,i)=>{fn(data,i,obj);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);if(data.color!==undefined){col.set(data.color);mesh.setColorAt(i,col)}});
    mesh.instanceMatrix.needsUpdate=true;mesh.frustumCulled=false;root.add(mesh);return mesh;
  }
  const rockG=new THREE.IcosahedronGeometry(1,1);
  const rockSet=banks.concat(riverPebbles).map(a=>({x:a[0],y:a[1],z:a[2],size:a[3],color:a[4],rotation:rand(0,6)}));
  instance(rockG,rockMat,rockSet,(a,i,o)=>{
    o.position.set(a.x,a.y,a.z);o.rotation.set(.2*Math.sin(a.rotation),a.rotation,.25*Math.sin(a.rotation*2));
    o.scale.set(a.size*1.3,a.size*.63,a.size);},true);
  const foamG=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
  const foamMat=new THREE.MeshBasicMaterial({color:0xd1f2e5,transparent:true,opacity:.35,depthWrite:false,side:THREE.DoubleSide});
  instance(foamG,foamMat,foamArr.map(a=>({x:a[0],z:a[1],size:rand(.35,1.7)})),(a,i,o)=>{
    o.position.set(a.x,-.448,a.z);o.rotation.set(0,rand(0,6),0);o.scale.set(a.size,.4,a.size*.24);
  });

  // Caminos curvos de losas entre los claros; superficie peatonal despejada.
  const paving=[];
  for(let i=0;i<690;i++){
    const x=rand(-77,77),z=rand(-75,75);
    if(pathDistance(x,z)>4.1||riverDistance(x,z)<riverWidth(z)/2+2)continue;
    if(Math.hypot(x,z)<6)continue;
    paving.push({x,y:height(x,z)+.025,z,rot:rand(-.16,.16),w:rand(.45,1.55),d:rand(.45,1.35),color:pick([0x9e9a82,0x777a69,0xb0a890,0x8d927d])});
  }
  instance(new THREE.BoxGeometry(1,.07,1),rockMat,paving,(a,i,o)=>{
    o.position.set(a.x,a.y,a.z);o.rotation.set(0,a.rot,0);o.scale.set(a.w,1,a.d)},false);

  // Vegetación con mallas de hojas reales (cruces de hojas lanceoladas), sin sprites.
  const leafVerts=[];
  function addLeaf(cx,cz,angle,len,width,elevation) {
    const dx=Math.cos(angle),dz=Math.sin(angle),nx=-dz,nz=dx;
    const v=[[cx,.04,cz],[cx+dx*len*.55+nx*width,elevation*.8,cz+dz*len*.55+nz*width],
    [cx+dx*len,elevation,cz+dz*len],[cx+dx*len*.55-nx*width,elevation*.8,cz+dz*len*.55-nz*width]];
    for(const id of [0,1,2,0,2,3])leafVerts.push(...v[id]);
  }
  for(let i=0;i<9;i++)addLeaf(0,0,i*Math.PI*2/9,rand(.65,1.15),rand(.1,.21),rand(.4,.95));
  const fernGeo=new THREE.BufferGeometry();fernGeo.setAttribute('position',new THREE.Float32BufferAttribute(leafVerts,3));fernGeo.computeVertexNormals();
  const fernData=[],grassData=[],flowerData=[];
  function openSpace(x,z){
    if(Math.hypot(x,z)<17)return true;
    if(pathDistance(x,z)<4.5)return true;
    if(bridges.some(q=>Math.abs(z-q)<6&&riverDistance(x,z)<14))return true;
    return false;
  }
  for(let i=0;i<2600;i++){
    const x=rand(-87,87),z=rand(-87,87),d=riverDistance(x,z);
    if(d<riverWidth(z)/2+.7)continue;
    if(openSpace(x,z)&&rnd()<.8)continue;
    const size=rand(.35,1.65),y=height(x,z)-.03;
    fernData.push({x,z,y,s:size,rot:rand(0,6.283),color:pick([0x538349,0x3c6e43,0x658f4c,0x4c7950,0x7c9b5a])});
  }
  instance(fernGeo,foliage,fernData,(a,i,o)=>{
    o.position.set(a.x,a.y,a.z);o.rotation.set(0,a.rot,0);o.scale.setScalar(a.s);
  },false);
  const grassGeo=new THREE.BufferGeometry(),gv=[];
  for(let i=0;i<3;i++){
    const a=i*Math.PI/3,dx=Math.cos(a),dz=Math.sin(a),nx=-dz*.055,nz=dx*.055;
    const v=[[nx,0,nz],[-nx,0,-nz],[dx*.15,rand(.45,.72),dz*.15]];
    for(const p of v)gv.push(...p);
  }
  grassGeo.setAttribute('position',new THREE.Float32BufferAttribute(gv,3));grassGeo.computeVertexNormals();
  for(let i=0;i<10500;i++){
    const x=rand(-88,88),z=rand(-88,88);
    if(riverDistance(x,z)<riverWidth(z)*.5+.8)continue;
    const s=rand(.35,1.5);grassData.push({x,z,y:height(x,z)-.01,s,rot:rand(0,6),color:pick([0x7f9e57,0x426d3e,0x759b50,0x9baa60,0x457746])});
  }
  instance(grassGeo,grassMat,grassData,(a,i,o)=>{
    o.position.set(a.x,a.y,a.z);o.rotation.set(0,a.rot,0);o.scale.set(a.s,Math.max(.4,a.s),a.s);
  });
  const flowerG=new THREE.IcosahedronGeometry(.12,0);
  for(let i=0;i<700;i++){
    const x=rand(-80,80),z=rand(-80,80);
    if(riverDistance(x,z)<riverWidth(z)/2+.8)continue;
    flowerData.push({x,y:height(x,z)+.22,z,s:rand(.45,1.5),color:pick([0xe1d5ed,0xb7a7ed,0xf4ebd0,0xf0c668,0x8bbbe9])});
  }
  instance(flowerG,foliage,flowerData,(a,i,o)=>{
    o.position.set(a.x,a.y,a.z);o.rotation.set(0,0,0);o.scale.setScalar(a.s);
  });
  // Arboleda con copas densas y troncos individuales, todo instanciado.
  const trunks=[],crownsA=[],crownsB=[],twigs=[];
  for(let i=0;i<380;i++){
    const x=rand(-91,91),z=rand(-91,91);
    if(Math.hypot(x,z)<23||openSpace(x,z)||riverDistance(x,z)<riverWidth(z)/2+3)continue;
    const size=rand(.77,1.6),h=rand(5.3,8.8)*size;
    trunks.push({x,y:height(x,z)+h*.49,z,h,s:size,color:pick([0x594534,0x644a34,0x77563a])});
    const shade=pick([0x527844,0x3e6c44,0x638948,0x73914e,0x426948,0x82a25f]);
    for(let j=0;j<4;j++){
      const a=j*Math.PI*.5+rand(-.35,.35),reach=rand(.7,2.1)*size;
      crownsA.push({x:x+Math.sin(a)*reach,y:height(x,z)+h*.76+rand(-.3,1.2),z:z+Math.cos(a)*reach,s:rand(1.4,2.25)*size,color:shade,rot:rand(0,6)});
    }
    crownsB.push({x,y:height(x,z)+h+1.2*size,z,s:rand(1.65,2.6)*size,color:shade,rot:rand(0,6)});
    if(i%6===0&&Math.hypot(x,z)<60)obstacleList.push({x,z,r:.4*size});
  }
  instance(new THREE.CylinderGeometry(.25,.42,1,8),bark,trunks,(a,i,o)=>{
    o.position.set(a.x,a.y,a.z);o.rotation.set(0,0,0);o.scale.set(a.s,a.h,a.s);
  },true);
  const canopyGeo=new THREE.IcosahedronGeometry(1,2);
  instance(canopyGeo,foliage,crownsA,(a,i,o)=>{
    o.position.set(a.x,a.y,a.z);o.rotation.set(.12,a.rot,.07);o.scale.set(a.s,a.s*.72,a.s*.9);
  });
  instance(canopyGeo,foliage,crownsB,(a,i,o)=>{
    o.position.set(a.x,a.y,a.z);o.rotation.set(.1,a.rot,.08);o.scale.set(a.s*.94,a.s*.72,a.s);
  });
  // Grandes piedras musgosas en torno al bosque, evitando las arenas centrales.
  const boulders=[];
  for(let i=0;i<450;i++){
    const x=rand(-90,90),z=rand(-90,90);
    if(openSpace(x,z)||Math.hypot(x,z)<22||riverDistance(x,z)<riverWidth(z)/2+1.4)continue;
    const size=rand(.45,2.15);
    boulders.push({x,y:height(x,z)+size*.26,z,size,rot:rand(0,6.28),color:pick([0x727968,0x596959,0x8c8f78,0x66745a,0x777b6e])});
  }
  instance(rockG,rockMat,boulders,(a,i,o)=>{
    o.position.set(a.x,a.y,a.z);o.rotation.set(0,a.rot,0);o.scale.set(a.size*1.15,a.size*.7,a.size*.86);
  },true);

  const slabGeo=new THREE.BoxGeometry(1,1,1);
  function block(x,y,z,sx,sy,sz,material=stone,rz=0) {
    const m=new THREE.Mesh(slabGeo,material);
    m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.rotation.z=rz;
    m.castShadow=true;m.receiveShadow=true;root.add(m);return m;
  }
  function ruin(x,z,scale=1){
    const y=height(x,z);
    const dais=new THREE.Mesh(new THREE.CylinderGeometry(7.8*scale,8.3*scale,.5,32),stone);
    dais.position.set(x,y+.10,z);dais.receiveShadow=true;root.add(dais);
    const inner=new THREE.Mesh(new THREE.CylinderGeometry(5.5*scale,5.5*scale,.08,48),moss);
    inner.position.set(x,y+.38,z);root.add(inner);
    for(let i=0;i<24;i++){
      const a=i*Math.PI/12,r=7.5*scale;
      block(x+Math.cos(a)*r,y+.3,z+Math.sin(a)*r,.9*scale,.45,.85*scale,stone,a);
    }
    for(let i=0;i<8;i++){
      if(i===1||i===4||i===6)continue;
      const a=i*Math.PI/4,r=6.5*scale,h=rand(2.1,4.4)*scale;
      block(x+Math.cos(a)*r,y+h/2,z+Math.sin(a)*r,.86*scale,h,.8*scale,stone);
      block(x+Math.cos(a)*r,y+h+.16,z+Math.sin(a)*r,1.4*scale,.34,1.3*scale,moss);
    }
    // Arco del santuario: dovelas individuales para dar silueta antigua.
    for(let i=0;i<=12;i++){
      const a=Math.PI-i*Math.PI/12,r=3.55*scale;
      const px=x+Math.cos(a)*r,py=y+3.5*scale+Math.sin(a)*r;
      block(px,py,z-4*scale,.76*scale,.78*scale,1.05*scale,stone,Math.PI/2-a);
    }
    block(x-3.5*scale,y+1.75*scale,z-4*scale,.9*scale,3.5*scale,1.05*scale);
    block(x+3.5*scale,y+1.75*scale,z-4*scale,.9*scale,3.5*scale,1.05*scale);
    obstacleList.push({x,z,r:6.9*scale});
  }
  ruin(-50,43,.95);ruin(-48,-48,.72);ruin(56,57,.8);
  // Puentes de piedra arqueados accesibles para cruzar el río.
  for(const z of bridges){
    const x=riverX(z);
    for(let i=-12;i<=12;i++){
      const dx=i*1.05,zz=z+Math.sin(i*.3)*.12;
      const arch=.25+.35*(1-(i/12)**2);
      block(x+dx,arch,zz,1.08,.28,5.4,i%3===0?stone:dust);
      if(i%3===0){
        block(x+dx,arch+.6,zz-2.73,1.05,1.05,.45,stone);
        block(x+dx,arch+.6,zz+2.73,1.05,1.05,.45,stone);
      }
    }
  }
  // Bordes con setos, raíces, rocas pequeñas y restos de muros rotos.
  for(let i=0;i<70;i++){
    const x=rand(-79,79),z=rand(-79,79);
    if(openSpace(x,z)||riverDistance(x,z)<riverWidth(z)/2+5)continue;
    const h=rand(.6,2.1),y=height(x,z);
    block(x,y+h*.5,z,rand(.6,1.4),h,rand(.55,1.4),pick([stone,moss,darkSoil]),rand(-.07,.07));
  }
  // Fondo más luminoso, sombras y profundidad sin aumentar demasiado los draw calls.
  const skyFill=new THREE.DirectionalLight(0xcde9da,.42);skyFill.position.set(25,30,-50);root.add(skyFill);

  return {
    height:usableHeight,
    blocked(x,z,r=.42){
      // Sólo ruinas y troncos grandes son obstáculos; la vegetación baja se atraviesa.
      for(const o of obstacleList){
        if(Math.abs(x-o.x)>o.r+r||Math.abs(z-o.z)>o.r+r)continue;
        if(Math.hypot(x-o.x,z-o.z)<o.r+r)return true;
      }
      return false;
    },
    update(dt){
      waterTexture.offset.y=(waterTexture.offset.y+dt*.018)%1;
    },
    root
  };
}
