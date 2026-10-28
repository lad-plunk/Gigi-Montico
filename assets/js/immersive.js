/* Five self-contained interpretations using existing site images and WebGL 1. */
(() => {
  'use strict';
  const byId = (id) => document.getElementById(id);
  const italian = document.documentElement.lang === 'it';
  const works = {
    prima: {
      title:'Prima composizione spaziale', image:'private-prima-composizione.jpg',
      textIt:'Griglie sospese e luce diffusa prendono forma in uno spazio da attraversare.',
      textEn:'Suspended grids and diffused light become a space to move through.',
      fog:[.59,.59,.56], floor:[.40,.41,.40], sky:[0,0,1,.49],
      colors:[[.80,.80,.73],[.59,.62,.59],[.39,.42,.42],[.90,.89,.78],[.64,.68,.66]]
    },
    teatrino: {
      title:"Teatrino dell'infinito", image:'private-teatrino-infinito.jpg',
      textIt:'Una successione di quinte materiche, aperture e segni rossi.',
      textEn:'A sequence of textured stages, openings and red marks.',
      fog:[.19,.30,.29], floor:[.19,.27,.27], sky:[.10,.12,.80,.65],
      colors:[[.12,.26,.25],[.35,.48,.43],[.65,.72,.64],[.65,.18,.17],[.82,.55,.40]]
    },
    deserto: {
      title:'Deserto rosso', image:'hi-deserto-rosso.jpg',
      textIt:'Un paesaggio di frammenti, trame e segni rossi.',
      textEn:'A landscape of fragments, textures and red marks.',
      fog:[.51,.34,.34], floor:[.40,.30,.31], sky:[0,0,1,.52],
      colors:[[.67,.19,.19],[.80,.35,.31],[.86,.68,.61],[.34,.25,.29],[.63,.45,.42]]
    },
    fabbriche: {
      title:'Fabbriche', image:'hi-fabbriche.jpg',
      textIt:'Strutture, tracce e superfici industriali si trasformano in un ambiente.',
      textEn:'Structures, traces and industrial surfaces become an environment.',
      fog:[.25,.39,.35], floor:[.20,.30,.28], sky:[0,0,1,.56],
      colors:[[.17,.38,.32],[.43,.63,.51],[.71,.73,.62],[.60,.19,.17],[.22,.24,.23]]
    },
    viaggio: {
      title:'Viaggio', image:'hi-viaggio-diametro.jpg',
      textIt:'Cerchi e passaggi sospesi reinterpretano la forma e la materia dell\'opera.',
      textEn:'Circles and suspended passages reinterpret the painting\'s shape and textures.',
      fog:[.26,.30,.39], floor:[.15,.22,.30], sky:[.04,.04,.92,.76],
      colors:[[.13,.27,.37],[.49,.40,.52],[.75,.66,.70],[.89,.83,.78],[.20,.42,.47]]
    }
  };
  const params = new URLSearchParams(location.search);
  const key = params.get('work');
  const work = works[key];
  const fail = (detail) => {
    byId('error').hidden = false;
    if (detail) byId('errorDetail').textContent = detail;
  };
  if (!work) {
    fail(italian ? 'Scegli un\'opera dalla pagina delle opere.' : 'Choose a painting from the works page.');
    return;
  }
  document.title = work.title + ' | Gigi Montico';
  byId('workTitle').textContent = work.title;
  byId('welcomeTitle').textContent = work.title;
  byId('description').textContent = italian ? work.textIt : work.textEn;
  byId('language').href += '?work=' + encodeURIComponent(key);
  const imagePath = '../assets/images/' + work.image;
  byId('welcomeImage').src = imagePath;
  byId('welcomeImage').alt = work.title;
  byId('originalImage').src = imagePath;
  byId('originalImage').alt = work.title;
  const canvas = byId('world');
  const gl = canvas.getContext('webgl', {alpha:false, antialias:true, powerPreference:'high-performance'});
  if (!gl) {
    fail(italian ? 'Il browser non riesce ad avviare la grafica 3D. Prova Safari, Chrome o Edge aggiornati.' : 'The browser could not start 3D graphics. Try an up-to-date Safari, Chrome or Edge.');
    return;
  }
  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    fail(italian ? 'La grafica 3D si è interrotta. Ricarica la pagina per riprovare.' : 'The 3D view was interrupted. Reload the page to try again.');
  });
  const painting = new Image();
  painting.onload = () => {
    try { start(painting); }
    catch (error) { console.error(error); fail(italian ? 'Impossibile caricare lo spazio. Ricarica la pagina per riprovare.' : 'Could not load this space. Reload the page to try again.'); }
  };
  painting.onerror = () => fail(italian ? 'Impossibile caricare l\'immagine dell\'opera.' : 'Could not load the painting image.');
  painting.src = imagePath;

  function start(img) {
    function compile(type, source) {
      const s = gl.createShader(type);
      gl.shaderSource(s, source); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    }
    function program(vs, fs) {
      const p = gl.createProgram();
      gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
      gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    }
    const sceneProgram = program(`
      attribute vec3 aPos; attribute vec3 aNormal; attribute vec2 aUV; attribute vec3 aColor;
      uniform mat4 uVP; uniform vec3 uCamera;
      varying vec2 vUV; varying vec3 vColor; varying float vLight; varying float vDist;
      void main() {
        vLight=.70+.30*max(dot(normalize(aNormal),normalize(vec3(-.35,.85,.38))),0.0);
        vUV=aUV; vColor=aColor; vDist=distance(aPos,uCamera); gl_Position=uVP*vec4(aPos,1.0);
      }`, `
      precision mediump float; uniform sampler2D uImage; uniform vec3 uFog;
      varying vec2 vUV; varying vec3 vColor; varying float vLight; varying float vDist;
      void main() {
        vec3 c=mix(vColor,texture2D(uImage,vUV).rgb,.50)*vLight;
        c=mix(c,uFog,smoothstep(28.0,78.0,vDist)*.68); gl_FragColor=vec4(c,1.0);
      }`);
    const skyProgram = program(`
      attribute vec3 aPos; attribute vec2 aUV; uniform mat4 uVP; uniform vec3 uCamera; varying vec2 vUV;
      void main(){vUV=aUV; gl_Position=uVP*vec4(aPos+uCamera,1.0);}`, `
      precision mediump float; uniform sampler2D uImage; varying vec2 vUV;
      void main(){gl_FragColor=vec4(texture2D(uImage,vUV).rgb*.90+vec3(.025),1.0);}`);
    function texture(image) {
      const t=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,t); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,image);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      return t;
    }
    // Keep texture memory bounded on phones while retaining the original file for the image dialog.
    const paintCanvas=document.createElement('canvas');
    const scale=Math.min(1,1024/Math.max(img.width,img.height));
    paintCanvas.width=Math.round(img.width*scale); paintCanvas.height=Math.round(img.height*scale);
    paintCanvas.getContext('2d').drawImage(img,0,0,paintCanvas.width,paintCanvas.height);
    const paintingTexture=texture(paintCanvas);
    const skyCanvas=document.createElement('canvas'); skyCanvas.width=1024; skyCanvas.height=512;
    const ctx=skyCanvas.getContext('2d'), s=work.sky;
    for (let i=0;i<2;i++) {
      ctx.save(); ctx.translate(i*512+(i%2?512:0),0); if(i%2)ctx.scale(-1,1);
      ctx.drawImage(img,img.width*s[0],img.height*s[1],img.width*s[2],img.height*s[3],0,0,512,370);
      ctx.restore();
    }
    const c=work.fog.map(x=>Math.round(x*255));
    const grad=ctx.createLinearGradient(0,360,0,512);
    grad.addColorStop(0,`rgba(${c[0]},${c[1]},${c[2]},0)`); grad.addColorStop(1,`rgb(${c[0]},${c[1]},${c[2]})`);
    ctx.fillStyle=grad; ctx.fillRect(0,360,1024,152);
    const skyTexture=texture(skyCanvas);

    let seed=({prima:12031,teatrino:44129,deserto:71871,fabbriche:71991,viaggio:44221})[key];
    const rand=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0; return seed/4294967296;};
    const between=(a,b)=>a+(b-a)*rand();
    const color=()=>work.colors[Math.floor(rand()*work.colors.length)];
    const crop=()=>{const u=rand()*.65,v=rand()*.6;return [u,v,u+.25,v+.35];};
    const verts=[];
    function vertex(p,n,uv,col) { verts.push(p[0],p[1],p[2],n[0],n[1],n[2],uv[0],uv[1],col[0],col[1],col[2]); }
    function quad(a,b,c,d,n,uv,col) {
      vertex(a,n,[uv[0],uv[1]],col); vertex(b,n,[uv[2],uv[1]],col); vertex(c,n,[uv[2],uv[3]],col);
      vertex(a,n,[uv[0],uv[1]],col); vertex(c,n,[uv[2],uv[3]],col); vertex(d,n,[uv[0],uv[3]],col);
    }
    function box(x,y,z,w,h,d,col,uv) {
      const x0=x-w/2,x1=x+w/2,y0=y,y1=y+h,z0=z-d/2,z1=z+d/2, t=uv||crop();
      quad([x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],t,col);
      quad([x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1],t,col);
      quad([x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0],t,col);
      quad([x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0],t,col);
      quad([x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0],t,col);
    }
    function cross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
    function norm(v){const d=Math.hypot(v[0],v[1],v[2])||1;return v.map(x=>x/d);}
    function beam(a,b,size,col){
      const dir=norm([b[0]-a[0],b[1]-a[1],b[2]-a[2]]), ref=Math.abs(dir[1])>.9?[1,0,0]:[0,1,0];
      const u=norm(cross(dir,ref)).map(x=>x*size/2),v=norm(cross(dir,u)).map(x=>x*size/2), t=crop();
      const point=(p,us,vs)=>p.map((x,i)=>x+u[i]*us+v[i]*vs);
      const faces=[[1,1,-1,1,v],[-1,1,-1,-1,u],[-1,-1,1,-1,v],[1,-1,1,1,u]];
      for(const [u1,v1,u2,v2,n] of faces) quad(point(a,u1,v1),point(a,u2,v2),point(b,u2,v2),point(b,u1,v1),norm(n),t,col);
    }
    function frame(x,z,w,h,col,thickness) {
      const t=thickness||.18;
      box(x-w/2,0,z,t,h,t,col);box(x+w/2,0,z,t,h,t,col);box(x,h-t/2,z,w,t,t,col);
    }
    function ring(x,y,z,r,col,size) {
      const count=48;
      for(let j=0;j<count;j++){
        const a=j*2*Math.PI/count,b=(j+1)*2*Math.PI/count;
        beam([x+r*Math.cos(a),y+r*Math.sin(a),z],[x+r*Math.cos(b),y+r*Math.sin(b),z],size,col);
      }
    }
    function disk(x,y,z,r,col){
      const n=40, center=[x,y,z], uv=[.37,.37,.63,.63];
      for(let j=0;j<n;j++) {
        const a=j*2*Math.PI/n,b=(j+1)*2*Math.PI/n;
        vertex(center,[0,0,1],[.5,.5],col);
        vertex([x+r*Math.cos(a),y+r*Math.sin(a),z],[0,0,1],[.5+.13*Math.cos(a),.5+.13*Math.sin(a)],col);
        vertex([x+r*Math.cos(b),y+r*Math.sin(b),z],[0,0,1],[.5+.13*Math.cos(b),.5+.13*Math.sin(b)],col);
      }
    }
    // All paintings supply the ground pigment. The geometry below is specific to each work.
    quad([-46,0,40],[46,0,40],[46,0,-56],[-46,0,-56],[0,1,0],[.01,.01,.99,.7],work.floor);
    if(key==='prima') {
      for(let z=3;z>=-39;z-=7) {
        frame(-8,z,7,between(5.5,8),work.colors[1],.11);
        frame(8,z,7,between(5.5,8),work.colors[2],.11);
        for(const x of [-11.5,-8,-4.5,4.5,8,11.5]) box(x,0,z,.06,between(2.5,7),.06,work.colors[3]);
      }
      for(let i=0;i<80;i++) {
        const x=between(-19,19),y=between(3,12),z=between(-42,-4),size=between(.12,.37);
        box(x,y,z,size,size,.10,work.colors[3]);
      }
      disk(6,13,-47,2.5,work.colors[3]);
      for(let i=0;i<10;i++)beam([-22,1+i*.12,-28+i*1.5],[22,1+i*.12,-28+i*1.5],.025,work.colors[3]);
    } else if(key==='teatrino') {
      for(let z=4;z>=-42;z-=9) {
        frame(0,z,8,9,work.colors[0],.38);
        frame(-9,z,8,9,work.colors[1],.26);
        frame(9,z,8,9,work.colors[1],.26);
        box(-14,.1,z,.25,8,.25,work.colors[0]);box(14,.1,z,.25,8,.25,work.colors[0]);
      }
      for(let i=0;i<7;i++) for(let j=0;j<36;j++){
        const x=-23+j*1.3, y=1.8+i*.16+Math.sin(j*.3+i*.24)*.48, z=-20+i*.13;
        beam([x,y,z],[x+1.35,y+Math.sin(j*.27)*.09,z],.12,work.colors[3]);
      }
      for(let i=0;i<45;i++) {const side=i%2?1:-1;box(side*between(6,22),0,between(-43,24),between(.12,.6),between(1,4),between(.12,.55),color());}
    } else if(key==='deserto') {
      for(let i=0;i<300;i++){
        const side=i%2?1:-1, x=side*between(2.6,29), z=between(-52,30), h=between(1.5,8), lean=between(-1.2,1.2), col=color();
        beam([x,.02,z],[x+lean,h,z+between(-.9,.9)],between(.06,.23),col);
        if(i%3===0)beam([x+lean*.55,h*.55,z],[x+lean+between(-1.4,1.4),h*.85,z+between(-1,1)],.07,col);
      }
      for(let i=0;i<65;i++)beam([between(-25,25),.04,between(-48,30)],[between(-25,25),.05,between(-48,30)],between(.03,.10),color());
    } else if(key==='fabbriche') {
      for(let z=5;z>=-45;z-=11) for(const side of [-1,1]){
        const x=side*between(8,16),w=between(4,7),h=between(4.5,10),d=between(3,6);
        box(x,0,z,w,h,d,color(),[.12,.1,.85,.9]);
        for(let j=0;j<Math.floor(w*3.5);j++){
          const xx=x-w/2+j*w/Math.floor(w*3.5);
          box(xx,.02,z+d/2+.03,.045,h,.045,j%6===0?work.colors[3]:work.colors[2]);
        }
        box(x+w*.22,h,z,.65,between(2,4),.65,work.colors[4]);
      }
      for(let z=-3;z>=-40;z-=10){
        beam([-17,6,z],[17,6,z],.24,work.colors[4]);
        beam([-17,0,z],[-17,6,z],.20,work.colors[1]);beam([17,0,z],[17,6,z],.20,work.colors[1]);
      }
      for(let i=0;i<45;i++){const x=between(-28,28),z=between(-48,25);beam([x,.1,z],[x+between(-2,2),between(1,4),z+between(-2,2)],.1,color());}
    } else if(key==='viaggio') {
      ring(0,5,-8,4.4,work.colors[2],.20);ring(0,5,-8,4.85,work.colors[3],.06);
      ring(0,5,-22,5.3,work.colors[1],.24);ring(0,5,-22,5.8,work.colors[2],.07);
      ring(0,6,-37,6.3,work.colors[2],.22);disk(0,12,-50,4.2,work.colors[3]);
      for(let i=0;i<90;i++){
        const side=i%2?1:-1,x=side*between(5,29),z=between(-50,28),h=between(.4,5);
        box(x,0,z,between(.16,1),h,between(.16,1),color());
      }
      for(let i=0;i<28;i++){
        const x=between(-25,25),y=between(5,14),z=between(-48,-5);
        ring(x,y,z,between(.15,.7),color(),.035);
      }
    }
    const sceneBuffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,sceneBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(verts),gl.STATIC_DRAW); const sceneCount=verts.length/11;
    const skyVertices=[], lon=48, lat=24, radius=90;
    function skyVertex(i,j){const theta=i/lon*2*Math.PI,phi=(j/lat-.5)*Math.PI;return [Math.cos(phi)*Math.sin(theta)*radius,Math.sin(phi)*radius,Math.cos(phi)*Math.cos(theta)*radius,i/lon,j/lat];}
    for(let j=0;j<lat;j++)for(let i=0;i<lon;i++){
      const a=skyVertex(i,j),b=skyVertex(i+1,j),c=skyVertex(i+1,j+1),d=skyVertex(i,j+1);skyVertices.push(...a,...b,...c,...a,...c,...d);
    }
    const skyBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(skyVertices),gl.STATIC_DRAW);
    function attrib(p,name,size,stride,offset){const index=gl.getAttribLocation(p,name);if(index>=0){gl.enableVertexAttribArray(index);gl.vertexAttribPointer(index,size,gl.FLOAT,false,stride,offset);}}
    function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
    function multiply(a,b){const out=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)out[c*4+r]+=a[k*4+r]*b[c*4+k];return out;}
    function view(pos,yaw,pitch){
      const sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);
      const fx=sy*cp,fy=sp,fz=-cy*cp,sx=cy,sz=sy,ux=-sy*sp,uy=cp,uz=cy*sp;
      return new Float32Array([sx,ux,-fx,0,0,uy,-fy,0,sz,uz,-fz,0,-(sx*pos[0]+sz*pos[2]),-(ux*pos[0]+uy*pos[1]+uz*pos[2]),fx*pos[0]+fy*pos[1]+fz*pos[2],1]);
    }
    let pos=[0,1.75,15],yaw=0,pitch=.04,last=0,live=false,lookPointer=null,lastX=0,lastY=0;
    const keys=new Set(), touch=new Set();
    const welcome=byId('welcome'),help=byId('help'),original=byId('original');
    const modalOpen=()=>!welcome.hidden||!help.hidden||!original.hidden;
    function clearControls(){keys.clear();touch.clear();document.querySelectorAll('.touch-controls button').forEach(b=>b.classList.remove('pressed'));}
    function reset(){pos=[0,1.75,15];yaw=0;pitch=.04;clearControls();}
    function openDialog(dialog){clearControls();dialog.hidden=false;dialog.querySelector('button').focus({preventScroll:true});}
    function closeDialog(dialog){dialog.hidden=true;(dialog===help?byId('helpBtn'):byId('originalBtn')).focus({preventScroll:true});}
    const enter=byId('enter'); enter.disabled=false; enter.textContent=italian?'Entra nello spazio':'Enter the space';
    enter.focus({preventScroll:true});
    enter.addEventListener('click',()=>{welcome.hidden=true;live=true;canvas.focus({preventScroll:true});setTimeout(()=>byId('hint').classList.add('fade'),9000);});
    byId('helpBtn').addEventListener('click',()=>openDialog(help));
    byId('originalBtn').addEventListener('click',()=>openDialog(original));
    byId('resetBtn').addEventListener('click',()=>{reset();help.hidden=true;canvas.focus({preventScroll:true});});
    document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>closeDialog(byId(button.dataset.close))));
    [help,original].forEach(el=>el.addEventListener('click',event=>{if(event.target===el)closeDialog(el);}));
    window.addEventListener('keydown',event=>{
      const k=event.key.toLowerCase();
      if(k==='escape'){if(!help.hidden)closeDialog(help);if(!original.hidden)closeDialog(original);clearControls();return;}
      if(modalOpen()){
        if(k==='tab'){
          const active=!welcome.hidden?welcome:(!help.hidden?help:original);
          const buttons=Array.from(active.querySelectorAll('button:not([disabled]),a[href]'));
          if(buttons.length){
            const first=buttons[0],lastButton=buttons[buttons.length-1];
            if(!active.contains(document.activeElement)){event.preventDefault();first.focus();}
            else if(event.shiftKey&&document.activeElement===first){event.preventDefault();lastButton.focus();}
            else if(!event.shiftKey&&document.activeElement===lastButton){event.preventDefault();first.focus();}
          }
        }
        return;
      }
      if(['w','a','s','d','q','e','i','j','k','l','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){keys.add(k);event.preventDefault();}
      if(k==='r')reset();
    });
    window.addEventListener('keyup',event=>keys.delete(event.key.toLowerCase()));
    window.addEventListener('blur',clearControls);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)clearControls();});
    canvas.addEventListener('pointerdown',event=>{
      if(modalOpen()||lookPointer!==null)return;
      lookPointer=event.pointerId;lastX=event.clientX;lastY=event.clientY;canvas.setPointerCapture(event.pointerId);event.preventDefault();
    });
    canvas.addEventListener('pointermove',event=>{
      if(event.pointerId!==lookPointer)return;
      yaw+=(event.clientX-lastX)*.0045;pitch=Math.max(-1.35,Math.min(1.35,pitch-(event.clientY-lastY)*.0045));lastX=event.clientX;lastY=event.clientY;
    });
    function endLook(event){if(event.pointerId===lookPointer)lookPointer=null;}
    canvas.addEventListener('pointerup',endLook);canvas.addEventListener('pointercancel',endLook);canvas.addEventListener('lostpointercapture',endLook);
    document.querySelectorAll('[data-move]').forEach(button=>{
      const action=button.dataset.move;
      button.addEventListener('pointerdown',event=>{if(modalOpen())return;event.preventDefault();touch.add(action);button.classList.add('pressed');button.setPointerCapture(event.pointerId);});
      const end=()=>{touch.delete(action);button.classList.remove('pressed');};
      button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);button.addEventListener('lostpointercapture',end);
      button.addEventListener('click',event=>{if(event.detail===0){touch.add(action);button.classList.add('pressed');setTimeout(end,220);}});
      button.addEventListener('contextmenu',event=>event.preventDefault());
    });
    function draw(time){
      const dt=last?Math.min((time-last)/1000,.05):0;last=time;
      if(live&&!modalOpen()){
        const f=((keys.has('w')||keys.has('arrowup')||touch.has('forward'))?1:0)-((keys.has('s')||keys.has('arrowdown')||touch.has('back'))?1:0);
        const r=((keys.has('d')||keys.has('arrowright')||touch.has('right'))?1:0)-((keys.has('a')||keys.has('arrowleft')||touch.has('left'))?1:0);
        const v=((keys.has('e')||touch.has('up'))?1:0)-((keys.has('q')||touch.has('down'))?1:0);
        const speed=(keys.has('shift')?9:4.5)*dt/Math.max(1,Math.hypot(f,r,v));
        pos[0]=Math.max(-42,Math.min(42,pos[0]+(Math.sin(yaw)*f+Math.cos(yaw)*r)*speed));
        pos[2]=Math.max(-52,Math.min(38,pos[2]+(-Math.cos(yaw)*f+Math.sin(yaw)*r)*speed));
        pos[1]=Math.max(.8,Math.min(20,pos[1]+v*speed));
        yaw+=((keys.has('l')?1:0)-(keys.has('j')?1:0))*dt*1.1;
        pitch=Math.max(-1.35,Math.min(1.35,pitch+((keys.has('i')?1:0)-(keys.has('k')?1:0))*dt));
      }
      const ratio=Math.min(window.devicePixelRatio||1,1.25),w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      gl.viewport(0,0,w,h);gl.clearColor(work.fog[0],work.fog[1],work.fog[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const vp=multiply(perspective(Math.PI/3,w/h,.08,220),view(pos,yaw,pitch));
      gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.useProgram(skyProgram);gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);
      attrib(skyProgram,'aPos',3,20,0);attrib(skyProgram,'aUV',2,20,12);
      gl.uniformMatrix4fv(gl.getUniformLocation(skyProgram,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(skyProgram,'uCamera'),pos);
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,skyTexture);gl.uniform1i(gl.getUniformLocation(skyProgram,'uImage'),0);gl.drawArrays(gl.TRIANGLES,0,skyVertices.length/5);
      gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.useProgram(sceneProgram);gl.bindBuffer(gl.ARRAY_BUFFER,sceneBuffer);
      attrib(sceneProgram,'aPos',3,44,0);attrib(sceneProgram,'aNormal',3,44,12);attrib(sceneProgram,'aUV',2,44,24);attrib(sceneProgram,'aColor',3,44,32);
      gl.uniformMatrix4fv(gl.getUniformLocation(sceneProgram,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(sceneProgram,'uCamera'),pos);gl.uniform3fv(gl.getUniformLocation(sceneProgram,'uFog'),work.fog);
      gl.bindTexture(gl.TEXTURE_2D,paintingTexture);gl.uniform1i(gl.getUniformLocation(sceneProgram,'uImage'),0);gl.drawArrays(gl.TRIANGLES,0,sceneCount);
      requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }
})();
