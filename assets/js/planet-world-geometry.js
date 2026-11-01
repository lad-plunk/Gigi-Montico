/* Six connected, lightweight imagined landscapes based on Montico's works. */
(() => {
  'use strict';
  function create(gl,o){
    const {M,radius,ground,normalAt,sun,paintingTexture,lakes}=o,{add,scale,cross,dot,norm}=M,TAU=Math.PI*2;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
    function program(v,f){const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,v));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
    const surface=program(`
      attribute vec3 aPos;attribute vec3 aNormal;attribute vec2 aUV;attribute float aIndex;attribute vec3 aTint;attribute float aWind;attribute vec3 aOffset;
      uniform mat4 uVP;uniform vec3 uCamera;uniform float uTime;uniform float uScatter;
      varying vec3 vNormal;varying vec2 vUV;varying float vIndex;varying vec3 vTint;varying float vDistance;
      void main(){vec3 n=normalize(aPos),east=normalize(cross(vec3(0.,1.,0.),n));
        vec3 p=aPos+aOffset*uScatter+east*sin(uTime*.6+aPos.x*.19+aPos.z*.13)*aWind*.25;
        vNormal=aNormal;vUV=aUV;vIndex=aIndex;vTint=aTint;vDistance=distance(p,uCamera);gl_Position=uVP*vec4(p,1.);}
    `,`
      precision mediump float;uniform sampler2D uPaint;uniform vec3 uFog;uniform vec3 uSun;
      varying vec3 vNormal;varying vec2 vUV;varying float vIndex;varying vec3 vTint;varying float vDistance;
      void main(){float i=mod(vIndex+6.,6.);vec2 cell=vec2(mod(i,4.),floor(i/4.));
        vec3 paint=texture2D(uPaint,(cell+mix(vec2(.015),vec2(.985),clamp(vUV,0.,1.)))/vec2(4.,2.)).rgb;
        vec3 colour=mix(paint,vTint,.68);float light=.64+.36*max(dot(normalize(vNormal),normalize(uSun)),0.);
        colour=mix(colour*light,uFog,smoothstep(50.,150.,vDistance)*.44);gl_FragColor=vec4(colour,1.);}
    `);
    const water=program(`
      attribute vec3 aPos;attribute vec3 aNormal;attribute vec2 aUV;uniform mat4 uVP;uniform mediump float uTime;uniform vec3 uCamera;
      varying vec2 vUV;varying float vDistance;varying vec3 vNormal;
      void main(){float wave=sin(aUV.x*25.+uTime*.8)*.06+cos(aUV.y*22.-uTime*.65)*.04;vec3 p=aPos+aNormal*wave;
        vUV=aUV;vNormal=aNormal;vDistance=distance(p,uCamera);gl_Position=uVP*vec4(p,1.);}
    `,`
      precision mediump float;uniform float uTime;uniform vec3 uFog;uniform vec3 uSun;varying vec2 vUV;varying float vDistance;varying vec3 vNormal;
      void main(){float ripple=sin(vUV.x*75.+sin(vUV.y*22.)*2.+uTime*.9)*cos(vUV.y*68.-uTime*.6);
        float light=.65+.35*max(dot(normalize(vNormal),normalize(uSun)),0.);vec3 c=mix(vec3(.055,.30,.39),vec3(.32,.66,.70),.42+.20*ripple)*light;
        c=mix(c,uFog,smoothstep(45.,130.,vDistance)*.32);gl_FragColor=vec4(c,.91);}
    `);
    const motesProgram=program(`
      attribute vec3 aPos;attribute float aSeed;attribute float aKind;uniform mat4 uVP;uniform vec3 uCamera;uniform float uTime;varying float vKind;varying float vFade;
      void main(){vec3 n=normalize(aPos),east=normalize(cross(vec3(0.,1.,0.),n));vec3 p=aPos+east*sin(uTime*.32+aSeed)*.75+n*sin(uTime*.46+aSeed)*.34;
        float d=distance(p,uCamera);vFade=1.-smoothstep(20.,60.,d);vKind=aKind;gl_PointSize=clamp(30./max(d,1.),1.5,5.);gl_Position=uVP*vec4(p,1.);}
    `,`
      precision mediump float;varying float vKind;varying float vFade;void main(){float a=(1.-smoothstep(.20,.5,length(gl_PointCoord-.5)))*vFade;
        vec3 c=vKind<1.5?vec3(.95,.82,.42):vKind<3.5?vec3(.65,.88,1.):vec3(1.,.63,.38);gl_FragColor=vec4(c,a*.65);}
    `);
    const shadowsProgram=program(`attribute vec3 aPos;attribute float aAlpha;uniform mat4 uVP;varying float vAlpha;void main(){vAlpha=aAlpha;gl_Position=uVP*vec4(aPos,1.);}`,`
      precision mediump float;varying float vAlpha;void main(){gl_FragColor=vec4(.04,.035,.04,vAlpha);}
    `);
    const data=[],waterData=[],motes=[],shadowData=[];let seed=209731;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}, between=(a,b)=>a+(b-a)*random();
    function frame(u,lat){const n=normalAt((u+1)%1,lat),a=(u-.5)*TAU,east=[Math.cos(a),0,-Math.sin(a)],north=norm(cross(n,east)),base=radius+ground(n);
      return {n,east,north,point:(x,y,z)=>add(add(scale(n,base+y),scale(east,x)),scale(north,z))};}
    function shadowBlob(f,width,height){const daylight=dot(f.n,sun);if(daylight<=.06)return;
      const direction=scale(norm(add(sun,scale(f.n,-daylight))),-1),side=norm(cross(f.n,direction)),length=Math.min(height*1.25,width*(1.5+(1-daylight)*2.5)),alpha=.20*Math.min(1,daylight*4);
      const point=(x,z)=>{const n=norm(add(f.n,scale(add(scale(direction,x),scale(side,z)),1/radius)));return scale(n,radius+ground(n)+.14);};
      const center=point(length*.27,0);for(let k=0;k<10;k++){const a=k/10*TAU,b=(k+1)/10*TAU;
        shadowData.push(...center,alpha,...point(length*.27+Math.cos(a)*length,Math.sin(a)*width),0,...point(length*.27+Math.cos(b)*length,Math.sin(b)*width),0);}}
    function vert(p,u,v,index,tint,wind=0,offset=[0,0,0]){return{p,u,v,index,tint,wind,offset};}
    function triangle(a,b,c){const normal=norm(cross(add(b.p,scale(a.p,-1)),add(c.p,scale(a.p,-1))));
      [a,b,c].forEach(v=>data.push(...v.p,...normal,v.u,v.v,v.index,...v.tint,v.wind,...v.offset));}
    function quad(a,b,c,d){triangle(a,b,c);triangle(a,c,d);}
    function block(f,x,y,z,sx,sy,sz,index,tint,offset=[0,0,0],motion=0){
      const p=(dx,dy,dz)=>f.point(x+dx*sx,y+dy*sy,z+dz*sz);
      const v=[p(-.5,-.5,-.5),p(.5,-.5,-.5),p(.5,-.5,.5),p(-.5,-.5,.5),p(-.5,.5,-.5),p(.5,.5,-.5),p(.5,.5,.5),p(-.5,.5,.5)];
      [[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7],[3,2,1,0]].forEach(q=>quad(vert(v[q[0]],0,0,index,tint,motion,offset),vert(v[q[1]],1,0,index,tint,motion,offset),vert(v[q[2]],1,1,index,tint,motion,offset),vert(v[q[3]],0,1,index,tint,motion,offset)));
    }
    function crown(f,x,y,z,r,h,index,tint,wind=.45){
      const top=vert(f.point(x,y+h,z),.5,1,index,tint,wind),bottom=vert(f.point(x,y-h*.18,z),.5,0,index,tint,wind*.5),ring=[];
      for(let k=0;k<6;k++){const a=k/6*TAU,rr=r*(.82+.25*random());ring.push(vert(f.point(x+Math.cos(a)*rr,y,z+Math.sin(a)*rr),k/6,.35,index,tint,wind*.7));}
      for(let k=0;k<6;k++){triangle(top,ring[k],ring[(k+1)%6]);triangle(bottom,ring[(k+1)%6],ring[k]);}
    }
    function broadCrown(f,x,y,z,r,h,index,tint,wind=.55){
      const lower=[],middle=[],upper=[],bottom=vert(f.point(x,y-h*.10,z),.5,0,index,tint,wind*.4),top=vert(f.point(x,y+h,z),.5,1,index,tint,wind);
      for(let k=0;k<7;k++){const a=k/7*TAU,variation=.78+random()*.35;
        lower.push(vert(f.point(x+Math.cos(a)*r*.72*variation,y+h*.12,z+Math.sin(a)*r*.72*variation),k/7,.15,index,tint,wind*.5));
        middle.push(vert(f.point(x+Math.cos(a)*r*variation,y+h*.47,z+Math.sin(a)*r*variation),k/7,.5,index,tint,wind*.75));
        upper.push(vert(f.point(x+Math.cos(a)*r*.48*variation,y+h*.83,z+Math.sin(a)*r*.48*variation),k/7,.85,index,tint,wind));}
      for(let k=0;k<7;k++){const j=(k+1)%7;triangle(bottom,lower[j],lower[k]);quad(lower[k],lower[j],middle[j],middle[k]);quad(middle[k],middle[j],upper[j],upper[k]);triangle(top,upper[k],upper[j]);}
    }
    function tree(u,lat,index=1){const f=frame(u,lat),height=between(2.4,6.5),thick=between(.10,.24),r=between(.65,1.55),style=Math.floor(random()*4);
      const bark=[between(.25,.37),between(.16,.23),between(.10,.15)];block(f,0,height*.38,0,thick*2,height*.76,thick*2,index,bark);
      if(random()<.32)shadowBlob(f,r*.65,height);
      const foliage=style===0?[.18,.34,.24]:style===1?[.27,.41,.30]:style===2?[.39,.43,.28]:[.23,.34,.40];
      if(style===0)crown(f,0,height*.66,0,r*.85,height*.48,index,foliage,.55);
      else broadCrown(f,0,height*.63,0,r*(style===2?1.3:1),height*.45,index,foliage,.55);
      if(style===3){broadCrown(f,-r*.55,height*.72,0,r*.62,height*.27,index,foliage,.7);broadCrown(f,r*.55,height*.75,.25,r*.58,height*.30,index,foliage,.7);}
    }
    function rock(u,lat,index){const f=frame(u,lat),sx=between(.7,3.2),sz=between(.6,2.4),h=between(.5,3),tint=index===4?[.54,.28,.20]:[.38,.40,.36];
      const top=vert(f.point(between(-.4,.4)*sx,h,between(-.3,.3)*sz),.5,1,index,tint),base=[],middle=[];
      for(let k=0;k<6;k++){const a=k/6*TAU,r=between(.68,1.15);base.push(vert(f.point(Math.cos(a)*sx*r,.04,Math.sin(a)*sz*r),k/6,0,index,tint));
        middle.push(vert(f.point(Math.cos(a)*sx*r*.72,h*between(.32,.65),Math.sin(a)*sz*r*.72),k/6,.5,index,tint));}
      for(let k=0;k<6;k++){const j=(k+1)%6;quad(base[k],base[j],middle[j],middle[k]);triangle(top,middle[k],middle[j]);}}
    function building(u,lat,index=3){const f=frame(u,lat),sx=between(2.3,4.8),sz=between(2.3,4.6),h=between(2.6,9),hue=random();
      const wall=hue<.33?[.63,.59,.50]:hue<.66?[.43,.51,.48]:[.52,.41,.37];block(f,0,h*.5,0,sx,h,sz,index,wall);
      if(random()<.5)shadowBlob(f,Math.min(sx,sz)*.55,h);
      const roof=[.39,.23,.20],tip=vert(f.point(0,h+between(.6,1.5),0),.5,1,index,roof),corners=[];
      for(const [x,z] of [[-1,-1],[1,-1],[1,1],[-1,1]])corners.push(vert(f.point(x*sx*.55,h,z*sz*.55),x>0?1:0,z>0?1:0,index,roof));
      for(let k=0;k<4;k++)triangle(tip,corners[k],corners[(k+1)%4]);
      const p=(z,y,u,v)=>vert(f.point(-sx*.505,y,z),u,v,index,[.95,.76,.43]);
      for(let floor=1;floor<Math.min(4,Math.floor(h/1.7));floor++)for(const side of [-.25,.25]){const z=side*sz,y=floor*1.5;quad(p(z-.24,y-.32,0,0),p(z+.24,y-.32,1,0),p(z+.24,y+.32,1,1),p(z-.24,y+.32,0,1));}
    }
    function flower(u,lat){const f=frame(u,lat),h=between(.8,2.4),colour=random()<.5?[.82,.34,.40]:[.91,.70,.32],petals=5+Math.floor(random()*3),r=between(.36,.70);
      block(f,0,h*.45,0,.07,h*.9,.07,5,[.26,.43,.26]);
      const center=vert(f.point(0,h+.05,0),.5,.5,5,[.95,.78,.35],.8);
      for(let k=0;k<petals;k++){const a=k/petals*TAU,b=(k+1)/petals*TAU,m=(a+b)/2;
        const left=vert(f.point(0,h+Math.cos(a)*r*.30,Math.sin(a)*r*.30),0,0,5,colour,.8),right=vert(f.point(0,h+Math.cos(b)*r*.30,Math.sin(b)*r*.30),1,0,5,colour,.8),tip=vert(f.point(.07,h+Math.cos(m)*r,Math.sin(m)*r),.5,1,5,colour,1);
        triangle(center,left,tip);triangle(center,tip,right);}}
    function bird(u,lat,index){const f=frame(u,lat),h=between(4.5,9),width=between(.45,1.0),tint=[.85,.83,.76];
      const center=vert(f.point(0,h,0),.5,.5,index,tint,6),left=vert(f.point(-.1,h+.22,-width),0,1,index,tint,6.8),right=vert(f.point(-.1,h+.22,width),1,1,index,tint,6.8),tail=vert(f.point(.28,h-.05,0),.5,0,index,tint,6);
      triangle(center,left,tail);triangle(center,tail,right);}
    function quadFeature(f,x,z,height,width,index,tint,wind){const p=(dx,y,u,v)=>vert(f.point(x,y,z+dx),u,v,index,tint,wind*(y/height));quad(p(-width/2,0,0,0),p(width/2,0,1,0),p(width/2,height,1,1),p(-width/2,height,0,1));}
    function positions(index,count,fn,wide=false){const center=index/6+.016;for(let i=0;i<count;i++){
      const u=(center+between(-.078,.078)+1)%1,lat=wide?(random()<.5?-1:1)*between(.32,1.2):between(-.30,.30);fn(u,lat);}}
    // The opening plain has ridges and a few drifting shapes, kept less dense than the forest.
    positions(0,150,(u,lat)=>rock(u,lat,0));
    // A real forest-like volume with varied crowns, trunks and colours, rather than repeated sheets.
    positions(1,410,(u,lat)=>{if(Math.abs(lat)*radius>1.8)tree(u,lat);},false);positions(1,230,(u,lat)=>tree(u,lat),true);
    positions(1,30,(u,lat)=>bird(u,lat,1));
    {const f=frame(1/6+.037,0),bark=[.31,.20,.14];block(f,0,1.3,-1.1,.38,2.6,.38,1,bark);block(f,0,1.3,1.1,.38,2.6,.38,1,bark);block(f,0,2.65,0,.38,.35,2.5,1,bark);}
    // Lakes have banks, reeds and a small boat; water is a separate animated surface.
    for(const lake of lakes){const f=frame(lake.u,lake.lat);for(let i=0;i<45;i++){
      const a=between(0,TAU),d=between(lake.r*.88,lake.r*1.18),du=Math.cos(a)*d/(radius*TAU*Math.max(.25,Math.cos(lake.lat))),dl=Math.sin(a)*d/radius;
      if(lake.main&&Math.abs((lake.lat+dl)*radius)<3.5)continue;
      if(i%3===0)rock((lake.u+du+1)%1,lake.lat+dl,2);else {const g=frame((lake.u+du+1)%1,lake.lat+dl);quadFeature(g,0,0,between(.7,1.7),.11,2,[.27,.43,.25],.9);}}
      if(lake.main){const x=-8;block(f,x,.82,0,2.4,.28,.85,2,[.37,.23,.16],[0,0,0],2);block(f,x,1.65,0,.08,1.8,.08,2,[.31,.22,.16],[0,0,0],2);
        const a=vert(f.point(x,1.0,.04),0,0,2,[.90,.84,.69],2),b=vert(f.point(x,1.1,1.0),1,0,2,[.90,.84,.69],2),c=vert(f.point(x,2.55,.04),0,1,2,[.90,.84,.69],2);triangle(a,b,c);}}
    positions(2,22,(u,lat)=>bird(u,lat,2));
    // The town uses varied volumes, roofs and windows, with small green breaks between them.
    positions(3,210,(u,lat)=>{if(Math.abs(lat)*radius>5.5)building(u,lat);},false);positions(3,90,(u,lat)=>building(u,lat),true);positions(3,65,(u,lat)=>{if(Math.abs(lat)*radius>5.5)tree(u,lat,3);},false);
    // Small moving vehicles make the street feel inhabited without adding a heavy physics engine.
    for(let k=0;k<14;k++){if(k===7)continue;const u=(3/6+.016+(k-7)*.009+1)%1,lat=(k%2?.009:-.009),f=frame(u,lat),tint=k%3===0?[.69,.28,.22]:k%3===1?[.30,.47,.50]:[.72,.64,.48];
      block(f,0,.38,0,1.5,.50,.75,3,tint,[0,0,0],10);block(f,-.08,.78,0,.70,.35,.65,3,tint,[0,0,0],10);
      for(const x of [-.46,.46])for(const z of [-.40,.40])block(f,x,.18,z,.30,.30,.15,3,[.08,.09,.10],[0,0,0],10);}
    // Rocks and the displaced ground form a canyon rather than a flat desert.
    positions(4,240,(u,lat)=>{if(Math.abs(lat)*radius>2)rock(u,lat,4);});positions(4,140,(u,lat)=>rock(u,lat,4),true);
    // A lively garden of colour and an interactive cluster of fragments.
    positions(5,400,(u,lat)=>flower(u,lat));positions(5,160,(u,lat)=>flower(u,lat),true);
    positions(5,130,(u,lat)=>{const f=frame(u,lat);broadCrown(f,0,.12,0,between(.3,.8),between(.35,.8),5,[.28,.43,.28],.55);});
    {const f=frame(5/6+.034,0);for(let k=0;k<28;k++){const a=k*2.399,layer=Math.floor(k/7),x=Math.cos(a)*.55,z=Math.sin(a)*.55,y=.55+layer*.58;
      const offset=add(add(scale(f.east,Math.cos(a)*(1.7+layer*.28)),scale(f.north,Math.sin(a)*(1.7+layer*.28))),scale(f.n,(k%3-1)*.8));
      block(f,x,y,z,.16+(k%3)*.1,.23+(k%4)*.08,.18+(k%2)*.12,5,k%2?[.69,.43,.43]:[.32,.53,.58],offset);}}
    // Clouds of drifting light, pollen and dust animate each landscape.
    for(let biome=0;biome<6;biome++)for(let i=0;i<180;i++){const u=(biome/6+.016+between(-.085,.085)+1)%1,lat=between(-.35,.35),f=frame(u,lat),p=f.point(0,between(.4,7.0),0);motes.push(...p,between(0,TAU),biome);}
    function waterVertex(lake,ring,k){const a=k/48*TAU,rad=lake.r*ring/8*(1+.045*Math.sin(a*5+lake.r)),n=normalAt(lake.u,lake.lat),ang=(lake.u-.5)*TAU,east=[Math.cos(ang),0,-Math.sin(ang)],north=norm(cross(n,east));
      const p=norm(add(n,scale(add(scale(east,Math.cos(a)*rad),scale(north,Math.sin(a)*rad)),1/radius)));return [...scale(p,radius-.55),...p,.5+Math.cos(a)*ring/16,.5+Math.sin(a)*ring/16];}
    for(const lake of lakes)for(let ring=0;ring<8;ring++)for(let k=0;k<48;k++){const a=waterVertex(lake,ring,k),b=waterVertex(lake,ring,k+1),c=waterVertex(lake,ring+1,k+1),d=waterVertex(lake,ring+1,k);waterData.push(...a,...b,...c,...a,...c,...d);}
    function buffer(values){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);return b;}
    const solidCount=data.length/16,waterCount=waterData.length/8,moteCount=motes.length/5,shadowCount=shadowData.length/4;
    const solid=buffer(data),waterBuffer=buffer(waterData),particleBuffer=buffer(motes),shadowsBuffer=buffer(shadowData);
    // Release the large temporary JavaScript arrays after their GPU buffers exist.
    data.length=0;waterData.length=0;motes.length=0;shadowData.length=0;
    function attrib(p,name,size,stride,offset){const i=gl.getAttribLocation(p,name);if(i>=0){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,stride,offset);}}
    return {
      drawShadows(vp){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.useProgram(shadowsProgram);gl.bindBuffer(gl.ARRAY_BUFFER,shadowsBuffer);attrib(shadowsProgram,'aPos',3,16,0);attrib(shadowsProgram,'aAlpha',1,16,12);gl.uniformMatrix4fv(gl.getUniformLocation(shadowsProgram,'uVP'),false,vp);gl.drawArrays(gl.TRIANGLES,0,shadowCount);gl.depthMask(true);gl.disable(gl.BLEND);},
      drawSolid(vp,camera,time,scatter,fog){gl.useProgram(surface);gl.bindBuffer(gl.ARRAY_BUFFER,solid);attrib(surface,'aPos',3,64,0);attrib(surface,'aNormal',3,64,12);attrib(surface,'aUV',2,64,24);attrib(surface,'aIndex',1,64,32);attrib(surface,'aTint',3,64,36);attrib(surface,'aWind',1,64,48);attrib(surface,'aOffset',3,64,52);
        gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,paintingTexture);gl.uniform1i(gl.getUniformLocation(surface,'uPaint'),0);gl.uniformMatrix4fv(gl.getUniformLocation(surface,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(surface,'uCamera'),camera);gl.uniform3fv(gl.getUniformLocation(surface,'uFog'),fog);gl.uniform3fv(gl.getUniformLocation(surface,'uSun'),sun);gl.uniform1f(gl.getUniformLocation(surface,'uTime'),time);gl.uniform1f(gl.getUniformLocation(surface,'uScatter'),scatter);gl.drawArrays(gl.TRIANGLES,0,solidCount);},
      drawWater(vp,camera,time,fog){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.useProgram(water);gl.bindBuffer(gl.ARRAY_BUFFER,waterBuffer);attrib(water,'aPos',3,32,0);attrib(water,'aNormal',3,32,12);attrib(water,'aUV',2,32,24);
        gl.uniformMatrix4fv(gl.getUniformLocation(water,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(water,'uCamera'),camera);gl.uniform3fv(gl.getUniformLocation(water,'uFog'),fog);gl.uniform3fv(gl.getUniformLocation(water,'uSun'),sun);gl.uniform1f(gl.getUniformLocation(water,'uTime'),time);gl.drawArrays(gl.TRIANGLES,0,waterCount);gl.depthMask(true);gl.disable(gl.BLEND);},
      drawMotes(vp,camera,time){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.useProgram(motesProgram);gl.bindBuffer(gl.ARRAY_BUFFER,particleBuffer);attrib(motesProgram,'aPos',3,20,0);attrib(motesProgram,'aSeed',1,20,12);attrib(motesProgram,'aKind',1,20,16);
        gl.uniformMatrix4fv(gl.getUniformLocation(motesProgram,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(motesProgram,'uCamera'),camera);gl.uniform1f(gl.getUniformLocation(motesProgram,'uTime'),time);gl.drawArrays(gl.POINTS,0,moteCount);gl.depthMask(true);gl.disable(gl.BLEND);}
    };
  }
  window.MonticoWorldGeometry={create};
})();
