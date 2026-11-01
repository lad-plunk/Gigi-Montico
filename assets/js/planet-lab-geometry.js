/* Lightweight, intentionally interpretive forms for the separate planet laboratory. */
(() => {
  'use strict';
  function create(gl, o) {
    const {M,radius,ground,normalAt,sun,paintingTexture,fragmentTexture,woodImage}=o;
    const {add,scale,cross,dot,norm}=M, PI2=Math.PI*2;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
    function program(v,f){const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,v));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
    const material=program(`
      attribute vec3 aPos;attribute vec3 aNormal;attribute vec2 aUV;attribute float aIndex;attribute float aWind;attribute vec3 aOffset;
      uniform mat4 uVP;uniform vec3 uCamera;uniform float uTime;uniform float uScatter;uniform mediump float uMicro;
      varying vec3 vNormal;varying vec2 vUV;varying float vIndex;varying float vDistance;
      void main(){vec3 tangent=uMicro>.5?vec3(1.,0.,0.):normalize(cross(vec3(0.,1.,0.),normalize(aPos)));
        vec3 p=aPos+aOffset*uScatter+tangent*sin(uTime*.7+aIndex*1.3+aPos.x*.1)*aWind*.22;
        vNormal=aNormal;vUV=aUV;vIndex=aIndex;vDistance=distance(p,uCamera);gl_Position=uVP*vec4(p,1.);}
    `,`
      precision mediump float;uniform sampler2D uTexture;uniform vec3 uFog;uniform vec3 uSun;uniform float uMicro;
      varying vec3 vNormal;varying vec2 vUV;varying float vIndex;varying float vDistance;
      void main(){vec3 c;if(vIndex<-.5){vec2 uv=1.-abs(mod(vUV,2.)-1.);c=texture2D(uTexture,uv).rgb;}else{
        float i=mod(vIndex+16.,16.);vec2 cell=vec2(mod(i,4.),floor(i/4.));
        c=texture2D(uTexture,(cell+mix(vec2(.015),vec2(.985),clamp(vUV,0.,1.)))*.25).rgb;}
        float light=uMicro>.5?.83:(.58+.42*max(dot(normalize(vNormal),normalize(uSun)),0.));
        c=mix(c*light,uFog,smoothstep(38.,110.,vDistance)*.55);gl_FragColor=vec4(c,1.);}
    `);
    const shadow=program(`attribute vec3 aPos;attribute float aAlpha;uniform mat4 uVP;varying float vAlpha;void main(){vAlpha=aAlpha;gl_Position=uVP*vec4(aPos,1.);}`,`
      precision mediump float;varying float vAlpha;void main(){gl_FragColor=vec4(.04,.035,.04,vAlpha);}
    `);
    const woodCanvas=document.createElement('canvas');woodCanvas.width=512;woodCanvas.height=512;
    woodCanvas.getContext('2d').drawImage(woodImage,900,410,200,200,0,0,512,512);
    const woodTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,woodTexture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,false);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,woodCanvas);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    const painted=[],marks=[],wood=[],micro=[],microObjects=[],shadowVertices=[];
    function vertex(p,u,v,index,wind=0,offset=[0,0,0]){return {p,u,v,index,wind,offset};}
    function triangle(dest,a,b,c){
      const normal=norm(cross(add(b.p,scale(a.p,-1)),add(c.p,scale(a.p,-1))));
      [a,b,c].forEach(v=>dest.push(...v.p,...normal,v.u,v.v,v.index,v.wind,...v.offset));
    }
    function quad(dest,a,b,c,d){triangle(dest,a,b,c);triangle(dest,a,c,d);}
    function frame(index){
      const u=(index/9+.034)%1, n=normalAt(u,0), a=(u-.5)*PI2, east=[Math.cos(a),0,-Math.sin(a)], north=norm(cross(n,east)), base=radius+ground(n);
      return {n,east,north, point:(x,y,z)=>add(add(scale(n,base+y),scale(east,x)),scale(north,z))};
    }
    function panel(dest,frame,x,z,bottom,width,height,index,tilt=0,wind=.3,offset=[0,0,0]){
      const p=(dx,y,u,v)=>vertex(frame.point(x+tilt*y,y+bottom,z+dx),u,v,index,wind*(y/height),offset);
      quad(dest,p(-width/2,0,0,0),p(width/2,0,1,0),p(width/2,height,1,1),p(-width/2,height,0,1));
    }
    function block(dest,frame,x,y,z,sx,sy,sz,index,offset=[0,0,0]){
      const v=(dx,dy,dz,u,v)=>vertex(frame.point(x+dx*sx,y+dy*sy,z+dz*sz),u,v,index,0,offset);
      const p=[v(-.5,-.5,-.5,0,0),v(.5,-.5,-.5,1,0),v(.5,-.5,.5,1,1),v(-.5,-.5,.5,0,1),v(-.5,.5,-.5,0,0),v(.5,.5,-.5,1,0),v(.5,.5,.5,1,1),v(-.5,.5,.5,0,1)];
      [[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7],[3,2,1,0]].forEach(q=>quad(dest,p[q[0]],p[q[1]],p[q[2]],p[q[3]]));
    }
    function scrap(dest,frame,x,y,z,index,offset,flat){
      const p=(dx,dy,dz,u,v)=>vertex(frame.point(x+dx,y+dy,z+dz),u,v,index,0,offset);
      const a=p(-.25,-.22,-.12,0,0),b=p(.22,-.16,-.1,1,0),c=p(-.06,.28,.04,.5,1),d=p(.02,-.07,.20,.65,.4);
      triangle(dest,a,b,c);if(!flat){triangle(dest,a,d,b);triangle(dest,b,d,c);triangle(dest,c,d,a);}
    }
    function curvedWood(frame,shift=0){
      const path=[[0,0,-1.05],[0,1.1,-1.12],[0,2.5,-.95],[0,3.2,-.48],[0,3.48,.25],[0,3.1,.95],[0,2.3,1.05],[0,1.5,.7]];
      function point(j,k){const p=path[j],prev=path[Math.max(0,j-1)],next=path[Math.min(path.length-1,j+1)];
        const dy=next[1]-prev[1],dz=next[2]-prev[2],length=Math.hypot(dy,dz)||1, a=k/7*PI2,r=.18+.05*Math.sin(j*2.1);
        return vertex(frame.point(p[0]+Math.cos(a)*r+shift,p[1]+Math.sin(a)*r*(-dz/length),p[2]+Math.sin(a)*r*(dy/length)),k/7,j/(path.length-1),-1,.05);}
      for(let j=0;j<path.length-1;j++)for(let k=0;k<7;k++)quad(wood,point(j,k),point(j,k+1),point(j+1,k+1),point(j+1,k));
    }
    // 1. Marks become shallow standing strokes.
    {const f=frame(0);for(let k=0;k<18;k++){const h=1.1+(k%5)*.34;block(marks,f,Math.sin(k*.8)*.6,h*.5,(k-8.5)*.47,.18,h,.16,0);}}
    // 2. A real change in geometry separates and reassembles small fragments.
    {const f=frame(1);for(let k=0;k<24;k++){
      const a=k*2.399,layer=Math.floor(k/6),x=Math.cos(a)*.50,z=Math.sin(a)*.50,y=.55+layer*.62;
      const offset=add(add(scale(f.east,Math.cos(a)*(1.8+layer*.25)),scale(f.north,Math.sin(a)*(1.8+layer*.25))),scale(f.n,(k%3-1)*.8));
      if(k%3===0)block(painted,f,x,y,z,.16,.48,.18,2+k%3,offset);
      else scrap(painted,f,x,y,z,2+k%3,offset,k%3===1);
    }}
    // 3. A wooden portal hints at a change of scale; the visitor enters a separate walkable interior.
    {const f=frame(2);curvedWood(f);}
    // 4. Alternating planes bridge the colours and shapes of neighbouring paintings.
    {const f=frame(3);for(let k=0;k<11;k++)panel(marks,f,(k-5)*.65,Math.sin(k*.65)*1.2,.05,.7,1.5+(k%3)*.45,(k<5?5:6),Math.sin(k)*.12,.15);}
    // 5. Tall, gently waving fabric-like strokes.
    {const f=frame(4);for(let k=0;k<13;k++)panel(painted,f,Math.sin(k*1.9)*1.8,(k-6)*.55,.05,.3,2.0+(k%4)*.5,9,Math.cos(k)*.2,.9);}
    // 6. Collage-like planes are a visual invitation to the optional history note.
    {const f=frame(5);for(let k=0;k<8;k++)panel(painted,f,(k-4)*.35,(k-3.5)*.54,.15,.72,1.0+(k%3)*.4,10+k%3,Math.sin(k*2)*.25,.18);}
    // 7. This curved form samples a wood detail from the actual Casa Montico photograph.
    {const f=frame(6);curvedWood(f);curvedWood(f,.7);}
    // 8 and 9. Small landmarks accompany sound and navigation.
    for(const i of [7,8]){const f=frame(i);for(let k=0;k<7;k++){const a=k/7*PI2;block(painted,f,Math.cos(a)*1.2,.22,Math.sin(a)*1.2,.35,.45,.35,(i*2)%16);}}
    // Approximate soft contact shadows, calculated once from the fixed sun direction.
    for(let i=0;i<9;i++){
      const f=frame(i), daylight=dot(f.n,sun);if(daylight<=.03)continue;
      const projection=norm(add(sun,scale(f.n,-daylight))),longAxis=scale(projection,-1),shortAxis=norm(cross(f.n,longAxis));
      const length=1.3+Math.min(2.5,(1-daylight)*2.8),width=.9,alpha=.25*Math.min(1,daylight*4);
      const point=(x,z)=>{const n=norm(add(f.n,scale(add(scale(longAxis,x),scale(shortAxis,z)),1/radius)));return scale(n,radius+ground(n)+.16);};
      const center=point(length*.22,0);for(let k=0;k<20;k++){const a=k/20*PI2,b=(k+1)/20*PI2;
        shadowVertices.push(...center,alpha,...point(length*.22+Math.cos(a)*length,Math.sin(a)*width),0,...point(length*.22+Math.cos(b)*length,Math.sin(b)*width),0);}
    }
    // Invented interior: a textured tunnel, with small coloured fibres and fragments.
    function tunnel(j,k){const t=j/32,theta=k/24*PI2,z=18-t*64,warp=.18*Math.sin(t*28+theta*4),x=(3.8+warp)*Math.cos(theta),y=.4+(2.8+warp)*Math.sin(theta);
      return vertex([x,y,z],k/12,t*5,-1,0);}
    for(let j=0;j<32;j++)for(let k=0;k<24;k++)quad(micro,tunnel(j,k),tunnel(j,k+1),tunnel(j+1,k+1),tunnel(j+1,k));
    for(let i=0;i<34;i++){
      const a=i*2.399,z=12-i*1.38,x=Math.cos(a)*3.25,y=.4+Math.sin(a)*2.3,s=.18+(i%3)*.08;
      const p=(dx,dy,u,v)=>vertex([x+dx,y+dy,z],u,v,i%16,.3);
      triangle(microObjects,p(-s,-s,0,0),p(s,-s,1,0),p(0,s*1.8,.5,1));
    }
    function buffer(data){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(data),gl.STATIC_DRAW);return {buffer:b,count:data.length/13};}
    const batches=[{...buffer(painted),tex:fragmentTexture},{...buffer(marks),tex:paintingTexture},{...buffer(wood),tex:woodTexture}],inside=[{...buffer(micro),tex:woodTexture},{...buffer(microObjects),tex:fragmentTexture}];
    const shadows=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,shadows);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(shadowVertices),gl.STATIC_DRAW);
    function attrib(p,name,size,stride,offset){const i=gl.getAttribLocation(p,name);if(i>=0){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,stride,offset);}}
    function drawBatches(list,vp,camera,time,scatter,fog,isMicro){
      gl.useProgram(material);gl.uniformMatrix4fv(gl.getUniformLocation(material,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(material,'uCamera'),camera);
      gl.uniform3fv(gl.getUniformLocation(material,'uFog'),fog);gl.uniform3fv(gl.getUniformLocation(material,'uSun'),sun);gl.uniform1f(gl.getUniformLocation(material,'uTime'),time);
      gl.uniform1f(gl.getUniformLocation(material,'uScatter'),scatter);gl.uniform1f(gl.getUniformLocation(material,'uMicro'),isMicro?1:0);gl.uniform1i(gl.getUniformLocation(material,'uTexture'),0);
      for(const batch of list){gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,batch.tex);gl.bindBuffer(gl.ARRAY_BUFFER,batch.buffer);
        attrib(material,'aPos',3,52,0);attrib(material,'aNormal',3,52,12);attrib(material,'aUV',2,52,24);attrib(material,'aIndex',1,52,32);attrib(material,'aWind',1,52,36);attrib(material,'aOffset',3,52,40);gl.drawArrays(gl.TRIANGLES,0,batch.count);}
    }
    return {
      drawShadows(vp){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.useProgram(shadow);gl.bindBuffer(gl.ARRAY_BUFFER,shadows);attrib(shadow,'aPos',3,16,0);attrib(shadow,'aAlpha',1,16,12);gl.uniformMatrix4fv(gl.getUniformLocation(shadow,'uVP'),false,vp);gl.drawArrays(gl.TRIANGLES,0,shadowVertices.length/4);gl.depthMask(true);gl.disable(gl.BLEND);},
      draw(vp,camera,time,scatter,fog){drawBatches(batches,vp,camera,time,scatter,fog,false);},
      drawMicro(vp,camera,time){drawBatches(inside,vp,camera,time,0,[.22,.16,.13],true);}
    };
  }
  window.MonticoLabGeometry={create};
})();
