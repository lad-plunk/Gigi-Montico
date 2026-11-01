/* A separate, more populated spherical world inspired by six Montico images. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), italian = document.documentElement.lang === 'it';
  const M=window.MonticoPlanetMath, radius=450/Math.PI, speed=7.5, PI2=Math.PI*2;
  const worlds=[
    {it:'Pianura dei segni',en:'Plain of marks',di:'Pietre, rilievi e tracce emergono dalla materia del dipinto.',de:'Stones, relief and traces emerge from the painting.',image:'assets/images/front-page-image.jpg',artIt:'Opera della pagina iniziale',artEn:'Homepage artwork',music:'prima'},
    {it:'Bosco della memoria',en:'Forest of memory',di:'Un bosco di forme diverse cresce dai segni verticali. Puoi entrare nel legno.',de:'A forest of varied forms grows from vertical marks. You can enter the wood.',image:'assets/images/hi-paure-inventate.jpg',artIt:'Paure inventate',artEn:'Paure inventate',music:'wood'},
    {it:'Lago delle luci',en:'Lake of light',di:'Acqua in movimento, rive, canne e una piccola barca.',de:'Moving water, banks, reeds and a small boat.',image:'assets/archive/montico-paintings/full/gm-0203.webp',artIt:'Immagine dell’archivio fotografico GM-0203',artEn:'Photographic archive image GM-0203',music:'viaggio'},
    {it:'Città di materia',en:'City of matter',di:'Case, tetti, finestre e alberi interpretano i segni di Fabbriche.',de:'Houses, roofs, windows and trees reinterpret marks from Fabbriche.',image:'assets/images/hi-fabbriche.jpg',artIt:'Fabbriche',artEn:'Fabbriche',music:'fabbriche'},
    {it:'Canyon rosso',en:'Red canyon',di:'Un vallone tra rilievi e pietre si ispira a Deserto rosso.',de:'A valley between ridges and stones is inspired by Deserto rosso.',image:'assets/images/hi-deserto-rosso.jpg',artIt:'Deserto rosso',artEn:'Deserto rosso',music:'deserto'},
    {it:'Giardino delle metamorfosi',en:'Garden of transformations',di:'Fiori e frammenti si muovono. Puoi separare e ricomporre la materia.',de:'Flowers and fragments move. You can scatter and reassemble the material.',image:'assets/images/hi-viaggio-diametro.jpg',artIt:'Viaggio - Diametro 92',artEn:'Viaggio - Diametro 92',music:'teatrino'}
  ];
  const canvas = $('world'), gl = canvas.getContext('webgl', {alpha:false, antialias:true, powerPreference:'default'});
  const fail = message => { $('error').hidden = false; if (message) $('errorDetail').textContent = message; };
  if (!gl || !M || !window.MonticoWorldGeometry || !window.MonticoLabGeometry) { fail(italian ? 'La grafica 3D non è disponibile. Prova un browser aggiornato.' : '3D graphics are unavailable. Try an updated browser.'); return; }
  canvas.addEventListener('webglcontextlost', event => {event.preventDefault(); fail(italian ? 'La grafica 3D si è interrotta. Ricarica la pagina.' : 'The 3D view was interrupted. Reload the page.');});
  function image(url) { return new Promise((resolve, reject) => {const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = url;}); }
  Promise.all([...worlds.map(world=>image('../'+world.image)),image('../assets/images/pianeta-rilievo-lunare.png')])
    .then(images => { try { start(images.slice(0,6),images[6]); } catch (error) { console.error(error); fail(italian ? 'Impossibile preparare il pianeta. Ricarica la pagina.' : 'Unable to prepare the planet. Reload the page.'); } })
    .catch(error => { console.error(error); fail(italian ? 'Impossibile caricare le immagini del pianeta.' : 'Unable to load the planet images.'); });

  function start(paintings,lunar) {
    const {dot,cross,scale,add,norm,rotate,advance} = M;
    const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
    function normalAt(u, latitude) { const a = (u-.5)*PI2, c = Math.cos(latitude); return [c*Math.sin(a),Math.sin(latitude),c*Math.cos(a)]; }
    function coordinates(n) { return [((Math.atan2(n[0],n[2])/PI2+.5)%1+1)%1, Math.acos(clamp(n[1],-1,1))/Math.PI]; }
    const sun=normalAt(.105,.12);
    const heightCanvas = document.createElement('canvas'); heightCanvas.width = lunar.width; heightCanvas.height = lunar.height;
    const heightContext = heightCanvas.getContext('2d', {willReadFrequently:true}); heightContext.drawImage(lunar,0,0);
    const heightPixels = heightContext.getImageData(0,0,lunar.width,lunar.height).data;
    const lakes=[{u:2/6+.034,lat:0,r:15,main:true},{u:2/6+.072,lat:.36,r:12},{u:2/6-.026,lat:-.42,r:11}];
    lakes.forEach(lake=>lake.n=normalAt(lake.u,lake.lat));
    const craters = [];
    for (let i=0;i<16;i++) craters.push({n:normalAt((i+.23)/16,(i%2 ? -.085 : .085)), r:4.1+(i%3)*.7});
    function ground(n) {
      const uv=coordinates(n), w=lunar.width, h=lunar.height, x=uv[0]*(w-1), y=uv[1]*(h-1), x0=Math.floor(x), y0=Math.floor(y), x1=Math.min(w-1,x0+1), y1=Math.min(h-1,y0+1), a=x-x0, b=y-y0;
      const get=(xx,yy)=>heightPixels[(yy*w+xx)*4]/255;
      let elevation=((get(x0,y0)*(1-a)+get(x1,y0)*a)*(1-b)+(get(x0,y1)*(1-a)+get(x1,y1)*a)*b-.5)*3.6;
      for (const crater of craters) {
        const distance2=Math.max(0,2*(1-dot(n,crater.n))*radius*radius), r2=crater.r*crater.r;
        if(distance2<r2*2.25){const d=Math.sqrt(distance2)/crater.r; if(d<1)elevation-=.55*(1-d*d)*(1-d*d); elevation+=.48*Math.exp(-Math.pow((d-1)/.17,2));}
      }
      // A shallow basin makes the animated water a place the visitor can cross.
      for(const lake of lakes){const d=Math.sqrt(Math.max(0,2*(1-dot(n,lake.n))*radius*radius));
        const blend=clamp((lake.r+3-d)/5,0,1);elevation=elevation*(1-blend)+(-1.35)*blend;}
      // Raised canyon sides follow a winding valley; both terrain and camera use this field.
      const longitude=uv[0],center=4/6+.016,delta=Math.abs((((longitude-center)+1.5)%1)-.5),zone=clamp((.105-delta)/.04,0,1);
      const latitude=(.5-uv[1])*Math.PI*radius,bend=Math.sin(longitude*36)*3,side=clamp((Math.abs(latitude-bend)-3)/11,0,1);
      elevation+=zone*(side*side*(3-2*side)*5.5-1.5);
      return elevation;
    }
    function shader(type, source) {const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    function program(vertex, fragment) {const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
    const atlasSampler=`
      vec3 artwork(sampler2D tex,float index,vec2 uv){
        float n=mod(index+6.0,6.0);vec2 cell=vec2(mod(n,4.0),floor(n/4.0));
        return texture2D(tex,(cell+mix(vec2(.006),vec2(.994),uv))/vec2(4.0,2.0)).rgb;
      }
      float imageAspect(float index){float i=mod(index+6.0,6.0);if(i<.5)return uAspectA.x;if(i<1.5)return uAspectA.y;if(i<2.5)return uAspectA.z;if(i<3.5)return uAspectB.x;if(i<4.5)return uAspectB.y;return uAspectB.z;}
      vec2 paintingUV(float index,vec2 uv){return fract(vec2(uv.x*180.0/max(.25,imageAspect(index)),uv.y*90.0));}
    `;
    const surface = program(`
      attribute vec3 aPos; attribute vec3 aNormal; attribute vec2 aUV;
      uniform mat4 uVP; uniform vec3 uCamera; varying vec3 vNormal; varying vec2 vUV; varying float vDistance;
      void main(){vNormal=aNormal;vUV=aUV;vDistance=distance(aPos,uCamera);gl_Position=uVP*vec4(aPos,1.0);}
    `, `
      #ifdef GL_FRAGMENT_PRECISION_HIGH
      precision highp float;
      #else
      precision mediump float;
      #endif
      uniform sampler2D uPaint; uniform vec3 uFog; uniform vec3 uSun;uniform vec3 uAspectA;uniform vec3 uAspectB;
      varying vec3 vNormal; varying vec2 vUV; varying float vDistance; ${atlasSampler}
      void main(){
        float sector=(vUV.x-.016)*6.0, id=floor(sector), blend=smoothstep(.30,.70,fract(sector));
        vec3 a=artwork(uPaint,id,paintingUV(id,vUV));
        vec3 b=artwork(uPaint,id+1.0,paintingUV(id+1.0,vUV));
        vec3 paint=mix(a,b,blend);
        float light=.56+.44*max(dot(normalize(vNormal),normalize(uSun)),0.0);
        vec3 c=mix(vec3(.50,.42,.41),paint,.90)*light;
        c=mix(c,uFog,smoothstep(38.0,115.0,vDistance)*.52);gl_FragColor=vec4(c,1.0);
      }
    `);
    const sky = program(`attribute vec2 aPos;varying vec2 vScreen;void main(){vScreen=aPos;gl_Position=vec4(aPos,1.0,1.0);}`, `
      precision mediump float;varying vec2 vScreen;uniform vec3 uUp;uniform vec3 uLook;uniform vec3 uRight;uniform vec3 uCameraUp;uniform vec3 uSun;uniform float uAspect;
      void main(){vec3 ray=normalize(uLook+uRight*vScreen.x*uAspect*.62+uCameraUp*vScreen.y*.62);
        float height=clamp(dot(ray,uUp)*1.4+.10,0.,1.);float altitude=dot(uUp,uSun);
        float day=smoothstep(-.16,.15,altitude);float twilight=1.-smoothstep(.04,.30,abs(altitude));
        vec3 night=mix(vec3(.055,.075,.12),vec3(.008,.018,.055),height);
        vec3 daylight=mix(vec3(.64,.76,.82),vec3(.12,.39,.69),height);
        vec3 c=mix(night,daylight,day)+vec3(.48,.17,.035)*twilight*pow(1.-height,2.);
        float stars=step(.9986,fract(sin(dot(floor(ray*510.),vec3(12.9898,78.233,37.719)))*43758.5453));
        c+=stars*(1.-day)*.75*smoothstep(.02,.4,height);
        float disk=smoothstep(.9993,.99975,dot(ray,uSun))*day;c=mix(c,vec3(1.,.91,.72),disk);
        gl_FragColor=vec4(c,1.);}
    `);
    function makeTexture(img) {
      const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);return t;
    }
    if (gl.getParameter(gl.MAX_TEXTURE_SIZE)<2048) throw new Error('Insufficient texture size');
    // Keep each entire source painting. Its original aspect is restored in the ground shader.
    const atlas=document.createElement('canvas');atlas.width=2048;atlas.height=1024;const atlasContext=atlas.getContext('2d');
    paintings.forEach((painting,i)=>atlasContext.drawImage(painting,(i%4)*512,Math.floor(i/4)*512,512,512));
    const aspects=paintings.map(p=>p.naturalWidth/p.naturalHeight),aspectA=new Float32Array(aspects.slice(0,3)),aspectB=new Float32Array(aspects.slice(3,6)),paintingTexture=makeTexture(atlas);
    const scene=window.MonticoWorldGeometry.create(gl,{M,radius,ground,normalAt,sun,paintingTexture,lakes});let innerExtras=null;
    const vertices=[], indices=[], longitude=320, latitude=160;
    for(let j=0;j<=latitude;j++)for(let i=0;i<=longitude;i++){
      const u=i/longitude,lat=(j/latitude-.5)*Math.PI,n=normalAt(u,lat),r=radius+ground(n);
      vertices.push(n[0]*r,n[1]*r,n[2]*r,...n,u,1-j/latitude);
      if(i<longitude&&j<latitude){const a=j*(longitude+1)+i,b=a+1,c=a+longitude+2,d=a+longitude+1;indices.push(a,d,c,a,c,b);}
    }
    const terrainBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,terrainBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    const indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
    const indexCount=indices.length;vertices.length=0;indices.length=0;
    const skyBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    function attrib(p,name,size,stride,offset){const i=gl.getAttribLocation(p,name);if(i>=0){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,stride,offset);}}
    function perspective(aspect){const f=1/Math.tan(Math.PI/6),near=.1,far=600,nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
    function multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
    function view(position,look,right,cameraUp){return new Float32Array([right[0],cameraUp[0],-look[0],0,right[1],cameraUp[1],-look[1],0,right[2],cameraUp[2],-look[2],0,-dot(right,position),-dot(cameraUp,position),dot(look,position),1]);}

    const welcome=$('welcome'),help=$('help'),original=$('original'),map=$('map');
    const ambience=window.MonticoWorldAmbient?.create($('soundBtn'),italian),reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const keys=new Set(),touch=new Set();let up,forward,pitch,lift,active=false,last=0,lookPointer=null,lastX=0,lastY=0,currentRegion=-1,currentIdea=-1;
    let micro=false,microPos=[0,0,8],microYaw=0,guided=false,guidedDistance=0,scatter=0,scatterTarget=0,pausedMotion=false,motionClock=0,skyName='',loadingInner=false;
    const modalOpen=()=>[welcome,help,original,map].some(dialog=>!dialog.hidden);
    const pick=(item)=>item[italian?'it':'en'], describe=(item)=>item[italian?'di':'de'];
    function clearControls(){keys.clear();touch.clear();document.querySelectorAll('[data-move]').forEach(button=>button.classList.remove('pressed'));lookPointer=null;}
    function actionLabel(){
      if(micro)return italian?'Torna al pianeta':'Return to the planet';
      if(currentIdea===1)return italian?'Entra nel legno':'Enter the wood';
      if(currentIdea===5)return italian?(scatterTarget?'Ricomponi':'Disgrega'):(scatterTarget?'Reassemble':'Scatter');
      return '';
    }
    function updatePanel(){
      const item=worlds[Math.max(0,currentIdea)];$('region').replaceChildren();const small=document.createElement('span');
      small.textContent=micro?(italian?'DENTRO IL LEGNO':'INSIDE THE WOOD'):(italian?'PAESAGGIO ':'LANDSCAPE ')+String(currentIdea+1).padStart(2,'0')+' / 06';
      $('region').append(small,document.createTextNode(micro?(italian?'Un interno immaginato':'An imagined interior'):pick(item)));
      $('chapterDescription').textContent=micro?(italian?'Muoviti nel tunnel. Usa il pulsante per tornare al pianeta.':'Move through the tunnel. Use the button to return to the planet.'):describe(item);
      $('actionBtn').textContent=loadingInner?(italian?'Caricamento...':'Loading...'):actionLabel();$('actionBtn').hidden=!micro&&currentIdea!==1&&currentIdea!==5;$('actionBtn').disabled=loadingInner;$('tourBtn').hidden=!guided;
    }
    function updateRegion(force=false){
      const u=coordinates(up)[0],idea=Math.floor((((u-.016+1+1/12)%1)*6))%6;
      if(!force&&idea===currentIdea)return;
      currentRegion=idea;currentIdea=idea;ambience?.setScene(worlds[idea].music);updatePanel();
    }
    function updateOriginal(){for(let i=0;i<2;i++){const work=worlds[(currentIdea+i)%worlds.length],name=work[italian?'artIt':'artEn'],url='../'+work.image;
      $('originalLink'+i).href=url;$('originalImage'+i).src=url.replace('/full/','/previews/');$('originalImage'+i).alt=name;$('originalCaption'+i).textContent=name;}}
    function jumpStation(index){const u=(index/6+.016+(index===2?-.009:0)+1)%1;up=normalAt(u,0);const a=(u-.5)*PI2;forward=[Math.cos(a),0,-Math.sin(a)];pitch=-.12;lift=0;micro=false;$('skyState').hidden=false;guided=false;currentRegion=-1;currentIdea=-1;clearControls();updateRegion(true);}
    function reset(){jumpStation(0);}
    function openDialog(dialog){clearControls();dialog.hidden=false;dialog.querySelector('button').focus({preventScroll:true});}
    function closeDialog(dialog){dialog.hidden=true;(dialog===help?$('helpBtn'):dialog===map?$('mapBtn'):dialog===original?$('originalBtn'):$('actionBtn')).focus({preventScroll:true});}
    worlds.forEach((idea,index)=>{const b=document.createElement('button');b.type='button';b.className='station-choice';b.textContent=String(index+1).padStart(2,'0')+'  '+pick(idea);b.addEventListener('click',()=>{jumpStation(index);map.hidden=true;canvas.focus({preventScroll:true});});$('stationList').appendChild(b);});
    function startTour(){jumpStation(0);guided=true;guidedDistance=0;map.hidden=true;updatePanel();canvas.focus({preventScroll:true});}
    async function enterMicro(){
      if(loadingInner)return;loadingInner=true;updatePanel();let failed=false;
      try{if(!innerExtras){const [fragments,woodImage]=await Promise.all([image('../assets/images/pianeta-frammenti.jpg'),image('../assets/images/casa-montico/casa-montico-001.jpg')]);
        const fragmentTexture=makeTexture(fragments);innerExtras=window.MonticoLabGeometry.create(gl,{M,radius,ground,normalAt,sun,paintingTexture,fragmentTexture,woodImage});}
        if(currentIdea===1&&!modalOpen()){micro=true;guided=false;microPos=[0,0,8];microYaw=0;pitch=-.06;$('skyState').hidden=true;clearControls();}
      }catch(error){console.error(error);failed=true;}
      finally{loadingInner=false;updatePanel();if(failed)$('chapterDescription').textContent=italian?'Impossibile caricare l’interno. Riprova.':'Unable to load the interior. Try again.';}
    }
    function exitMicro(){micro=false;pitch=-.12;$('skyState').hidden=false;clearControls();updatePanel();}
    function performAction(){
      if(micro){exitMicro();return;}
      if(currentIdea===1)enterMicro();
      else if(currentIdea===5){scatterTarget=scatterTarget?0:1;updatePanel();}
    }
    reset();$('enter').disabled=false;$('enter').textContent=italian?'Entra nel pianeta vivo':'Enter the living planet';$('enter').focus({preventScroll:true});
    $('enter').addEventListener('click',()=>{welcome.hidden=true;active=true;ambience?.start(worlds[currentIdea].music);canvas.focus({preventScroll:true});setTimeout(()=>$('hint').classList.add('fade'),9000);});
    $('helpBtn').addEventListener('click',()=>openDialog(help));$('mapBtn').addEventListener('click',()=>openDialog(map));$('actionBtn').addEventListener('click',performAction);$('originalBtn').addEventListener('click',()=>{updateOriginal();openDialog(original);});
    $('guidedStart').addEventListener('click',startTour);$('tourBtn').addEventListener('click',()=>{guided=false;updatePanel();});
    $('resetBtn').addEventListener('click',()=>{reset();help.hidden=true;canvas.focus({preventScroll:true});});
    document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>closeDialog($(button.dataset.close))));
    [help,original,map].forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog(dialog);}));
    window.addEventListener('keydown',event=>{
      const k=event.key.toLowerCase();if(k==='escape'){for(const dialog of [help,original,map])if(!dialog.hidden)closeDialog(dialog);clearControls();return;}
      if(modalOpen()){
        if(k==='tab'){const dialog=[welcome,help,original,map].find(d=>!d.hidden),items=Array.from(dialog.querySelectorAll('button:not([disabled]),a[href]'));if(items.length){const first=items[0],lastItem=items[items.length-1];if(!dialog.contains(document.activeElement)){event.preventDefault();first.focus();}else if(event.shiftKey&&document.activeElement===first){event.preventDefault();lastItem.focus();}else if(!event.shiftKey&&document.activeElement===lastItem){event.preventDefault();first.focus();}}}
        return;
      }
      if(['w','a','s','d','q','e','i','j','k','l','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){keys.add(k);event.preventDefault();}if(k==='r')reset();
    });
    window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));window.addEventListener('blur',clearControls);document.addEventListener('visibilitychange',()=>{if(document.hidden){clearControls();last=0;}});
    canvas.addEventListener('pointerdown',event=>{if(modalOpen()||lookPointer!==null)return;lookPointer=event.pointerId;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId);event.preventDefault();});
    canvas.addEventListener('pointermove',event=>{if(event.pointerId!==lookPointer)return;if(micro)microYaw+=(event.clientX-lastX)*.0045;else forward=norm(rotate(forward,up,-(event.clientX-lastX)*.0045));pitch=clamp(pitch-(event.clientY-lastY)*.0045,-1.42,1.42);lastX=event.clientX;lastY=event.clientY;});
    function endLook(event){if(event.pointerId===lookPointer)lookPointer=null;}canvas.addEventListener('pointerup',endLook);canvas.addEventListener('pointercancel',endLook);canvas.addEventListener('lostpointercapture',endLook);
    document.querySelectorAll('[data-move]').forEach(button=>{
      const action=button.dataset.move;button.addEventListener('pointerdown',event=>{if(modalOpen())return;event.preventDefault();touch.add(action);button.classList.add('pressed');button.setPointerCapture(event.pointerId);});
      const end=()=>{touch.delete(action);button.classList.remove('pressed');};button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);button.addEventListener('lostpointercapture',end);
      button.addEventListener('click',event=>{if(event.detail===0){touch.add(action);button.classList.add('pressed');setTimeout(end,220);}});button.addEventListener('contextmenu',event=>event.preventDefault());
    });
    function draw(time){
      const dt=last?clamp((time-last)/1000,0,.1):0;last=time;
      if(!pausedMotion&&!reduced.matches)motionClock+=dt;
      scatter=reduced.matches?scatterTarget:scatter+(scatterTarget-scatter)*Math.min(1,dt*3);
      if(active&&!modalOpen()){
        const f=Number(keys.has('w')||keys.has('arrowup')||touch.has('forward'))-Number(keys.has('s')||keys.has('arrowdown')||touch.has('back'));
        const r=Number(keys.has('d')||keys.has('arrowright')||touch.has('right'))-Number(keys.has('a')||keys.has('arrowleft')||touch.has('left'));
        const v=Number(keys.has('e')||touch.has('up'))-Number(keys.has('q')||touch.has('down'));
        if(guided&&(f||r||v)){guided=false;updatePanel();}
        if(micro){
          const move=2.4*dt/Math.max(1,Math.hypot(f,r));microPos[0]=clamp(microPos[0]+(Math.sin(microYaw)*f+Math.cos(microYaw)*r)*move,-2.7,2.7);
          microPos[2]=clamp(microPos[2]+(-Math.cos(microYaw)*f+Math.sin(microYaw)*r)*move,-43,15);microPos[1]=clamp(microPos[1]+v*2*dt,-.5,1.3);
        }else{
          if(guided){const east=norm(cross([0,1,0],up)),axis=norm(cross(up,east)),distance=speed*dt;up=norm(rotate(up,axis,distance/radius));forward=norm(rotate(forward,axis,distance/radius));guidedDistance+=distance;if(guidedDistance>=900){guided=false;updatePanel();}updateRegion();}
          else if(f||r){const moved=advance(up,forward,f,r,(keys.has('shift')?15:speed)*dt,radius);up=moved.up;forward=moved.forward;updateRegion();}
          lift=clamp(lift+v*speed*dt,0,150);
        }
        const turn=Number(keys.has('l'))-Number(keys.has('j'));if(turn){if(micro)microYaw+=turn*dt*1.1;else forward=norm(rotate(forward,up,-turn*dt*1.1));}
        pitch=clamp(pitch+(Number(keys.has('i'))-Number(keys.has('k')))*dt,-1.42,1.42);
      }
      const ratio=Math.min(devicePixelRatio||1,canvas.clientWidth<700?1.2:1.5),w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);
      if(micro){
        const position=microPos,look=norm([Math.sin(microYaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(microYaw)*Math.cos(pitch)]),right=norm(cross(look,[0,1,0])),cameraUp=norm(cross(right,look));
        const vp=multiply(perspective(w/h),view(position,look,right,cameraUp));gl.clearColor(.13,.09,.07,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);innerExtras.drawMicro(vp,position,motionClock);requestAnimationFrame(draw);return;
      }
      const position=scale(up,radius+ground(up)+1.8+lift),look=norm(add(scale(forward,Math.cos(pitch)),scale(up,Math.sin(pitch)))),right=norm(cross(look,up)),cameraUp=norm(cross(right,look));
      gl.clearColor(.04,.07,.12,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const vp=multiply(perspective(w/h),view(position,look,right,cameraUp)), uv=coordinates(up),altitude=dot(up,sun),day=clamp((altitude+.16)/.31,0,1),twilight=clamp(1-Math.abs(altitude)/.3,0,1);
      const fog=[.055+day*.47+twilight*.17,.075+day*.55+twilight*.05,.12+day*.55];
      const phase=(uv[0]-.105+1)%1,name=altitude>.15?(italian?'Giorno':'Day'):altitude<-.16?(italian?'Notte':'Night'):(phase<.5?(italian?'Tramonto':'Sunset'):(italian?'Alba':'Dawn'));
      if(name!==skyName){skyName=name;$('skyState').textContent=name;}
      gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.useProgram(sky);gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);attrib(sky,'aPos',2,8,0);
      gl.uniform3fv(gl.getUniformLocation(sky,'uUp'),up);gl.uniform3fv(gl.getUniformLocation(sky,'uLook'),look);gl.uniform3fv(gl.getUniformLocation(sky,'uRight'),right);gl.uniform3fv(gl.getUniformLocation(sky,'uCameraUp'),cameraUp);gl.uniform3fv(gl.getUniformLocation(sky,'uSun'),sun);gl.uniform1f(gl.getUniformLocation(sky,'uAspect'),w/h);gl.drawArrays(gl.TRIANGLES,0,6);
      gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.useProgram(surface);gl.bindBuffer(gl.ARRAY_BUFFER,terrainBuffer);attrib(surface,'aPos',3,32,0);attrib(surface,'aNormal',3,32,12);attrib(surface,'aUV',2,32,24);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,paintingTexture);gl.uniform1i(gl.getUniformLocation(surface,'uPaint'),0);gl.uniformMatrix4fv(gl.getUniformLocation(surface,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(surface,'uCamera'),position);gl.uniform3fv(gl.getUniformLocation(surface,'uFog'),fog);gl.uniform3fv(gl.getUniformLocation(surface,'uSun'),sun);gl.uniform3fv(gl.getUniformLocation(surface,'uAspectA'),aspectA);gl.uniform3fv(gl.getUniformLocation(surface,'uAspectB'),aspectB);gl.drawElements(gl.TRIANGLES,indexCount,gl.UNSIGNED_SHORT,0);
      scene.drawShadows(vp);scene.drawSolid(vp,position,motionClock,scatter,fog);scene.drawWater(vp,position,motionClock,fog);scene.drawMotes(vp,position,motionClock);
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }
})();
