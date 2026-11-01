/* Three small WebGL landscapes, each built from a credited source model. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),italian=document.documentElement.lang==='it';
  const scenes={
    dune:{
      titleIt:'Dune di materia',titleEn:'Dunes of matter',
      textIt:'Le dune diventano rilievi di colore. Segni sottili ondeggiano nel vento, come frammenti del quadro.',
      textEn:'The dunes become ridges of colour. Fine marks sway in the wind like fragments of the painting.',
      scaleIt:'Paesaggio: circa 72 × 60 metri. Dune ingrandite da un modello 3D.',
      scaleEn:'Landscape: approximately 72 × 60 metres. Dunes enlarged from a 3D model.',
      labelIt:'Dune · vento e materia',labelEn:'Dunes · wind and matter',file:'deserto-duna.glb',model:'Sand Dune · Grab3D',source:'https://grab3d.com/models/nature/sand-dune/',music:'deserto',factor:4,rise:.48,fog:[.54,.35,.35],area:'terrain'
    },
    arena:{
      titleIt:'Un’arena di segni',titleEn:'An arena of marks',
      textIt:'Un Colosseo immaginato diventa un luogo da attraversare, costruito con le trame e i segni di Deserto rosso.',
      textEn:'An imagined Colosseum becomes a place to explore, built from the textures and marks of Deserto rosso.',
      scaleIt:'Modello di partenza: circa 216 × 184 metri, alla scala del modello originale.',
      scaleEn:'Source model: approximately 216 × 184 metres, at its original scale.',
      labelIt:'Arena · archi e frammenti',labelEn:'Arena · arches and fragments',file:'deserto-colosseo.glb',model:'Colosseum · Grab3D',source:'https://grab3d.com/models/buildings/colosseum/',music:'fabbriche',factor:1,fog:[.46,.31,.32],area:'arena'
    },
    luna:{
      titleIt:'Una luna di pigmento',titleEn:'A moon of pigment',
      textIt:'Un suolo lunare immaginato accoglie il quadro. Piccoli frammenti galleggiano lentamente sopra i crateri.',
      textEn:'An imagined lunar surface holds the painting. Small fragments float slowly above the craters.',
      scaleIt:'Paesaggio: circa 94 × 94 metri. Rilievo lunare immaginato, non una mappa scientifica.',
      scaleEn:'Landscape: approximately 94 × 94 metres. An imagined lunar relief, not a scientific map.',
      labelIt:'Luna · crateri e particelle',labelEn:'Moon · craters and particles',file:'deserto-luna.glb',model:'Regolith ground tile · 3DAssets.dev',source:'https://3dassets.dev/assets/lunar-surface-colony-and-rovers-regolith-ground-tile-d9c409b0',music:'wood',factor:2.6,fog:[.37,.32,.38],area:'terrain'
    }
  };
  const key=new URLSearchParams(location.search).get('scene'),scene=scenes[key];
  const fail=message=>{$('error').hidden=false;if(message)$('errorDetail').textContent=message;};
  if(!scene){fail(italian?'Scegli un paesaggio dalla pagina delle opere.':'Choose a landscape from the works page.');return;}
  const title=italian?scene.titleIt:scene.titleEn;
  document.title=title+' | Gigi Montico';$('workTitle').textContent=title;$('welcomeTitle').textContent=title;
  $('description').textContent=italian?scene.textIt:scene.textEn;$('scaleInfo').textContent=italian?scene.scaleIt:scene.scaleEn;
  $('sceneLabel').textContent=italian?scene.labelIt:scene.labelEn;
  $('modelSource').textContent=scene.model;$('modelSource').href=scene.source;
  $('language').href+='?scene='+encodeURIComponent(key)+'&v=deserto-20261101';
  const canvas=$('world'),gl=canvas.getContext('webgl',{alpha:false,antialias:true,powerPreference:'high-performance'});
  if(!gl){fail(italian?'Il browser non riesce ad avviare la grafica 3D.':'The browser could not start 3D graphics.');return;}
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();fail(italian?'La grafica 3D si è interrotta. Ricarica la pagina.':'The 3D view was interrupted. Reload the page.');});
  function loadPainting(){return new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src='../assets/images/hi-deserto-rosso.jpg';});}
  Promise.all([fetch('../assets/models/'+scene.file).then(response=>{if(!response.ok)throw new Error('Model unavailable');return response.arrayBuffer();}),loadPainting()])
    .then(([buffer,painting])=>{try{start(readModel(buffer),painting);}catch(error){console.error(error);fail(italian?'Impossibile caricare il paesaggio. Ricarica la pagina.':'Could not load this landscape. Reload the page.');}})
    .catch(error=>{console.error(error);fail(italian?'Impossibile caricare il modello o l’opera.':'Could not load the model or painting.');});

  // Read the uncompressed geometry of the three source GLBs. Materials are replaced by the painting.
  function readModel(buffer){
    const file=new DataView(buffer);
    if(file.getUint32(0,true)!==0x46546c67||file.getUint32(4,true)!==2)throw new Error('Invalid GLB');
    const jsonLength=file.getUint32(12,true),json=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,20,jsonLength)).trim());
    const binHeader=20+jsonLength;
    if(file.getUint32(binHeader+4,true)!==0x004e4942)throw new Error('GLB binary chunk missing');
    const binStart=binHeader+8,node=json.nodes.find(item=>item.mesh!==undefined);
    if(!node||node.matrix||node.rotation)throw new Error('Unsupported model transform');
    const primitive=json.meshes[node.mesh].primitives[0];
    if(primitive.mode!==undefined&&primitive.mode!==4)throw new Error('Model is not triangles');
    function readAccessor(index){
      const a=json.accessors[index],view=json.bufferViews[a.bufferView],components={SCALAR:1,VEC2:2,VEC3:3}[a.type];
      const sizes={5122:2,5123:2,5125:4,5126:4},size=sizes[a.componentType];
      if(!size||!components||a.sparse)throw new Error('Unsupported model data');
      const stride=view.byteStride||size*components,start=binStart+(view.byteOffset||0)+(a.byteOffset||0),out=new Float32Array(a.count*components);
      for(let i=0;i<a.count;i++)for(let j=0;j<components;j++){
        const at=start+i*stride+j*size;
        let value=a.componentType===5126?file.getFloat32(at,true):a.componentType===5122?file.getInt16(at,true):a.componentType===5123?file.getUint16(at,true):file.getUint32(at,true);
        if(a.normalized)value=a.componentType===5122?Math.max(-1,value/32767):value/(a.componentType===5123?65535:4294967295);
        out[i*components+j]=value;
      }
      return out;
    }
    const position=readAccessor(primitive.attributes.POSITION),normal=readAccessor(primitive.attributes.NORMAL),scale=node.scale||[1,1,1],translation=node.translation||[0,0,0];
    const vertices=new Float32Array(position.length*2),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
    for(let i=0;i<position.length/3;i++){
      let nx=normal[i*3]/scale[0],ny=normal[i*3+1]/scale[1],nz=normal[i*3+2]/scale[2],length=Math.hypot(nx,ny,nz)||1;
      for(let axis=0;axis<3;axis++){
        const value=position[i*3+axis]*scale[axis]+translation[axis];vertices[i*6+axis]=value;min[axis]=Math.min(min[axis],value);max[axis]=Math.max(max[axis],value);
      }
      vertices[i*6+3]=nx/length;vertices[i*6+4]=ny/length;vertices[i*6+5]=nz/length;
    }
    let indices=null;
    if(primitive.indices!==undefined){const raw=readAccessor(primitive.indices);if(raw.some(value=>value>65535))throw new Error('Model exceeds WebGL index limit');indices=new Uint16Array(raw);}
    return {vertices,indices,min,max,count:vertices.length/6};
  }

  function start(model,painting){
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    function program(vs,fs){const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,vs));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
    const surface=program(`
      attribute vec3 aPos; attribute vec3 aNormal; attribute float aWind;
      uniform mat4 uVP; uniform vec3 uTranslate; uniform float uScale; uniform float uTime; uniform vec3 uCamera;
      varying vec3 vPos; varying vec3 vNormal; varying float vDistance;
      void main(){
        vec3 p=aPos; p.x+=sin(uTime*.65+p.z*.13+p.y*.25)*aWind*.55; p.z+=cos(uTime*.43+p.x*.17)*aWind*.22; p.y+=sin(uTime*.48+p.x*.12)*aWind*.12;
        vPos=p*uScale+uTranslate;vNormal=aNormal;vDistance=distance(vPos,uCamera);gl_Position=uVP*vec4(vPos,1.0);
      }`, `
      precision mediump float;uniform sampler2D uPaint;uniform vec3 uFog;
      varying vec3 vPos;varying vec3 vNormal;varying float vDistance;
      void main(){
        vec3 n=normalize(vNormal);float vertical=1.0-abs(n.y);
        vec2 ground=vPos.xz*.05;vec2 wall=mix(vPos.xy,vPos.zy,step(abs(n.z),abs(n.x)))*.05;
        vec3 pigment=mix(texture2D(uPaint,ground).rgb,texture2D(uPaint,wall).rgb,smoothstep(.25,.80,vertical));
        float light=.65+.35*max(dot(n,normalize(vec3(-.35,.85,.32))),0.0);
        vec3 c=mix(vec3(.48,.32,.31),pigment,.62)*light;
        c=mix(c,uFog,smoothstep(65.0,260.0,vDistance)*.42);gl_FragColor=vec4(c,1.0);
      }`);
    const sky=program(`
      attribute vec3 aPos;attribute vec2 aUV;uniform mat4 uVP;uniform vec3 uCamera;varying vec3 vDirection;varying vec2 vUV;
      void main(){vDirection=aPos;vUV=aUV;gl_Position=uVP*vec4(aPos+uCamera,1.0);}`, `
      precision mediump float;uniform sampler2D uPaint;uniform vec3 uFog;uniform float uTime;varying vec3 vDirection;varying vec2 vUV;
      void main(){vec3 d=normalize(vDirection);float h=smoothstep(-.20,.85,d.y);vec3 c=mix(uFog,vec3(.17,.17,.23),h);
        float grain=texture2D(uPaint,vUV*vec2(3.0,1.4)+vec2(uTime*.0015,0.0)).r-.5;
        c+=grain*.09;gl_FragColor=vec4(c,1.0);}`);
    const particles=program(`
      attribute vec3 aPos;attribute float aSeed;attribute float aEdge;uniform mat4 uVP;uniform float uTime;uniform float uDrift;
      void main(){vec3 p=aPos;p.x+=sin(uTime*.22+aSeed)*1.3;p.y=mod(aPos.y-uTime*uDrift+60.0,18.0)+1.0+aEdge*.34;gl_Position=uVP*vec4(p,1.0);}`, `
      precision mediump float;void main(){gl_FragColor=vec4(.98,.78,.70,.58);}`);
    const paintCanvas=document.createElement('canvas');paintCanvas.width=1024;paintCanvas.height=1024;paintCanvas.getContext('2d').drawImage(painting,0,0,1024,1024);
    const paintTexture=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,paintTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,paintCanvas);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.MIRRORED_REPEAT);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.MIRRORED_REPEAT);gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    const stepX=(model.max[0]-model.min[0])*scene.factor,stepZ=(model.max[2]-model.min[2])*scene.factor;
    const limitX=scene.area==='arena'?145:stepX*1.5-.8,limitZ=scene.area==='arena'?145:stepZ*1.5-.8;

    // A small height grid keeps the visitor above the actual repeated terrain.
    function heightGrid(){
      const size=48,grid=new Float32Array(size*size);grid.fill(-1e6);
      for(let i=0;i<model.count;i++){
        const x=model.vertices[i*6],y=model.vertices[i*6+1],z=model.vertices[i*6+2];
        const gx=Math.max(0,Math.min(size-1,Math.round((x-model.min[0])/(model.max[0]-model.min[0])*(size-1))));
        const gz=Math.max(0,Math.min(size-1,Math.round((z-model.min[2])/(model.max[2]-model.min[2])*(size-1))));
        grid[gz*size+gx]=Math.max(grid[gz*size+gx],y);
      }
      for(let pass=0;pass<12;pass++){
        const old=grid.slice();let missing=0;
        for(let z=0;z<size;z++)for(let x=0;x<size;x++)if(old[z*size+x]<-1e5){
          let sum=0,count=0;for(let dz=-1;dz<=1;dz++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,zz=z+dz;if(xx>=0&&zz>=0&&xx<size&&zz<size&&old[zz*size+xx]>-1e5){sum+=old[zz*size+xx];count++;}}
          if(count)grid[z*size+x]=sum/count;else missing++;
        }
        if(!missing)break;
      }
      for(let i=0;i<grid.length;i++)if(grid[i]<-1e5)grid[i]=0;
      // Join the repeated tiles at a common height and soften isolated source details.
      for(let pass=0;pass<2;pass++){
        const old=grid.slice();
        for(let z=1;z<size-1;z++)for(let x=1;x<size-1;x++)grid[z*size+x]=(old[z*size+x]*4+old[z*size+x-1]+old[z*size+x+1]+old[(z-1)*size+x]+old[(z+1)*size+x])/8;
      }
      const edgeHeight=key==='luna'?.35:0;
      for(let z=0;z<size;z++)for(let x=0;x<size;x++){
        const edge=Math.min(x,z,size-1-x,size-1-z),blend=Math.min(1,edge/4);grid[z*size+x]=edgeHeight+(grid[z*size+x]-edgeHeight)*blend;
      }
      return {grid,size};
    }
    const heights=scene.area==='terrain'?heightGrid():null;
    function ground(x,z){
      if(!heights)return 0;
      const ix=Math.max(-1,Math.min(1,Math.round(x/stepX))),iz=Math.max(-1,Math.min(1,Math.round(z/stepZ)));
      const u=Math.max(0,Math.min(.9999,(x-ix*stepX-model.min[0]*scene.factor)/stepX));
      const v=Math.max(0,Math.min(.9999,(z-iz*stepZ-model.min[2]*scene.factor)/stepZ));
      const fx=u*(heights.size-1),fz=v*(heights.size-1),x0=Math.floor(fx),z0=Math.floor(fz),a=fx-x0,b=fz-z0,s=heights.size,g=heights.grid;
      return ((g[z0*s+x0]*(1-a)+g[z0*s+x0+1]*a)*(1-b)+(g[(z0+1)*s+x0]*(1-a)+g[(z0+1)*s+x0+1]*a)*b)*scene.factor*(scene.rise||1);
    }
    function terrainMesh(){
      const size=heights.size,vertices=new Float32Array(size*size*6),indices=[];
      const dx=(model.max[0]-model.min[0])/(size-1),dz=(model.max[2]-model.min[2])/(size-1),g=heights.grid;
      for(let z=0;z<size;z++)for(let x=0;x<size;x++){
        const i=z*size+x,at=i*6,left=g[z*size+Math.max(0,x-1)],right=g[z*size+Math.min(size-1,x+1)],back=g[Math.max(0,z-1)*size+x],front=g[Math.min(size-1,z+1)*size+x];
        const rise=scene.rise||1;let nx=-(right-left)*rise/(2*dx),ny=1,nz=-(front-back)*rise/(2*dz),length=Math.hypot(nx,ny,nz);
        vertices[at]=model.min[0]+x*dx;vertices[at+1]=g[i]*rise;vertices[at+2]=model.min[2]+z*dz;vertices[at+3]=nx/length;vertices[at+4]=ny/length;vertices[at+5]=nz/length;
        if(x<size-1&&z<size-1){const a=i,b=i+1,c=i+size+1,d=i+size;indices.push(a,d,c,a,c,b);}
      }
      return {vertices,indices:new Uint16Array(indices),count:vertices.length/6};
    }
    const drawModel=heights?terrainMesh():model;
    const modelBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,modelBuffer);gl.bufferData(gl.ARRAY_BUFFER,drawModel.vertices,gl.STATIC_DRAW);
    let indexBuffer=null;if(drawModel.indices){indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,drawModel.indices,gl.STATIC_DRAW);}
    // A gently uneven approach surrounds the architectural model, below its own floor.
    let approachBuffer=null,approachCount=0;
    if(scene.area==='arena'){
      const approach=[],n=32,half=150,point=(x,z)=>{const px=-half+2*half*x/n,pz=-half+2*half*z/n;return [px,-.8+.18*Math.sin(px*.045)*Math.cos(pz*.035),pz,0,1,0];};
      for(let z=0;z<n;z++)for(let x=0;x<n;x++){const a=point(x,z),b=point(x+1,z),c=point(x+1,z+1),d=point(x,z+1);approach.push(...a,...d,...c,...a,...c,...b);}
      approachBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,approachBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(approach),gl.STATIC_DRAW);approachCount=approach.length/6;
    }
    let seed={dune:97113,arena:78191,luna:33917}[key];const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const between=(a,b)=>a+(b-a)*random();
    const ribbons=[];
    function ribbon(x,z,h,w,angle){
      const normal=[Math.sin(angle),0,Math.cos(angle)],base=ground(x,z)+.05,steps=5;
      const point=(side,t)=>[x+Math.cos(angle)*w*side+Math.sin(t*3+angle)*.13*t,base+h*t,z-Math.sin(angle)*w*side];
      const put=(p,t)=>ribbons.push(...p,...normal,t);
      for(let i=0;i<steps;i++){const a=i/steps,b=(i+1)/steps;put(point(-.5,a),a);put(point(.5,a),a);put(point(.5,b),b);put(point(-.5,a),a);put(point(.5,b),b);put(point(-.5,b),b);}
    }
    function floatingFragment(x,z,y,w,h,angle){
      const normal=[Math.sin(angle),0,Math.cos(angle)],point=(side,up)=>[x+Math.cos(angle)*w*side,y+h*up,z-Math.sin(angle)*w*side];
      const put=p=>ribbons.push(...p,...normal,1);
      const a=point(-.5,-.5),b=point(.5,-.5),c=point(.5,.5),d=point(-.5,.5);put(a);put(b);put(c);put(a);put(c);put(d);
    }
    for(let i=0;i<(scene.area==='arena'?90:70);i++){
      const x=between(-limitX*.78,limitX*.78),z=between(-limitZ*.78,limitZ*.78);
      const startZ=scene.area==='arena'?135:stepZ;
      if(Math.hypot(x,z-startZ)<8)continue;
      if(key==='luna')floatingFragment(x,z,ground(x,z)+between(2,10),between(.16,.65),between(.3,1.2),between(0,Math.PI*2));
      else ribbon(x,z,between(1.6,5.4),between(.12,.42),between(0,Math.PI*2));
    }
    const ribbonBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,ribbonBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(ribbons),gl.STATIC_DRAW);
    const motes=[];
    for(let i=0;i<180;i++){const x=between(-limitX,limitX),y=between(0,18),z=between(-limitZ,limitZ),phase=between(0,6.28);motes.push(x,y,z,phase,0,x,y,z,phase,1);}
    const particleBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,particleBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(motes),gl.STATIC_DRAW);
    const skyVertices=[],lon=48,lat=24,radius=390;
    function sphere(i,j){const a=i/lon*Math.PI*2,p=(j/lat-.5)*Math.PI;return [Math.cos(p)*Math.sin(a)*radius,Math.sin(p)*radius,Math.cos(p)*Math.cos(a)*radius,i/lon,j/lat];}
    for(let j=0;j<lat;j++)for(let i=0;i<lon;i++){const a=sphere(i,j),b=sphere(i+1,j),c=sphere(i+1,j+1),d=sphere(i,j+1);skyVertices.push(...a,...b,...c,...a,...c,...d);}
    const skyBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(skyVertices),gl.STATIC_DRAW);
    function attrib(p,name,size,stride,offset){const i=gl.getAttribLocation(p,name);if(i>=0){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,stride,offset);}}
    function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
    function multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
    function view(pos,yaw,pitch){const sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch),fx=sy*cp,fy=sp,fz=-cy*cp,sx=cy,sz=sy,ux=-sy*sp,uy=cp,uz=cy*sp;return new Float32Array([sx,ux,-fx,0,0,uy,-fy,0,sz,uz,-fz,0,-(sx*pos[0]+sz*pos[2]),-(ux*pos[0]+uy*pos[1]+uz*pos[2]),fx*pos[0]+fy*pos[1]+fz*pos[2],1]);}

    const welcome=$('welcome'),help=$('help'),original=$('original'),ambience=window.MonticoAmbient?.create($('soundBtn'),italian),reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const keys=new Set(),touch=new Set();let pos=[0,1.8,0],lift=0,yaw=0,pitch=.05,last=0,active=false,lookPointer=null,lastX=0,lastY=0;
    const modalOpen=()=>!welcome.hidden||!help.hidden||!original.hidden;
    function clearControls(){keys.clear();touch.clear();document.querySelectorAll('.touch-controls button').forEach(button=>button.classList.remove('pressed'));}
    function reset(){const z=scene.area==='arena'?135:stepZ;pos=[0,ground(0,z)+1.8,z];lift=0;yaw=0;pitch=.05;clearControls();}
    function openDialog(dialog){clearControls();dialog.hidden=false;dialog.querySelector('button').focus({preventScroll:true});}
    function closeDialog(dialog){dialog.hidden=true;(dialog===help?$('helpBtn'):$('originalBtn')).focus({preventScroll:true});}
    reset();$('enter').disabled=false;$('enter').textContent=italian?'Entra nel paesaggio':'Enter the landscape';$('enter').focus({preventScroll:true});
    $('enter').addEventListener('click',()=>{welcome.hidden=true;active=true;ambience?.start(scene.music);canvas.focus({preventScroll:true});setTimeout(()=>$('hint').classList.add('fade'),9000);});
    $('helpBtn').addEventListener('click',()=>openDialog(help));$('originalBtn').addEventListener('click',()=>openDialog(original));
    $('resetBtn').addEventListener('click',()=>{reset();help.hidden=true;canvas.focus({preventScroll:true});});
    document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>closeDialog($(button.dataset.close))));
    [help,original].forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog(dialog);}));
    window.addEventListener('keydown',event=>{
      const k=event.key.toLowerCase();if(k==='escape'){if(!help.hidden)closeDialog(help);if(!original.hidden)closeDialog(original);clearControls();return;}
      if(modalOpen()){
        if(k==='tab'){const dialog=!welcome.hidden?welcome:(!help.hidden?help:original),buttons=Array.from(dialog.querySelectorAll('button:not([disabled]),a[href]'));if(buttons.length){const first=buttons[0],lastButton=buttons[buttons.length-1];if(!dialog.contains(document.activeElement)){event.preventDefault();first.focus();}else if(event.shiftKey&&document.activeElement===first){event.preventDefault();lastButton.focus();}else if(!event.shiftKey&&document.activeElement===lastButton){event.preventDefault();first.focus();}}}
        return;
      }
      if(['w','a','s','d','q','e','i','j','k','l','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){keys.add(k);event.preventDefault();}if(k==='r')reset();
    });
    window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));window.addEventListener('blur',clearControls);document.addEventListener('visibilitychange',()=>{if(document.hidden)clearControls();});
    canvas.addEventListener('pointerdown',event=>{if(modalOpen()||lookPointer!==null)return;lookPointer=event.pointerId;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId);event.preventDefault();});
    canvas.addEventListener('pointermove',event=>{if(event.pointerId!==lookPointer)return;yaw+=(event.clientX-lastX)*.0045;pitch=Math.max(-1.35,Math.min(1.35,pitch-(event.clientY-lastY)*.0045));lastX=event.clientX;lastY=event.clientY;});
    function endLook(event){if(event.pointerId===lookPointer)lookPointer=null;}canvas.addEventListener('pointerup',endLook);canvas.addEventListener('pointercancel',endLook);canvas.addEventListener('lostpointercapture',endLook);
    document.querySelectorAll('[data-move]').forEach(button=>{
      const action=button.dataset.move;button.addEventListener('pointerdown',event=>{if(modalOpen())return;event.preventDefault();touch.add(action);button.classList.add('pressed');button.setPointerCapture(event.pointerId);});
      const end=()=>{touch.delete(action);button.classList.remove('pressed');};button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);button.addEventListener('lostpointercapture',end);
      button.addEventListener('click',event=>{if(event.detail===0){touch.add(action);button.classList.add('pressed');setTimeout(end,220);}});button.addEventListener('contextmenu',event=>event.preventDefault());
    });
    function draw(time){
      const dt=last?Math.min((time-last)/1000,.05):0;last=time;
      if(active&&!modalOpen()){
        const f=((keys.has('w')||keys.has('arrowup')||touch.has('forward'))?1:0)-((keys.has('s')||keys.has('arrowdown')||touch.has('back'))?1:0);
        const r=((keys.has('d')||keys.has('arrowright')||touch.has('right'))?1:0)-((keys.has('a')||keys.has('arrowleft')||touch.has('left'))?1:0);
        const v=((keys.has('e')||touch.has('up'))?1:0)-((keys.has('q')||touch.has('down'))?1:0),speed=(keys.has('shift')?12:5)*dt/Math.max(1,Math.hypot(f,r,v));
        pos[0]=Math.max(-limitX,Math.min(limitX,pos[0]+(Math.sin(yaw)*f+Math.cos(yaw)*r)*speed));pos[2]=Math.max(-limitZ,Math.min(limitZ,pos[2]+(-Math.cos(yaw)*f+Math.sin(yaw)*r)*speed));lift=Math.max(0,Math.min(30,lift+v*speed));
        yaw+=((keys.has('l')?1:0)-(keys.has('j')?1:0))*dt*1.1;pitch=Math.max(-1.35,Math.min(1.35,pitch+((keys.has('i')?1:0)-(keys.has('k')?1:0))*dt));
      }
      const targetHeight=ground(pos[0],pos[2])+1.8+lift;pos[1]+=Math.max(0,Math.min(1,dt*8))*(targetHeight-pos[1]);
      const ratio=Math.min(devicePixelRatio||1,canvas.clientWidth<700?1.3:1.6),w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      gl.viewport(0,0,w,h);gl.clearColor(...scene.fog,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const vp=multiply(perspective(Math.PI/3,w/h,.08,850),view(pos,yaw,pitch)),animationTime=reduced.matches?0:time*.001;
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,paintTexture);
      gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.useProgram(sky);gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);attrib(sky,'aPos',3,20,0);attrib(sky,'aUV',2,20,12);
      gl.uniformMatrix4fv(gl.getUniformLocation(sky,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(sky,'uCamera'),pos);gl.uniform3fv(gl.getUniformLocation(sky,'uFog'),scene.fog);gl.uniform1f(gl.getUniformLocation(sky,'uTime'),animationTime);gl.uniform1i(gl.getUniformLocation(sky,'uPaint'),0);gl.drawArrays(gl.TRIANGLES,0,skyVertices.length/5);
      gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.useProgram(surface);gl.uniformMatrix4fv(gl.getUniformLocation(surface,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(surface,'uCamera'),pos);gl.uniform3fv(gl.getUniformLocation(surface,'uFog'),scene.fog);gl.uniform1f(gl.getUniformLocation(surface,'uTime'),animationTime);gl.uniform1i(gl.getUniformLocation(surface,'uPaint'),0);
      const wind=gl.getAttribLocation(surface,'aWind');gl.disableVertexAttribArray(wind);gl.vertexAttrib1f(wind,0);
      if(approachBuffer){gl.bindBuffer(gl.ARRAY_BUFFER,approachBuffer);attrib(surface,'aPos',3,24,0);attrib(surface,'aNormal',3,24,12);gl.uniform1f(gl.getUniformLocation(surface,'uScale'),1);gl.uniform3f(gl.getUniformLocation(surface,'uTranslate'),0,0,0);gl.drawArrays(gl.TRIANGLES,0,approachCount);}
      gl.bindBuffer(gl.ARRAY_BUFFER,modelBuffer);attrib(surface,'aPos',3,24,0);attrib(surface,'aNormal',3,24,12);
      if(indexBuffer)gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
      gl.uniform1f(gl.getUniformLocation(surface,'uScale'),scene.factor);
      const repeat=scene.area==='arena'?0:1;
      for(let z=-repeat;z<=repeat;z++)for(let x=-repeat;x<=repeat;x++){
        gl.uniform3f(gl.getUniformLocation(surface,'uTranslate'),x*stepX,0,z*stepZ);
        if(drawModel.indices)gl.drawElements(gl.TRIANGLES,drawModel.indices.length,gl.UNSIGNED_SHORT,0);else gl.drawArrays(gl.TRIANGLES,0,drawModel.count);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER,ribbonBuffer);attrib(surface,'aPos',3,28,0);attrib(surface,'aNormal',3,28,12);attrib(surface,'aWind',1,28,24);gl.uniform3f(gl.getUniformLocation(surface,'uTranslate'),0,0,0);gl.uniform1f(gl.getUniformLocation(surface,'uScale'),1);gl.drawArrays(gl.TRIANGLES,0,ribbons.length/7);
      gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.useProgram(particles);gl.bindBuffer(gl.ARRAY_BUFFER,particleBuffer);attrib(particles,'aPos',3,20,0);attrib(particles,'aSeed',1,20,12);attrib(particles,'aEdge',1,20,16);
      gl.uniformMatrix4fv(gl.getUniformLocation(particles,'uVP'),false,vp);gl.uniform1f(gl.getUniformLocation(particles,'uTime'),animationTime);gl.uniform1f(gl.getUniformLocation(particles,'uDrift'),key==='luna'?.35:1.2);gl.drawArrays(gl.LINES,0,motes.length/5);gl.depthMask(true);gl.disable(gl.BLEND);
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }
})();
