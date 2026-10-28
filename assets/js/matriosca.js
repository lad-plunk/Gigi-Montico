/* An Italian, unlisted journey through nested interpretations of Montico's works. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const canvas = $('world');
  const gl = canvas.getContext('webgl', {alpha:false, antialias:true, powerPreference:'high-performance'});
  const showError = () => { $('error').hidden=false; };
  if (!gl) { showError(); return; }
  canvas.addEventListener('webglcontextlost', e => {e.preventDefault();showError();});
  const sources = [
    '../assets/images/hi-fabbriche.jpg',
    '../assets/images/private-teatrino-infinito.jpg',
    '../assets/images/casa-montico/casa-montico-001.jpg',
    '../assets/images/hi-viaggio-diametro.jpg'
  ];
  const stages = [
    {title:'Fabbriche', text:'Un quadro ne custodisce un altro. Il rosso diventa una soglia.', action:'Entra nel quadro \u2192', fog:[.26,.36,.31]},
    {title:"Teatrino dell'infinito", text:'Tra le quinte appare una forma immaginata dai legni di Montico.', action:'Entra nella scultura \u2192', fog:[.20,.29,.27]},
    {title:'Dentro il legno', text:'Le tracce nel legno diventano corridoi. Al loro interno, un altro quadro.', action:'Entra nel quadro \u2192', fog:[.38,.29,.25]},
    {title:'La materia di Viaggio', text:'Legno, tessuto e frammenti di circuito si incontrano e si trasformano.', action:'', fog:[.27,.28,.36]}
  ];
  function loadImage(src) { return new Promise((resolve,reject) => {const image=new Image(); image.onload=()=>resolve(image); image.onerror=reject; image.src=src;}); }
  Promise.all(sources.map(loadImage)).then(images => {
    try { initialize(images); } catch (error) { console.error(error); showError(); }
  }).catch(error => { console.error(error); showError(); });

  function initialize(images) {
    function compile(type,source) {
      const shader=gl.createShader(type); gl.shaderSource(shader,source); gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
      return shader;
    }
    function program(vs,fs) {
      const p=gl.createProgram(); gl.attachShader(p,compile(gl.VERTEX_SHADER,vs)); gl.attachShader(p,compile(gl.FRAGMENT_SHADER,fs)); gl.linkProgram(p);
      if(!gl.getProgramParameter(p,gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
      return p;
    }
    const sceneProgram=program(`
      attribute vec3 aPos; attribute vec3 aNormal; attribute vec2 aUV; attribute vec3 aColor; attribute vec3 aOffset;
      uniform mat4 uVP; uniform vec3 uCamera; uniform float uScatter;
      varying vec2 vUV; varying vec3 vColor; varying float vLight; varying float vDist;
      void main(){
        vec3 pos=aPos+aOffset*uScatter;
        vUV=aUV;vColor=aColor;vDist=distance(pos,uCamera);
        vLight=.73+.27*max(dot(normalize(aNormal),normalize(vec3(-.4,.85,.35))),0.0);
        gl_Position=uVP*vec4(pos,1.0);
      }`, `
      precision mediump float; uniform sampler2D uImage; uniform vec3 uFog; uniform float uMix;
      varying vec2 vUV; varying vec3 vColor; varying float vLight; varying float vDist;
      void main(){
        vec3 pigment=texture2D(uImage,vUV).rgb;
        vec3 c=mix(vColor,pigment,uMix)*vLight;
        c=mix(c,uFog,smoothstep(25.0,72.0,vDist)*.58);
        gl_FragColor=vec4(c,1.0);
      }`);
    const skyProgram=program(`
      attribute vec3 aPos; attribute vec2 aUV; uniform mat4 uVP; uniform vec3 uCamera; varying vec2 vUV;
      void main(){vUV=aUV;gl_Position=uVP*vec4(aPos+uCamera,1.0);}`, `
      precision mediump float; uniform sampler2D uImage; varying vec2 vUV;
      void main(){gl_FragColor=vec4(texture2D(uImage,vUV).rgb*.87+vec3(.025),1.0);}`);
    function texture(source) {
      const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,source);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);return t;
    }
    function resized(img) {
      const scale=Math.min(1,1024/Math.max(img.width,img.height)),c=document.createElement('canvas');
      c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c;
    }
    const textures={fabbriche:texture(resized(images[0])),teatrino:texture(resized(images[1])),viaggio:texture(resized(images[3]))};
    // A small wood-only crop of a photographed sculpture provides the colour and grain.
    const wood=document.createElement('canvas');wood.width=384;wood.height=384;
    wood.getContext('2d').drawImage(images[2],images[2].width*.49,images[2].height*.19,images[2].width*.12,images[2].height*.09,0,0,384,384);
    textures.wood=texture(wood);
    function makeSky(img,crop,fog) {
      const c=document.createElement('canvas');c.width=1024;c.height=512;const ctx=c.getContext('2d');
      for(let i=0;i<2;i++){
        ctx.save();ctx.translate(i*512+(i%2?512:0),0);if(i%2)ctx.scale(-1,1);
        ctx.drawImage(img,img.width*crop[0],img.height*crop[1],img.width*crop[2],img.height*crop[3],0,0,512,370);ctx.restore();
      }
      const rgb=fog.map(v=>Math.round(v*255));const grad=ctx.createLinearGradient(0,355,0,512);
      grad.addColorStop(0,`rgba(${rgb[0]},${rgb[1]},${rgb[2]},0)`);grad.addColorStop(1,`rgb(${rgb[0]},${rgb[1]},${rgb[2]})`);
      ctx.fillStyle=grad;ctx.fillRect(0,355,1024,157);return texture(c);
    }
    const skyTextures=[makeSky(images[0],[0,0,1,.55],stages[0].fog),makeSky(images[1],[.10,.1,.8,.68],stages[1].fog),makeSky(wood,[0,0,1,1],stages[2].fog),makeSky(images[3],[.1,.08,.8,.72],stages[3].fog)];
    let seed=718219;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const between=(a,b)=>a+(b-a)*rand();const crop=()=>{const u=rand()*.65,v=rand()*.62;return [u,v,u+.28,v+.30];};
    const palettes={green:[[.18,.38,.31],[.42,.60,.47],[.63,.68,.54],[.58,.20,.18],[.15,.22,.20]],wood:[[.43,.24,.16],[.64,.38,.25],[.28,.18,.13],[.72,.52,.34]],cloth:[[.57,.37,.47],[.78,.59,.63],[.88,.74,.67]],metal:[[.18,.40,.30],[.36,.53,.39],[.71,.43,.23]]};
    const color=(name)=>palettes[name][Math.floor(rand()*palettes[name].length)];
    function vecCross(a,b){return [a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];}
    function norm(v){const n=Math.hypot(...v)||1;return v.map(x=>x/n);}
    function builder(){
      const data={fabbriche:[],teatrino:[],viaggio:[],wood:[]};
      function vert(group,p,n,uv,c,off){data[group].push(...p,...n,...uv,...c,...(off||[0,0,0]));}
      function quad(group,a,b,c,d,n,uv,col,off){
        vert(group,a,n,[uv[0],uv[1]],col,off);vert(group,b,n,[uv[2],uv[1]],col,off);vert(group,c,n,[uv[2],uv[3]],col,off);
        vert(group,a,n,[uv[0],uv[1]],col,off);vert(group,c,n,[uv[2],uv[3]],col,off);vert(group,d,n,[uv[0],uv[3]],col,off);
      }
      function box(group,x,y,z,w,h,d,col,uv,off){
        const x0=x-w/2,x1=x+w/2,y0=y,y1=y+h,z0=z-d/2,z1=z+d/2,t=uv||crop();
        quad(group,[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],[0,0,1],t,col,off);
        quad(group,[x1,y0,z0],[x0,y0,z0],[x0,y1,z0],[x1,y1,z0],[0,0,-1],t,col,off);
        quad(group,[x1,y0,z1],[x1,y0,z0],[x1,y1,z0],[x1,y1,z1],[1,0,0],t,col,off);
        quad(group,[x0,y0,z0],[x0,y0,z1],[x0,y1,z1],[x0,y1,z0],[-1,0,0],t,col,off);
        quad(group,[x0,y1,z1],[x1,y1,z1],[x1,y1,z0],[x0,y1,z0],[0,1,0],t,col,off);
      }
      function beam(group,a,b,size,col,off){
        const dir=norm(b.map((x,i)=>x-a[i])),ref=Math.abs(dir[1])>.9?[1,0,0]:[0,1,0];
        const u=norm(vecCross(dir,ref)).map(x=>x*size/2),v=norm(vecCross(dir,u)).map(x=>x*size/2),uv=crop();
        const p=(base,us,vs)=>base.map((x,i)=>x+u[i]*us+v[i]*vs);
        for(const [u1,v1,u2,v2,n] of [[1,1,-1,1,v],[-1,1,-1,-1,u],[-1,-1,1,-1,v],[1,-1,1,1,u]])
          quad(group,p(a,u1,v1),p(a,u2,v2),p(b,u2,v2),p(b,u1,v1),norm(n),uv,col,off);
      }
      function curve(group,points,radii,col,off){
        const rings=[],sides=10;
        for(let i=0;i<points.length;i++){
          const before=points[Math.max(0,i-1)],after=points[Math.min(points.length-1,i+1)],dir=norm(after.map((x,k)=>x-before[k]));
          const ref=Math.abs(dir[1])>.85?[1,0,0]:[0,1,0],u=norm(vecCross(dir,ref)),v=norm(vecCross(dir,u));const ring=[];
          for(let j=0;j<=sides;j++){
            const a=j*2*Math.PI/sides,r=radii[i]*(.88+.12*Math.sin(j*3.1+i*1.37));
            const n=norm(u.map((x,k)=>x*Math.cos(a)+v[k]*Math.sin(a)));
            ring.push({p:points[i].map((x,k)=>x+n[k]*r),n});
          }
          rings.push(ring);
        }
        for(let i=0;i<points.length-1;i++)for(let j=0;j<sides;j++){
          const a=rings[i][j],b=rings[i][j+1],c=rings[i+1][j+1],d=rings[i+1][j],uv=[j/sides,i/(points.length-1),(j+1)/sides,(i+1)/(points.length-1)];
          vert(group,a.p,a.n,[uv[0],uv[1]],col,off);vert(group,b.p,b.n,[uv[2],uv[1]],col,off);vert(group,c.p,c.n,[uv[2],uv[3]],col,off);
          vert(group,a.p,a.n,[uv[0],uv[1]],col,off);vert(group,c.p,c.n,[uv[2],uv[3]],col,off);vert(group,d.p,d.n,[uv[0],uv[3]],col,off);
        }
      }
      function frame(group,x,z,w,h,col,t){t=t||.25;box(group,x-w/2,0,z,t,h,t,col);box(group,x+w/2,0,z,t,h,t,col);box(group,x,h-t/2,z,w,t,t,col);}
      function painting(group,x,y,z,w,h,borderColor){
        box('wood',x,y+h,z-.12,w+.5,.18,.18,borderColor);box('wood',x,y-.18,z-.12,w+.5,.18,.18,borderColor);
        box('wood',x-w/2-.16,y,z,.18,h,.18,borderColor);box('wood',x+w/2+.16,y,z,.18,h,.18,borderColor);
        quad(group,[x-w/2,y,z+.02],[x+w/2,y,z+.02],[x+w/2,y+h,z+.02],[x-w/2,y+h,z+.02],[0,0,1],[0,0,1,1],[1,1,1]);
      }
      function ring(group,x,y,z,r,col,size,off){for(let j=0;j<40;j++){const a=j*2*Math.PI/40,b=(j+1)*2*Math.PI/40;beam(group,[x+r*Math.cos(a),y+r*Math.sin(a),z],[x+r*Math.cos(b),y+r*Math.sin(b),z],size,col,off);}}
      function disk(group,x,y,z,r,col){
        for(let j=0;j<48;j++){
          const a=j*2*Math.PI/48,b=(j+1)*2*Math.PI/48;
          vert(group,[x,y,z],[0,0,1],[.5,.5],col);vert(group,[x+r*Math.cos(a),y+r*Math.sin(a),z],[0,0,1],[.5+.5*Math.cos(a),.5+.5*Math.sin(a)],col);vert(group,[x+r*Math.cos(b),y+r*Math.sin(b),z],[0,0,1],[.5+.5*Math.cos(b),.5+.5*Math.sin(b)],col);
        }
      }
      function ribbon(group,x,y,z,w,h,col,off,uvRect){
        const nx=8,ny=8,uv=uvRect||[0,0,1,1];
        const pt=(i,j)=>{const u=i/nx,v=j/ny;return [x+(u-.5)*w,y+v*h,z+Math.sin(u*8+v*2)*.16+Math.cos(v*7)*.08];};
        for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)quad(group,pt(i,j),pt(i+1,j),pt(i+1,j+1),pt(i,j+1),[0,0,1],[uv[0]+(uv[2]-uv[0])*i/nx,uv[1]+(uv[3]-uv[1])*j/ny,uv[0]+(uv[2]-uv[0])*(i+1)/nx,uv[1]+(uv[3]-uv[1])*(j+1)/ny],col,off);
      }
      function finish(){
        const out=[];
        for(const group of Object.keys(data))if(data[group].length){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data[group]),gl.STATIC_DRAW);out.push({texture:textures[group],count:data[group].length/14,buffer:b,group});}
        return out;
      }
      return {quad,box,beam,curve,frame,painting,ring,disk,ribbon,finish};
    }
    const worlds=[];
    {
      const b=builder();
      b.quad('fabbriche',[-45,0,40],[45,0,40],[45,0,-55],[-45,0,-55],[0,1,0],[0,0,1,.7],[.18,.32,.26]);
      for(let z=7;z>=-45;z-=11)for(const side of [-1,1]){
        const x=side*between(9,17),w=between(4,7),h=between(4,9),d=between(3,6);
        b.box('fabbriche',x,0,z,w,h,d,color('green'),[.12,.1,.85,.9]);
        for(let j=0;j<Math.floor(w*3);j++)b.box('fabbriche',x-w/2+j*w/Math.floor(w*3),.02,z+d/2+.03,.05,h,.05,palettes.green[j%5]);
      }
      for(let z=-8;z>=-38;z-=10)b.beam('fabbriche',[-19,8,z],[19,8,z],.25,palettes.green[4]);
      b.painting('teatrino',0,1.5,-15,9,6.8,[.35,.23,.17]);
      worlds.push(b.finish());
    }
    {
      const b=builder();b.quad('teatrino',[-45,0,40],[45,0,40],[45,0,-55],[-45,0,-55],[0,1,0],[0,0,1,.7],[.18,.27,.25]);
      for(let z=5;z>=-41;z-=9){b.frame('teatrino',0,z,9,9,[.15,.27,.23],.30);b.frame('teatrino',-10,z,8,9,[.31,.43,.37],.20);b.frame('teatrino',10,z,8,9,[.31,.43,.37],.20);}
      for(let i=0;i<4;i++)for(let j=0;j<26;j++){const x=-18+j*1.4,y=1.8+i*.14+Math.sin(j*.3+i*.3)*.45;b.beam('teatrino',[x,y,-23+i*.1],[x+1.45,y+.08,-23+i*.1],.10,[.72,.17,.14]);}
      // Curved, faceted volume inspired by the photographed wood, not a scan.
      b.curve('wood',[[-2.2,0,-12],[-2.5,1.5,-12],[-2.35,3.5,-12],[-1.9,5.2,-12],[-.7,6.6,-12],[.7,6.8,-12],[2,6,-12],[2.6,4.7,-12],[2.4,3,-12],[1.9,2,-12]],[.38,.40,.42,.50,.60,.65,.62,.55,.45,.42],[.67,.43,.28]);
      b.curve('wood',[[-2.1,2.7,-12],[-3,3.5,-11.8],[-3.3,4.5,-11.9],[-3.15,5.3,-12]],[.22,.25,.21,.13],[.56,.34,.22]);
      b.curve('wood',[[1.7,5.5,-12],[2.5,6.2,-12.2],[2.9,7.0,-12.4],[3,7.6,-12.5]],[.24,.22,.18,.10],[.58,.36,.24]);
      worlds.push(b.finish());
    }
    {
      const b=builder();b.quad('wood',[-45,0,40],[45,0,40],[45,0,-55],[-45,0,-55],[0,1,0],[0,0,1,1],[.36,.22,.16]);
      for(let i=0;i<36;i++){
        const side=i%2?1:-1,x=side*between(3.8,22),z=between(-49,28),h=between(3.5,12),lean=between(-2,2);
        b.curve('wood',[[x,0,z],[x+lean*.2,h*.27,z+.3],[x+lean*.6,h*.65,z+.6],[x+lean,h,z+.8]],[between(.22,.55),.5,.36,.14],color('wood'));
      }
      for(let z=-5;z>=-38;z-=8){b.curve('wood',[[-12,0,z],[-11,5,z],[-7,9,z],[0,10,z],[7,9,z],[11,5,z],[12,0,z]],[.45,.48,.52,.54,.52,.48,.45],[.58,.37,.23]);}
      b.disk('viaggio',0,4.7,-17,3.3,[1,1,1]);b.ring('wood',0,4.7,-16.9,3.55,[.76,.58,.39],.22);
      worlds.push(b.finish());
    }
    {
      const b=builder();b.quad('viaggio',[-45,0,40],[45,0,40],[45,0,-55],[-45,0,-55],[0,1,0],[.05,.05,.95,.95],[.18,.22,.30]);
      for(let i=0;i<38;i++){const side=i%2?1:-1,x=side*between(5,25),z=between(-50,25),h=between(.5,4);b.box('viaggio',x,0,z,between(.2,.8),h,between(.2,.8),color('cloth'));}
      b.ring('viaggio',0,5,-18,6.2,[.77,.69,.73],.13);
      // The same pieces have a compact and a dispersed position. No generative service runs in the visitor's browser.
      b.curve('wood',[[-1.3,.3,-9],[-1.7,1.6,-9],[-1.5,3,-9],[-.8,4.4,-9],[-.3,5.6,-9]],[.44,.45,.40,.30,.13],[.71,.48,.31],[-2.1,1.1,1]);
      b.curve('wood',[[1.1,.3,-9],[1.4,1.8,-9],[1.2,3.3,-9],[.55,4.8,-9],[.3,5.7,-9]],[.45,.47,.38,.27,.12],[.60,.37,.24],[2.2,1.5,-1]);
      b.curve('wood',[[-.9,1,-9.2],[0,1.4,-9.2],[1,2.4,-9.2],[1.6,3.5,-9.2]],[.35,.38,.30,.14],[.55,.33,.21],[-1.8,-.3,2.2]);
      const boardOffset=[1.8,.8,1.9];
      b.box('fabbriche',.65,2.0,-8.3,1.8,2.4,.16,[.13,.48,.29],[.3,.1,.6,.6],boardOffset);
      for(let i=0;i<7;i++){
        const x=-.1+i*.23;b.box('fabbriche',x,2.1,-8.19,.035,2.1,.035,[.88,.58,.27],null,boardOffset);
        b.box('fabbriche',x,2.2+(i%3)*.5,-8.16,.13,.12,.05,[.91,.78,.53],null,boardOffset);
      }
      const board2=[-2.1,1.8,-2.1];b.box('fabbriche',-.8,3.2,-8.7,1.3,1.5,.14,[.14,.41,.29],null,board2);
      for(let i=0;i<5;i++)b.box('fabbriche',-1.25+i*.22,3.3,-8.6,.035,1.2,.035,[.80,.55,.28],null,board2);
      b.ribbon('viaggio',-.1,1.1,-8.05,2.3,3.3,[.88,.71,.72],[-.6,2.4,2.3],[.27,.18,.65,.42]);
      b.ribbon('teatrino',.05,2.3,-9.7,2.9,1.2,[.78,.25,.20],[.8,-.4,-2.8],[.30,.18,.70,.35]);
      for(let i=0;i<5;i++)b.beam('viaggio',[-1.3,1.1+i*.28,-8],[1.2,1.5+i*.34,-8.05],.04,[.85,.75,.73],[-.6,2.4,2.3]);
      worlds.push(b.finish());
    }
    const skyData=[],lon=48,lat=24,radius=90;
    function sv(i,j){const a=i/lon*2*Math.PI,p=(j/lat-.5)*Math.PI;return [Math.cos(p)*Math.sin(a)*radius,Math.sin(p)*radius,Math.cos(p)*Math.cos(a)*radius,i/lon,j/lat];}
    for(let j=0;j<lat;j++)for(let i=0;i<lon;i++){const a=sv(i,j),b=sv(i+1,j),c=sv(i+1,j+1),d=sv(i,j+1);skyData.push(...a,...b,...c,...a,...c,...d);}
    const skyBuffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(skyData),gl.STATIC_DRAW);
    function attrib(p,name,size,stride,offset){const i=gl.getAttribLocation(p,name);if(i>=0){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,stride,offset);}}
    function perspective(fov,aspect,n,f){const t=1/Math.tan(fov/2),nf=1/(n-f);return new Float32Array([t/aspect,0,0,0,0,t,0,0,0,0,(f+n)*nf,-1,0,0,2*f*n*nf,0]);}
    function mult(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
    function view(pos,yaw,pitch){const sy=Math.sin(yaw),cy=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch),fx=sy*cp,fy=sp,fz=-cy*cp,sx=cy,sz=sy,ux=-sy*sp,uy=cp,uz=cy*sp;return new Float32Array([sx,ux,-fx,0,0,uy,-fy,0,sz,uz,-fz,0,-(sx*pos[0]+sz*pos[2]),-(ux*pos[0]+uy*pos[1]+uz*pos[2]),fx*pos[0]+fy*pos[1]+fz*pos[2],1]);}
    let stage=0,pos=[0,2,15],yaw=0,pitch=.035,scatter=0,targetScatter=0,last=0,active=false,busy=false,travel=null,lookPointer=null,lastX=0,lastY=0;
    const keys=new Set(),touch=new Set(),welcome=$('welcome'),help=$('help'),reduced=matchMedia('(prefers-reduced-motion: reduce)');
    const modalOpen=()=>!welcome.hidden||!help.hidden;
    function clearControls(){keys.clear();touch.clear();document.querySelectorAll('.nest-touch button').forEach(b=>b.classList.remove('pressed'));}
    function resetView(){pos=stage===3?[0,2.2,canvas.clientWidth/canvas.clientHeight<.75?5.5:2]:[0,2,15];yaw=0;pitch=.035;clearControls();}
    function updateStage(){
      const s=stages[stage];$('stageNumber').textContent=String(stage+1).padStart(2,'0')+' / 04';$('stageTitle').textContent=s.title;$('stageText').textContent=s.text;
      $('previous').hidden=stage===0;$('next').hidden=stage===3;$('next').textContent=s.action;
      $('scatter').hidden=stage!==3;$('gather').hidden=stage!==3;
      $('scatter').setAttribute('aria-pressed',String(targetScatter===1));$('gather').setAttribute('aria-pressed',String(targetScatter===0));
    }
    function goTo(next){
      if(busy||next<0||next>=stages.length)return;
      busy=true;clearControls();
      const forward=next>stage&&!reduced.matches;
      if(forward){
        const targets=[[0,4.7,-14],[0,4.2,-11],[0,4.7,-16]];
        travel={start:performance.now(),from:[...pos],to:targets[stage],yaw,pitch};
        window.setTimeout(()=>$('transition').classList.add('active'),700);
      }else $('transition').classList.add('active');
      window.setTimeout(()=>{stage=next;scatter=0;targetScatter=0;travel=null;resetView();updateStage();$('transition').classList.remove('active');busy=false;},reduced.matches?0:(forward?1180:480));
    }
    $('start').disabled=false;$('start').textContent='Inizia il viaggio';$('start').focus({preventScroll:true});
    $('start').addEventListener('click',()=>{welcome.hidden=true;active=true;canvas.focus({preventScroll:true});});
    $('next').addEventListener('click',()=>goTo(stage+1));$('previous').addEventListener('click',()=>goTo(stage-1));
    $('scatter').addEventListener('click',()=>{targetScatter=1;updateStage();});$('gather').addEventListener('click',()=>{targetScatter=0;updateStage();});
    $('helpBtn').addEventListener('click',()=>{clearControls();help.hidden=false;$('closeHelp').focus({preventScroll:true});});
    function closeHelp(){help.hidden=true;$('helpBtn').focus({preventScroll:true});}
    $('closeHelp').addEventListener('click',closeHelp);help.addEventListener('click',e=>{if(e.target===help)closeHelp();});
    $('restart').addEventListener('click',()=>{help.hidden=true;stage=0;targetScatter=0;scatter=0;resetView();updateStage();canvas.focus({preventScroll:true});});
    window.addEventListener('keydown',e=>{
      const k=e.key.toLowerCase();if(k==='escape'&&!help.hidden){closeHelp();return;}
      if(modalOpen()){
        if(k==='tab'){
          const modal=!welcome.hidden?welcome:help,buttons=Array.from(modal.querySelectorAll('button:not([disabled]),a[href]'));
          if(buttons.length){const first=buttons[0],lastButton=buttons[buttons.length-1];if(!modal.contains(document.activeElement)){e.preventDefault();first.focus();}else if(e.shiftKey&&document.activeElement===first){e.preventDefault();lastButton.focus();}else if(!e.shiftKey&&document.activeElement===lastButton){e.preventDefault();first.focus();}}
        }
        return;
      }
      if(['w','a','s','d','q','e','i','j','k','l','arrowup','arrowdown','arrowleft','arrowright','shift'].includes(k)){keys.add(k);e.preventDefault();}
    });
    window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',clearControls);
    document.addEventListener('visibilitychange',()=>{if(document.hidden)clearControls();});
    canvas.addEventListener('pointerdown',e=>{if(modalOpen()||lookPointer!==null)return;lookPointer=e.pointerId;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);e.preventDefault();});
    canvas.addEventListener('pointermove',e=>{if(e.pointerId!==lookPointer)return;yaw+=(e.clientX-lastX)*.0045;pitch=Math.max(-1.3,Math.min(1.3,pitch-(e.clientY-lastY)*.0045));lastX=e.clientX;lastY=e.clientY;});
    function endLook(e){if(e.pointerId===lookPointer)lookPointer=null;}canvas.addEventListener('pointerup',endLook);canvas.addEventListener('pointercancel',endLook);canvas.addEventListener('lostpointercapture',endLook);
    document.querySelectorAll('[data-move]').forEach(button=>{
      const action=button.dataset.move;
      button.addEventListener('pointerdown',e=>{if(modalOpen())return;e.preventDefault();touch.add(action);button.classList.add('pressed');button.setPointerCapture(e.pointerId);});
      const end=()=>{touch.delete(action);button.classList.remove('pressed');};button.addEventListener('pointerup',end);button.addEventListener('pointercancel',end);button.addEventListener('lostpointercapture',end);
      button.addEventListener('click',e=>{if(e.detail===0){touch.add(action);button.classList.add('pressed');setTimeout(end,220);}});button.addEventListener('contextmenu',e=>e.preventDefault());
    });
    function draw(time){
      const dt=last?Math.min((time-last)/1000,.05):0;last=time;
      if(travel){
        const t=Math.max(0,Math.min(1,(time-travel.start)/1100)),ease=t*t*(3-2*t);
        pos=travel.from.map((v,i)=>v+(travel.to[i]-v)*ease);yaw=travel.yaw*(1-ease);pitch=travel.pitch*(1-ease);
      }
      if(active&&!modalOpen()&&!busy){
        const f=((keys.has('w')||keys.has('arrowup')||touch.has('forward'))?1:0)-((keys.has('s')||keys.has('arrowdown')||touch.has('back'))?1:0);
        const r=((keys.has('d')||keys.has('arrowright')||touch.has('right'))?1:0)-((keys.has('a')||keys.has('arrowleft')||touch.has('left'))?1:0);
        const v=((keys.has('e')||touch.has('up'))?1:0)-((keys.has('q')||touch.has('down'))?1:0),speed=(keys.has('shift')?8:4)*dt/Math.max(1,Math.hypot(f,r,v));
        pos[0]=Math.max(-40,Math.min(40,pos[0]+(Math.sin(yaw)*f+Math.cos(yaw)*r)*speed));pos[2]=Math.max(-50,Math.min(38,pos[2]+(-Math.cos(yaw)*f+Math.sin(yaw)*r)*speed));pos[1]=Math.max(.8,Math.min(18,pos[1]+v*speed));
        yaw+=((keys.has('l')?1:0)-(keys.has('j')?1:0))*dt;pitch=Math.max(-1.3,Math.min(1.3,pitch+((keys.has('i')?1:0)-(keys.has('k')?1:0))*dt));
      }
      scatter=reduced.matches?targetScatter:scatter+(targetScatter-scatter)*Math.min(1,dt*2.2);
      const ratio=Math.min(devicePixelRatio||1,1.25),w=Math.max(1,Math.round(canvas.clientWidth*ratio)),h=Math.max(1,Math.round(canvas.clientHeight*ratio));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
      gl.viewport(0,0,w,h);gl.clearColor(...stages[stage].fog,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      const vp=mult(perspective(Math.PI/3,w/h,.08,220),view(pos,yaw,pitch));
      gl.disable(gl.DEPTH_TEST);gl.depthMask(false);gl.useProgram(skyProgram);gl.bindBuffer(gl.ARRAY_BUFFER,skyBuffer);attrib(skyProgram,'aPos',3,20,0);attrib(skyProgram,'aUV',2,20,12);
      gl.uniformMatrix4fv(gl.getUniformLocation(skyProgram,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(skyProgram,'uCamera'),pos);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,skyTextures[stage]);gl.uniform1i(gl.getUniformLocation(skyProgram,'uImage'),0);gl.drawArrays(gl.TRIANGLES,0,skyData.length/5);
      gl.enable(gl.DEPTH_TEST);gl.depthMask(true);gl.useProgram(sceneProgram);gl.uniformMatrix4fv(gl.getUniformLocation(sceneProgram,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(sceneProgram,'uCamera'),pos);gl.uniform3fv(gl.getUniformLocation(sceneProgram,'uFog'),stages[stage].fog);gl.uniform1f(gl.getUniformLocation(sceneProgram,'uScatter'),scatter);
      for(const mesh of worlds[stage]){
        gl.bindBuffer(gl.ARRAY_BUFFER,mesh.buffer);attrib(sceneProgram,'aPos',3,56,0);attrib(sceneProgram,'aNormal',3,56,12);attrib(sceneProgram,'aUV',2,56,24);attrib(sceneProgram,'aColor',3,56,32);attrib(sceneProgram,'aOffset',3,56,44);
        gl.bindTexture(gl.TEXTURE_2D,mesh.texture);gl.uniform1i(gl.getUniformLocation(sceneProgram,'uImage'),0);gl.uniform1f(gl.getUniformLocation(sceneProgram,'uMix'),mesh.group==='wood'?.68:.60);gl.drawArrays(gl.TRIANGLES,0,mesh.count);
      }
      requestAnimationFrame(draw);
    }
    updateStage();requestAnimationFrame(draw);
  }
})();
