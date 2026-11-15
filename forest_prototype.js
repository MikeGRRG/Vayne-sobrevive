// Bosque del Río Antiguo — prototipo 3D v2 con materiales, formas orgánicas y acabado fotorrealista para Vayne Survivors.
// Generación determinista, geometría instanciada y sin descargas externas.
export function createForestPrototype(THREE, scene, sunlight, legacyProcedural, oldV2Scene, obstacleList) {
  for (const o of legacyProcedural) o.visible = false;
  for (const o of [...scene.children]) if (!oldV2Scene.has(o) && o !== sunlight.target) o.visible = false;
  obstacleList.length = 0;
  const root = new THREE.Group();root.name='Bosque del Rio Antiguo - prototipo v2 realista';scene.add(root);
  scene.background = new THREE.Color(0x9cafa0);
  scene.fog = new THREE.FogExp2(0x9baf9f,0.00425);
  sunlight.color.set(0xffefd8);sunlight.intensity=3.0;
  sunlight.shadow.bias=-0.00014;
  sunlight.shadow.normalBias=0.043;
  sunlight.shadow.radius=2.2;
  scene.add(new THREE.HemisphereLight(0xe1eee3,0x3b4b3d,.98));

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
  const bark=mat(0x74573d,.97);
  const foliage=mat(0xffffff,.82,{side:THREE.DoubleSide});
  const grassMat=mat(0xffffff,.88,{side:THREE.DoubleSide});
  const rockMat=mat(0xffffff,.93);
  const stone=mat(0xcac9bc,.93);
  const moss=mat(0x72915d,.94);
  const dust=mat(0xd0c4aa,1);
  const darkSoil=mat(0x514c3c,.98);
  // Albedo, normal map y mapa de rugosidad del mismo terreno.
  // Una textura generada y filtrada, con detalle fino incluso a ras del suelo.
  function makePBRTextures(size,stoneMode=false){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=size;
    const normalCanvas=document.createElement('canvas');normalCanvas.width=normalCanvas.height=size;
    const roughCanvas=document.createElement('canvas');roughCanvas.width=roughCanvas.height=size;
    const a=canvas.getContext('2d'),n=normalCanvas.getContext('2d'),r=roughCanvas.getContext('2d');
    const pixels=a.createImageData(size,size),normals=n.createImageData(size,size),roughness=r.createImageData(size,size);
    const heights=new Float32Array(size*size),m=size-1;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=y*size+x,j=i*4;
      const low=noise(x/(stoneMode?95:110),y/(stoneMode?95:110));
      const mid=noise(x/19,y/19),fine=noise(x/4.4,y/4.4);
      const grain=hash(x*2.17,y*3.71);
      const v=(low-.5)*59+(mid-.5)*27+(fine-.5)*15+(grain-.5)*13;
      const crack=stoneMode&&low<.385?-.12:0;
      const shade=v+(stoneMode?crack*44:0);
      heights[i]=clamp(.5+v/145,0,1);
      const color=stoneMode?[145,149,135]:[112,111,79];
      pixels.data[j]=clamp(color[0]+shade,0,255);
      pixels.data[j+1]=clamp(color[1]+shade*(stoneMode?.9:1.13),0,255);
      pixels.data[j+2]=clamp(color[2]+shade*(stoneMode?.81:.72),0,255);
      pixels.data[j+3]=255;
      const rr=clamp(stoneMode?224+(mid-.5)*24:219+(mid-.5)*34,160,255);
      roughness.data[j]=rr;roughness.data[j+1]=rr;roughness.data[j+2]=rr;roughness.data[j+3]=255;
    }
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=y*size+x,j=i*4,h=heights[i];
      const hl=heights[y*size+(x===0?m:x-1)],hr=heights[y*size+(x===m?0:x+1)];
      const hu=heights[(y===0?m:y-1)*size+x],hd=heights[(y===m?0:y+1)*size+x];
      const nx=(hl-hr)*2.1,nz=(hu-hd)*2.1,len=Math.hypot(nx,nz,1);
      normals.data[j]=Math.round(127.5+127.5*nx/len);
      normals.data[j+1]=Math.round(127.5+127.5*nz/len);
      normals.data[j+2]=Math.round(127.5+127.5/len);
      normals.data[j+3]=255;
    }
    a.putImageData(pixels,0,0);n.putImageData(normals,0,0);r.putImageData(roughness,0,0);
    const make=(src,isColor)=>{
      const tex=new THREE.CanvasTexture(src);
      tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
      tex.repeat.set(stoneMode?2.2:14,stoneMode?2.2:14);
      tex.magFilter=THREE.LinearFilter;
      tex.minFilter=THREE.LinearMipmapLinearFilter;
      tex.generateMipmaps=true;
      tex.anisotropy=16;
      if(isColor)tex.colorSpace=THREE.SRGBColorSpace;
      return tex;
    };
    return {albedo:make(canvas,true),normal:make(normalCanvas,false),rough:make(roughCanvas,false)};
  }
  const dirtMaps=makePBRTextures(1024,false);
  const stoneMaps=makePBRTextures(512,true);
  rockMat.map=stoneMaps.albedo;rockMat.normalMap=stoneMaps.normal;rockMat.normalScale.set(.28,.28);
  rockMat.roughnessMap=stoneMaps.rough;
  stone.map=stoneMaps.albedo;stone.normalMap=stoneMaps.normal;stone.normalScale.set(.25,.25);
  stone.roughnessMap=stoneMaps.rough;
  dust.map=stoneMaps.albedo;dust.normalMap=stoneMaps.normal;dust.normalScale.set(.18,.18);
  moss.map=stoneMaps.albedo;moss.normalMap=stoneMaps.normal;moss.normalScale.set(.14,.14);
  const baseTexture=dirtMaps.albedo;
  const floorGeo=new THREE.PlaneGeometry(190,190,280,280);
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
    map:baseTexture,normalMap:dirtMaps.normal,normalScale:new THREE.Vector2(.34,.34),roughnessMap:dirtMaps.rough,vertexColors:true,roughness:1
  }));
  floor.name='Bosque: suelo caminable';floor.receiveShadow=true;root.add(floor);

  const waterCoords=[],uv=[],indices=[];
  const sections=360,across=18;
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
    const c=document.createElement('canvas');c.width=512;c.height=1024;
    const cx=c.getContext('2d');
    cx.fillStyle='#a5d5cc';cx.fillRect(0,0,c.width,c.height);
    for(let i=0;i<1350;i++){
      const y=rnd()*c.height,x=rnd()*c.width,w=rand(22,220);
      cx.strokeStyle=i%5?'rgba(235,255,244,.10)':'rgba(22,92,94,.085)';
      cx.lineWidth=rand(.4,2.4);cx.beginPath();cx.moveTo(x,y);
      cx.bezierCurveTo(x+w*.25,y-rand(0,6),x+w*.62,y+rand(0,6),x+w,y);cx.stroke();
    }
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=16;t.minFilter=THREE.LinearMipmapLinearFilter;return t;
  })();
  const waterNormal=(()=>{
    const c=document.createElement('canvas');c.width=256;c.height=512;
    const ct=c.getContext('2d'),img=ct.createImageData(c.width,c.height);
    const wave=(x,y)=>Math.sin(y*.075+Math.sin(x*.028)*1.9)*.22+Math.sin(y*.19-x*.054)*.1+Math.sin(y*.036+x*.097)*.15;
    for(let y=0;y<512;y++)for(let x=0;x<256;x++){
      const u=(y*256+x)*4,nx=(wave(x-1,y)-wave(x+1,y))*.8,ny=(wave(x,y-1)-wave(x,y+1))*.8;
      const inv=1/Math.hypot(nx,ny,1);
      img.data[u]=127.5+127.5*nx*inv;img.data[u+1]=127.5+127.5*ny*inv;
      img.data[u+2]=127.5+127.5*inv;img.data[u+3]=255;
    }
    ct.putImageData(img,0,0);
    const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.anisotropy=16;t.minFilter=THREE.LinearMipmapLinearFilter;return t;
  })();
  const water=new THREE.Mesh(wGeo,new THREE.MeshPhysicalMaterial({
    color:0x8ac7c3,map:waterTexture,normalMap:waterNormal,
    normalScale:new THREE.Vector2(.72,.72),
    transparent:true,opacity:.82,metalness:0,roughness:.11,
    clearcoat:1,clearcoatRoughness:.065,
    side:THREE.DoubleSide,depthWrite:false
  }));
  wGeo.attributes.position.setUsage(THREE.DynamicDrawUsage);
  water.renderOrder=2;water.name='Rio animado - ondas suaves';root.add(water);
  let waterRippleClock=0,waterTime=0;

  const foamArr=[],banks=[],riverPebbles=[];
  for(let i=0;i<460;i++){
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
  // Silueta irregular pero continua: normales de roca suavizadas, no caras triangulares visibles.
  const rockG=new THREE.IcosahedronGeometry(1,2);
  const rp=rockG.attributes.position,rn=rockG.attributes.normal;
  for(let i=0;i<rp.count;i++){
    let x=rp.getX(i),y=rp.getY(i),z=rp.getZ(i);
    const k=1+.085*Math.sin(7*x+4*z)*Math.sin(6*y-2*x)+.05*Math.cos(13*z+3*y);
    x*=k;y*=k;z*=k;
    rp.setXYZ(i,x,y,z);
    const len=Math.hypot(x,y,z)||1;rn.setXYZ(i,x/len,y/len,z/len);
  }
  rp.needsUpdate=true;rn.needsUpdate=true;
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
  instance(new THREE.BoxGeometry(1,.07,1,2,1,2),rockMat,paving,(a,i,o)=>{
    o.position.set(a.x,a.y,a.z);o.rotation.set(0,a.rot,0);o.scale.set(a.w,1,a.d)},false);

  // Vegetación con mallas de hojas reales (cruces de hojas lanceoladas), sin sprites.
  // Frondes curvadas con nervio central y foliolos; comparten una sola geometría.
  const leafVerts=[];
  const leafTri=(a,b,c)=>leafVerts.push(...a,...b,...c);
  for(let f=0;f<9;f++){
    const angle=f*Math.PI*2/9+rand(-.1,.1),len=rand(.7,1.25),rise=rand(.4,.95);
    const dx=Math.cos(angle),dz=Math.sin(angle),nx=-dz,nz=dx;
    const frond=(t,offset=0)=>{
      const bend=Math.sin(t*Math.PI)*.09;
      return [dx*len*t+nx*(bend+offset),.035+rise*t*(.86+.14*t),dz*len*t+nz*(bend+offset)];
    };
    for(let j=0;j<6;j++){
      const t0=j/6,t1=(j+1)/6,w0=.2*Math.sin(Math.PI*(t0*.9+.04)),w1=.2*Math.sin(Math.PI*(t1*.9+.04));
      const a=frond(t0,-w0),b=frond(t0,w0),c=frond(t1,w1),d=frond(t1,-w1);
      leafTri(a,b,c);leafTri(a,c,d);
    }
    for(let j=1;j<6;j++){
      const t=j/7,lenLeaf=.2*(1-t*.4),center=frond(t);
      for(const side of [-1,1]){
        const root=frond(t+.065);
        const tip=[center[0]+nx*lenLeaf*side+dx*.08,center[1]+.035,center[2]+nz*lenLeaf*side+dz*.08];
        leafTri(root,center,tip);
      }
    }
  }
  const fernGeo=new THREE.BufferGeometry();
  fernGeo.setAttribute('position',new THREE.Float32BufferAttribute(leafVerts,3));
  fernGeo.computeVertexNormals();
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
  const grassTri=(a,b,c)=>gv.push(...a,...b,...c);
  for(let i=0;i<4;i++){
    const angle=i*Math.PI*.5+rand(-.2,.2),dx=Math.cos(angle),dz=Math.sin(angle),nx=-dz,nz=dx;
    const h=rand(.43,.8),width=rand(.045,.095),bend=rand(.07,.2);
    const left=[-nx*width,0,-nz*width],right=[nx*width,0,nz*width];
    const ml=[dx*bend*.35-nx*width*.6,h*.54,dz*bend*.35-nz*width*.6];
    const mr=[dx*bend*.35+nx*width*.6,h*.54,dz*bend*.35+nz*width*.6];
    const tip=[dx*bend,h,dz*bend];
    grassTri(left,right,mr);grassTri(left,mr,ml);grassTri(ml,mr,tip);
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
  const flowerPositions=[];
  for(let i=0;i<7;i++){
    const ang=i*2*Math.PI/7,dirX=Math.cos(ang),dirZ=Math.sin(ang),perpX=-dirZ,perpZ=dirX;
    const a=[0,0,0],b=[dirX*.21+perpX*.12,.015,dirZ*.21+perpZ*.12],
      c=[dirX*.3,.035,dirZ*.3],d=[dirX*.21-perpX*.12,.015,dirZ*.21-perpZ*.12];
    flowerPositions.push(...a,...b,...c,...a,...c,...d);
  }
  const flowerG=new THREE.BufferGeometry();
  flowerG.setAttribute('position',new THREE.Float32BufferAttribute(flowerPositions,3));
  flowerG.computeVertexNormals();
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
  const cp=canopyGeo.attributes.position,cn=canopyGeo.attributes.normal;
  for(let i=0;i<cp.count;i++){
    let x=cp.getX(i),y=cp.getY(i),z=cp.getZ(i);
    const factor=1+.095*Math.sin(7*x+5*z)*Math.cos(8*y+4*z)+.065*Math.sin(13*x-3*y);
    x*=factor;y*=factor;z*=factor;
    cp.setXYZ(i,x,y,z);
    const d=Math.hypot(x,y,z)||1;cn.setXYZ(i,x/d,y/d,z/d);
  }
  cp.needsUpdate=true;cn.needsUpdate=true;
  instance(canopyGeo,foliage,crownsA,(a,i,o)=>{
    o.position.set(a.x,a.y,a.z);o.rotation.set(.12,a.rot,.07);o.scale.set(a.s,a.s*.72,a.s*.9);
  });
  instance(canopyGeo,foliage,crownsB,(a,i,o)=>{
    o.position.set(a.x,a.y,a.z);o.rotation.set(.1,a.rot,.08);o.scale.set(a.s*.94,a.s*.72,a.s);
  });
  // Hojas en silueta a lo largo de las copas. Se agrupan en una malla instanciada
  // (un draw call) para ocultar el aspecto de esfera geométrica de los árboles.
  const leafShape=new THREE.BufferGeometry(),lv=[
    0,0,0,-.17,.22,.025,0,.52,.08,
    0,0,0,0,.52,.08,.17,.22,.025,
    0,.52,.08,-.08,.3,.09,.08,.3,.09
  ];
  leafShape.setAttribute('position',new THREE.Float32BufferAttribute(lv,3));leafShape.computeVertexNormals();
  const treetopLeaves=[];
  for(const c of [...crownsA,...crownsB]){
    for(let j=0;j<6;j++){
      const az=rand(0,Math.PI*2),vertical=rand(-.68,.78);
      const span=Math.sqrt(1-vertical*vertical);
      const x=c.x+Math.cos(az)*span*c.s*.8,
        z=c.z+Math.sin(az)*span*c.s*.78,
        y=c.y+vertical*c.s*.63;
      const green=new THREE.Color(c.color);
      green.multiplyScalar(rand(.81,1.21));
      treetopLeaves.push({x,y,z,s:rand(.55,1.22)*c.s,rot:az,tilt:rand(-1.25,-.3),color:green.getHex()});
    }
  }
  instance(leafShape,foliage,treetopLeaves,(a,i,o)=>{
    o.position.set(a.x,a.y,a.z);
    o.rotation.set(a.tilt,a.rot,Math.sin(a.rot)*.23);
    o.scale.set(a.s*.64,a.s*.7,a.s*.45);
  });
  // Oscurecimiento de contacto suave bajo árboles y rocas (AO aproximada barata).
  const shadowCanvas=document.createElement('canvas');shadowCanvas.width=shadowCanvas.height=128;
  const sc=shadowCanvas.getContext('2d'),gradient=sc.createRadialGradient(64,64,3,64,64,63);
  gradient.addColorStop(0,'rgba(7,18,12,.52)');
  gradient.addColorStop(.45,'rgba(9,24,15,.23)');
  gradient.addColorStop(1,'rgba(13,29,18,0)');
  sc.fillStyle=gradient;sc.fillRect(0,0,128,128);
  const shadowTex=new THREE.CanvasTexture(shadowCanvas);
  const shadowMat=new THREE.MeshBasicMaterial({
    map:shadowTex,transparent:true,opacity:.58,depthWrite:false,
    polygonOffset:true,polygonOffsetFactor:-1,side:THREE.DoubleSide
  });
  const shadowData=[
    ...trunks.map(t=>({x:t.x,y:height(t.x,t.z)+.055,z:t.z,s:t.s*4.3})),
    ...rockSet.filter(r=>r.size>.52).map(r=>({x:r.x,y:height(r.x,r.z)+.048,z:r.z,s:r.size*2.3}))
  ];
  instance(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),shadowMat,shadowData,(a,i,o)=>{
    o.position.set(a.x,a.y,a.z);o.rotation.set(0,0,0);o.scale.set(a.s,1,a.s);
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

  // Losas erosionadas con esquinas biseladas. La normal se calcula desde
  // el volumen redondeado para evitar el aspecto de cubos sin iluminación.
  function bevelBox(radius=.14){
    const geo=new THREE.BoxGeometry(1,1,1,4,4,4);
    const p=geo.attributes.position,n=geo.attributes.normal,t=.5-radius;
    for(let i=0;i<p.count;i++){
      const x=p.getX(i),y=p.getY(i),z=p.getZ(i),
        ix=clamp(x,-t,t),iy=clamp(y,-t,t),iz=clamp(z,-t,t);
      const dx=x-ix,dy=y-iy,dz=z-iz,len=Math.hypot(dx,dy,dz)||1;
      p.setXYZ(i,ix+dx/len*radius,iy+dy/len*radius,iz+dz/len*radius);
      n.setXYZ(i,dx/len,dy/len,dz/len);
    }
    geo.computeBoundingSphere();return geo;
  }
  const slabGeo=bevelBox(.14);
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
  const skyFill=new THREE.DirectionalLight(0xcde9da,.35);skyFill.position.set(25,30,-50);root.add(skyFill);

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
      waterTime+=dt;
      waterTexture.offset.y=(waterTexture.offset.y+dt*.024)%1;
      waterNormal.offset.y=(waterNormal.offset.y+dt*.029)%1;
      waterNormal.offset.x=.025*Math.sin(waterTime*.27);
      waterRippleClock+=dt;
      if(waterRippleClock>=.085){
        waterRippleClock=0;
        const attr=wGeo.attributes.position;
        for(let i=0;i<attr.count;i++){
          const x=waterCoords[i*3],z=waterCoords[i*3+2];
          attr.setY(i,-.47+.025*Math.sin(z*.39+waterTime*2.0)+.012*Math.sin(x*.81-z*.13+waterTime*3.1));
        }
        attr.needsUpdate=true;wGeo.computeVertexNormals();
      }
    },
    root
  };
}
