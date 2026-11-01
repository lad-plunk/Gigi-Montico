/* Separate experimental globe with nine stations and a walkable inner world. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id), italian = document.documentElement.lang === 'it';
  const M = window.MonticoPlanetMath, works = window.MONTICO_PLANET_WORKS;
  const radius = 300 / Math.PI, speed = 5, PI2 = Math.PI * 2;
  const canvas = $('world'), gl = canvas.getContext('webgl', {alpha:false, antialias:true, powerPreference:'default'});
  const fail = message => { $('error').hidden = false; if (message) $('errorDetail').textContent = message; };
  if (!gl || !M || !works || !window.MonticoLabGeometry) { fail(italian ? 'La grafica 3D non è disponibile. Prova un browser aggiornato.' : '3D graphics are unavailable. Try an updated browser.'); return; }
  canvas.addEventListener('webglcontextlost', event => {event.preventDefault(); fail(italian ? 'La grafica 3D si è interrotta. Ricarica la pagina.' : 'The 3D view was interrupted. Reload the page.');});
  function image(url) { return new Promise((resolve, reject) => {const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = url;}); }
  Promise.all([image('../assets/images/pianeta-dipinti.jpg'), image('../assets/images/pianeta-frammenti.jpg'), image('../assets/images/pianeta-rilievo-lunare.png'), image('../assets/images/casa-montico/casa-montico-001.jpg')])
    .then(images => { try { start(...images); } catch (error) { console.error(error); fail(italian ? 'Impossibile preparare il pianeta. Ricarica la pagina.' : 'Unable to prepare the planet. Reload the page.'); } })
    .catch(error => { console.error(error); fail(italian ? 'Impossibile caricare le immagini del pianeta.' : 'Unable to load the planet images.'); });

  function start(painting, fragments, lunar, woodImage) {
    const {dot,cross,scale,add,norm,rotate,advance} = M;
    const clamp = (value, low, high) => Math.max(low, Math.min(high, value));
    function normalAt(u, latitude) { const a = (u-.5)*PI2, c = Math.cos(latitude); return [c*Math.sin(a),Math.sin(latitude),c*Math.cos(a)]; }
    function coordinates(n) { return [((Math.atan2(n[0],n[2])/PI2+.5)%1+1)%1, Math.acos(clamp(n[1],-1,1))/Math.PI]; }
    const sun=normalAt(.105,.12);
    const heightCanvas = document.createElement('canvas'); heightCanvas.width = lunar.width; heightCanvas.height = lunar.height;
    const heightContext = heightCanvas.getContext('2d', {willReadFrequently:true}); heightContext.drawImage(lunar,0,0);
    const heightPixels = heightContext.getImageData(0,0,lunar.width,lunar.height).data;
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
      return elevation;
    }
    function shader(type, source) {const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    function program(vertex, fragment) {const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(p));return p;}
    const atlasSampler=`
      vec3 artwork(sampler2D tex,float index,vec2 uv){
        float n=mod(index+16.0,16.0);vec2 cell=vec2(mod(n,4.0),floor(n/4.0));
        return texture2D(tex,(cell+mix(vec2(.012),vec2(.988),uv))*.25).rgb;
      }
      vec2 mirrorRepeat(vec2 v){return 1.0-abs(mod(v,2.0)-1.0);}
    `;
    const surface = program(`
      attribute vec3 aPos; attribute vec3 aNormal; attribute vec2 aUV;
      uniform mat4 uVP; uniform vec3 uCamera; varying vec3 vNormal; varying vec2 vUV; varying float vDistance;
      void main(){vNormal=aNormal;vUV=aUV;vDistance=distance(aPos,uCamera);gl_Position=uVP*vec4(aPos,1.0);}
    `, `
      precision mediump float; uniform sampler2D uPaint; uniform vec3 uFog; uniform vec3 uSun;
      varying vec3 vNormal; varying vec2 vUV; varying float vDistance; ${atlasSampler}
      void main(){
        float sector=vUV.x*16.0-.5, id=floor(sector), blend=smoothstep(.15,.85,fract(sector));
        vec2 q=vec2(vUV.x*80.0,vUV.y*40.0);
        vec2 uv=mirrorRepeat(q+vec2(sin(q.y*1.7)*.18,cos(q.x*1.3)*.14));
        vec2 detail=mirrorRepeat(vec2(q.y*.67+1.2,q.x*.67+.7));
        vec3 a=mix(artwork(uPaint,id,uv),artwork(uPaint,id,detail),.25);
        vec3 b=mix(artwork(uPaint,id+1.0,uv),artwork(uPaint,id+1.0,detail),.25);
        vec3 paint=mix(a,b,blend);
        float light=.56+.44*max(dot(normalize(vNormal),normalize(uSun)),0.0);
        vec3 c=mix(vec3(.50,.42,.41),paint,.79)*light;
        c=mix(c,uFog,smoothstep(38.0,115.0,vDistance)*.52);gl_FragColor=vec4(c,1.0);
      }
    `);
    const forms = program(`
      attribute vec3 aPos;attribute vec3 aNormal;attribute vec2 aUV;attribute float aIndex;attribute float aWind;
      uniform mat4 uVP;uniform vec3 uCamera;uniform float uTime;varying vec3 vNormal;varying vec2 vUV;varying float vIndex;varying float vDistance;
      void main(){vec3 tangent=normalize(cross(vec3(0.0,1.0,0.0),normalize(aPos)));vec3 p=aPos+tangent*sin(uTime*.55+aIndex*1.37)*aWind*.22;
        vNormal=aNormal;vUV=aUV;vIndex=aIndex;vDistance=distance(p,uCamera);gl_Position=uVP*vec4(p,1.0);}
    `, `
      precision mediump float;uniform sampler2D uPaint;uniform vec3 uFog;uniform vec3 uSun;varying vec3 vNormal;varying vec2 vUV;varying float vIndex;varying float vDistance;${atlasSampler}
      void main(){vec3 c=artwork(uPaint,vIndex,clamp(vUV,0.0,1.0));float l=.58+.42*max(dot(normalize(vNormal),normalize(uSun)),0.0);
        c=mix(c*l,uFog,smoothstep(35.0,110.0,vDistance)*.55);gl_FragColor=vec4(c,1.0);}
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
    const paintingTexture=makeTexture(painting), fragmentTexture=makeTexture(fragments);
    const extras=window.MonticoLabGeometry.create(gl,{M,radius,ground,normalAt,sun,paintingTexture,fragmentTexture,woodImage});
    const paletteCanvas=document.createElement('canvas');paletteCanvas.width=4;paletteCanvas.height=4;const paletteContext=paletteCanvas.getContext('2d',{willReadFrequently:true});
    paletteContext.drawImage(painting,0,0,4,4);const palettePixels=paletteContext.getImageData(0,0,4,4).data;
    const palette=Array.from({length:16},(_,i)=>[palettePixels[i*4]/255,palettePixels[i*4+1]/255,palettePixels[i*4+2]/255]);
    const vertices=[], indices=[], longitude=256, latitude=128;
    for(let j=0;j<=latitude;j++)for(let i=0;i<=longitude;i++){
      const u=i/longitude,lat=(j/latitude-.5)*Math.PI,n=normalAt(u,lat),r=radius+ground(n);
      vertices.push(n[0]*r,n[1]*r,n[2]*r,...n,u,1-j/latitude);
      if(i<longitude&&j<latitude){const a=j*(longitude+1)+i,b=a+1,c=a+longitude+2,d=a+longitude+1;indices.push(a,d,c,a,c,b);}
    }
    const terrainBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,terrainBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
    const indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
    const formsData=[];
    function formCluster(index,side){
      const u=(index+(side? .77:.46))/16, lat=index===0&&!side ? .012 : (side ? -.055 : .055), up=normalAt(u,lat), angle=(u-.5)*PI2, east=[Math.cos(angle),0,-Math.sin(angle)], north=norm(cross(up,east)), base=radius+ground(up);
      const world=(x,y,z)=>add(add(scale(up,base+y),scale(east,x)),scale(north,z));
      function triangle(a,b,c){
        const n=norm(cross(add(b.p,scale(a.p,-1)),add(c.p,scale(a.p,-1))));
        [a,b,c].forEach(v=>formsData.push(...v.p,...n,v.u,v.v,index,v.wind));
      }
      function trunk(cx,cz,height,width,lean,phase,foot){
        const steps=5,sides=6;
        function point(row,col){const t=row/steps,a=col/sides*PI2,r=width*(1-.72*t)*(1+.14*Math.sin(a*3+phase+t*4));
          return {p:world(cx+Math.cos(a)*r+lean*t+Math.sin(t*4+phase)*t*.18,foot+height*t,cz+Math.sin(a)*r+Math.sin(t*5+phase)*t*.22),u:col/sides,v:t,wind:t*.7};}
        for(let j=0;j<steps;j++)for(let k=0;k<sides;k++){const a=point(j,k),b=point(j,k+1),c=point(j+1,k+1),d=point(j+1,k);triangle(a,b,c);triangle(a,c,d);}
      }
      function shard(x,z,foot,height,width,phase){
        const p=(dx,dy,dz,u,v)=>({p:world(x+dx,foot+dy,z+dz),u,v,wind:.65});
        const a=p(-width*.5,0,0,0,0),b=p(width*.4,height*.12,.12,1,0),c=p(width*.22,height,.12,1,1),d=p(-width*.3,height*.72,-.12,0,1);
        triangle(a,b,c);triangle(a,c,d);
      }
      function rock(x,z,size,phase){
        const top={p:world(x,size*(.65+.12*Math.sin(phase)),z),u:.5,v:1,wind:0},bottom={p:world(x,.02,z),u:.5,v:0,wind:0},ring=[];
        for(let k=0;k<6;k++){const a=k/6*PI2, r=size*(.55+.16*Math.sin(k*2+phase));ring.push({p:world(x+Math.cos(a)*r,size*.22,z+Math.sin(a)*r),u:k/6,v:.35,wind:0});}
        for(let k=0;k<6;k++){triangle(bottom,ring[(k+1)%6],ring[k]);triangle(top,ring[k],ring[(k+1)%6]);}
      }
      for(let k=0;k<4;k++){
        const x=(k-1.5)*.72, z=Math.sin(k*2.2+index+side)*.6, h=2.0+((index*7+k*3+side)%9)*.38;
        trunk(x,z,h,.16+(k%3)*.04,Math.sin(index+k)*.5,index+k,0);
        if(k%2===0)trunk(x,z,h*.43,.09,Math.sin(index+k+2)*1.0,index+k+3,h*.45);
      }
      for(let k=0;k<4;k++)rock((k-1.5)*1.4,1.2+Math.sin(index+k)*1.4,.4+(k%3)*.2,index+k);
      shard(1.5,-1.1,2.8,.9,.7,index);shard(-1.9,.3,3.5,.6,.45,index+2);
    }
    for(let i=0;i<16;i++){formCluster(i,0);formCluster(i,1);}
    const formsBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,formsBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(formsData),gl.STATIC_DRAW);
    const skyBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    function attrib(p,name,size,stride,offset){const i=gl.getAttribLocation(p,name);if(i>=0){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,stride,offset);}}
    function perspective(aspect){const f=1/Math.tan(Math.PI/6),near=.1,far=600,nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
    function multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
    function view(position,look,right,cameraUp){return new Float32Array([right[0],cameraUp[0],-look[0],0,right[1],cameraUp[1],-look[1],0,right[2],cameraUp[2],-look[2],0,-dot(right,position),-dot(cameraUp,position),dot(look,position),1]);}

    const welcome=$('welcome'),help=$('help'),original=$('original'),map=$('map'),special=$('special');
    const ambience=window.MonticoLabAudio?.create($('soundBtn'),italian),reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const ideas=[
      {it:'Segni che diventano paesaggio',en:'Marks become landscape',di:'Le linee del dipinto si alzano dal suolo. Confrontale con l’opera.',de:'Lines from the painting rise from the ground. Compare them with the artwork.'},
      {it:'La materia si ricompone',en:'Matter comes together',di:'Usa il pulsante per separare e ricomporre i frammenti davanti a te.',de:'Use the button to scatter and reassemble the fragments ahead.'},
      {it:'Dal grande al piccolo',en:'From large to small',di:'Entra nel legno immaginato e percorri il suo interno.',de:'Enter the imagined wood and explore its interior.'},
      {it:'Le opere si incontrano',en:'Artworks meet',di:'Colori e piani di opere vicine si mescolano lungo il passaggio.',de:'Colours and planes from neighbouring works mingle along the way.'},
      {it:'Un paesaggio vivo',en:'A living landscape',di:'Osserva i frammenti e le forme che si muovono lentamente.',de:'Watch the fragments and forms moving slowly.'},
      {it:'Un dialogo con le avanguardie',en:'A conversation with the avant-gardes',di:'Piani e frammenti suggeriscono collage e assemblaggio.',de:'Planes and fragments suggest collage and assemblage.'},
      {it:'Da una scultura reale',en:'Starting from a real sculpture',di:'La forma ricurva reinterpreta una fotografia di Casa Montico.',de:'The curved form reimagines a photograph from Casa Montico.'},
      {it:'Il suono cambia',en:'Sound changes',di:'La musica resta discreta mentre la trama sonora cambia con il luogo.',de:'The music remains quiet as the sound texture changes with the place.'},
      {it:'Mappa e percorso guidato',en:'Map and guided route',di:'Apri la mappa per saltare alle idee o avvia un percorso lento.',de:'Open the map to jump between ideas or start a slow route.'}
    ];
    const keys=new Set(),touch=new Set();let up,forward,pitch,lift,active=false,last=0,lookPointer=null,lastX=0,lastY=0,currentRegion=-1,currentIdea=-1;
    let micro=false,microPos=[0,0,8],microYaw=0,guided=false,guidedDistance=0,scatter=0,scatterTarget=0,pausedMotion=false,motionClock=0,skyName='';
    const modalOpen=()=>[welcome,help,original,map,special].some(dialog=>!dialog.hidden);
    const pick=(item)=>item[italian?'it':'en'], describe=(item)=>item[italian?'di':'de'];
    function clearControls(){keys.clear();touch.clear();document.querySelectorAll('[data-move]').forEach(button=>button.classList.remove('pressed'));lookPointer=null;}
    function actionLabel(){
      if(micro)return italian?'Torna al pianeta':'Return to the planet';
      const it=['Vedi le opere',scatterTarget?'Ricomponi':'Disgrega','Entra nel legno','Vedi le opere',pausedMotion?'Riprendi il movimento':'Ferma il movimento','Leggi la nota','Vedi la fotografia','Attiva / disattiva il suono',guided?'Ferma il percorso':'Avvia il percorso'];
      const en=['See the artworks',scatterTarget?'Reassemble':'Scatter','Enter the wood','See the artworks',pausedMotion?'Resume movement':'Pause movement','Read the note','See the photograph','Turn sound on / off',guided?'Stop the route':'Start the route'];
      return (italian?it:en)[Math.max(0,currentIdea)];
    }
    function updatePanel(){
      const item=ideas[Math.max(0,currentIdea)];$('region').replaceChildren();const small=document.createElement('span');
      small.textContent=micro?(italian?'DENTRO IL LEGNO':'INSIDE THE WOOD'):(italian?'IDEA ':'IDEA ')+String(currentIdea+1).padStart(2,'0')+' / 09';
      $('region').append(small,document.createTextNode(micro?(italian?'Un interno immaginato':'An imagined interior'):pick(item)));
      $('chapterDescription').textContent=micro?(italian?'Muoviti nel tunnel. Usa il pulsante per tornare al pianeta.':'Move through the tunnel. Use the button to return to the planet.'):describe(item);
      $('actionBtn').textContent=actionLabel();$('tourBtn').hidden=!guided;
    }
    function updateRegion(force=false){
      const u=coordinates(up)[0],index=Math.min(15,Math.floor(u*16)),idea=Math.floor((((u-.016+1+1/18)%1)*9))%9;
      if(!force&&index===currentRegion&&idea===currentIdea)return;
      const changed=idea!==currentIdea;currentRegion=index;currentIdea=idea;if(changed||force)ambience?.setRegion(idea,micro);updatePanel();
    }
    function updateOriginal(){for(let i=0;i<2;i++){const work=works[i][currentRegion],name=work[italian?'it':'en'],url='../'+work.image;
      $('originalLink'+i).href=url;$('originalImage'+i).src=url.replace('/full/','/previews/');$('originalImage'+i).alt=name;$('originalCaption'+i).textContent=name;}}
    function jumpStation(index){const u=(index/9+.016)%1;up=normalAt(u,0);const a=(u-.5)*PI2;forward=[Math.cos(a),0,-Math.sin(a)];pitch=-.08;lift=0;micro=false;$('skyState').hidden=false;guided=false;currentRegion=-1;currentIdea=-1;clearControls();updateRegion(true);}
    function reset(){jumpStation(0);}
    function openDialog(dialog){clearControls();dialog.hidden=false;dialog.querySelector('button').focus({preventScroll:true});}
    function closeDialog(dialog){dialog.hidden=true;(dialog===help?$('helpBtn'):dialog===map?$('mapBtn'):$('actionBtn')).focus({preventScroll:true});}
    ideas.forEach((idea,index)=>{const b=document.createElement('button');b.type='button';b.className='station-choice';b.textContent=String(index+1).padStart(2,'0')+'  '+pick(idea);b.addEventListener('click',()=>{jumpStation(index);map.hidden=true;canvas.focus({preventScroll:true});});$('stationList').appendChild(b);});
    function startTour(){jumpStation(0);guided=true;guidedDistance=0;map.hidden=true;updatePanel();canvas.focus({preventScroll:true});}
    function showSpecial(title,text,photo){$('specialTitle').textContent=title;$('specialText').textContent=text;$('specialImage').hidden=!photo;openDialog(special);}
    function enterMicro(){micro=true;guided=false;microPos=[0,0,8];microYaw=0;pitch=-.06;$('skyState').hidden=true;clearControls();ambience?.setRegion(currentIdea,true);updatePanel();}
    function exitMicro(){micro=false;pitch=-.08;$('skyState').hidden=false;clearControls();ambience?.setRegion(currentIdea,false);updatePanel();}
    function performAction(){
      if(micro){exitMicro();return;}
      if(currentIdea===0||currentIdea===3){updateOriginal();openDialog(original);}
      else if(currentIdea===1){scatterTarget=scatterTarget?0:1;updatePanel();}
      else if(currentIdea===2)enterMicro();
      else if(currentIdea===4){pausedMotion=!pausedMotion;updatePanel();}
      else if(currentIdea===5)showSpecial(italian?'Un dialogo aperto':'An open conversation',italian?'Piani, collage e assemblaggio evocano idee delle avanguardie del Novecento. È una suggestione da discutere con l’artista, non una dichiarazione sulle sue influenze.':'Planes, collage and assemblage evoke ideas from twentieth-century avant-gardes. This is a proposal for discussion with the artist, not a claim about his influences.',false);
      else if(currentIdea===6)showSpecial(italian?'La fotografia di partenza':'The source photograph',italian?'Questa fotografia di Casa Montico ispira una forma tridimensionale liberamente interpretata. Una ricostruzione fedele richiederebbe più fotografie o una scansione.':'This Casa Montico photograph inspires a freely interpreted three-dimensional form. A faithful reconstruction would require more photographs or a scan.',true);
      else if(currentIdea===7)$('soundBtn').click();
      else if(currentIdea===8){if(guided){guided=false;updatePanel();}else startTour();}
    }
    reset();$('enter').disabled=false;$('enter').textContent=italian?'Entra nel laboratorio':'Enter the laboratory';$('enter').focus({preventScroll:true});
    $('enter').addEventListener('click',()=>{welcome.hidden=true;active=true;ambience?.start();canvas.focus({preventScroll:true});setTimeout(()=>$('hint').classList.add('fade'),9000);});
    $('helpBtn').addEventListener('click',()=>openDialog(help));$('mapBtn').addEventListener('click',()=>openDialog(map));$('actionBtn').addEventListener('click',performAction);
    $('guidedStart').addEventListener('click',startTour);$('tourBtn').addEventListener('click',()=>{guided=false;updatePanel();});
    $('resetBtn').addEventListener('click',()=>{reset();help.hidden=true;canvas.focus({preventScroll:true});});
    document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>closeDialog($(button.dataset.close))));
    [help,original,map,special].forEach(dialog=>dialog.addEventListener('click',event=>{if(event.target===dialog)closeDialog(dialog);}));
    window.addEventListener('keydown',event=>{
      const k=event.key.toLowerCase();if(k==='escape'){for(const dialog of [help,original,map,special])if(!dialog.hidden)closeDialog(dialog);clearControls();return;}
      if(modalOpen()){
        if(k==='tab'){const dialog=[welcome,help,original,map,special].find(d=>!d.hidden),items=Array.from(dialog.querySelectorAll('button:not([disabled]),a[href]'));if(items.length){const first=items[0],lastItem=items[items.length-1];if(!dialog.contains(document.activeElement)){event.preventDefault();first.focus();}else if(event.shiftKey&&document.activeElement===first){event.preventDefault();lastItem.focus();}else if(!event.shiftKey&&document.activeElement===lastItem){event.preventDefault();first.focus();}}}
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
          if(guided){const east=norm(cross([0,1,0],up)),axis=norm(cross(up,east)),distance=speed*dt;up=norm(rotate(up,axis,distance/radius));forward=norm(rotate(forward,axis,distance/radius));guidedDistance+=distance;if(guidedDistance>=600){guided=false;updatePanel();}updateRegion();}
          else if(f||r){const moved=advance(up,forward,f,r,(keys.has('shift')?10:speed)*dt,radius);up=moved.up;forward=moved.forward;updateRegion();}
          lift=clamp(lift+v*speed*dt,0,150);
        }
        const turn=Number(keys.has('l'))-Number(keys.has('j'));if(turn){if(micro)microYaw+=turn*dt*1.1;else forward=norm(rotate(forward,up,-turn*dt*1.1));}
        pitch=clamp(pitch+(Number(keys.has('i'))-Number(keys.has('k')))*dt,-1.42,1.42);
      }
      const ratio=Math.min(devicePixelRatio||1,canvas.clientWidth<700?1.2:1.5),w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);
      if(micro){
        const position=microPos,look=norm([Math.sin(microYaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(microYaw)*Math.cos(pitch)]),right=norm(cross(look,[0,1,0])),cameraUp=norm(cross(right,look));
        const vp=multiply(perspective(w/h),view(position,look,right,cameraUp));gl.clearColor(.13,.09,.07,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.enable(gl.DEPTH_TEST);gl.depthMask(true);extras.drawMicro(vp,position,motionClock);requestAnimationFrame(draw);return;
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
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,paintingTexture);gl.uniform1i(gl.getUniformLocation(surface,'uPaint'),0);gl.uniformMatrix4fv(gl.getUniformLocation(surface,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(surface,'uCamera'),position);gl.uniform3fv(gl.getUniformLocation(surface,'uFog'),fog);gl.uniform3fv(gl.getUniformLocation(surface,'uSun'),sun);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
      extras.drawShadows(vp);
      gl.useProgram(forms);gl.bindBuffer(gl.ARRAY_BUFFER,formsBuffer);attrib(forms,'aPos',3,40,0);attrib(forms,'aNormal',3,40,12);attrib(forms,'aUV',2,40,24);attrib(forms,'aIndex',1,40,32);attrib(forms,'aWind',1,40,36);
      gl.bindTexture(gl.TEXTURE_2D,fragmentTexture);gl.uniform1i(gl.getUniformLocation(forms,'uPaint'),0);gl.uniformMatrix4fv(gl.getUniformLocation(forms,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(forms,'uCamera'),position);gl.uniform3fv(gl.getUniformLocation(forms,'uFog'),fog);gl.uniform3fv(gl.getUniformLocation(forms,'uSun'),sun);gl.uniform1f(gl.getUniformLocation(forms,'uTime'),motionClock);gl.drawArrays(gl.TRIANGLES,0,formsData.length/10);
      extras.draw(vp,position,motionClock,scatter,fog);
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }
})();
