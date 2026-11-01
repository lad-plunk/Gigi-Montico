/* Grounded, sculptural forms and kinetic details for the metaphysical planet. */
(() => {
  'use strict';
  function create(gl,o){
    const {M,radius,ground,normalAt,sun,paintingTexture,lakes}=o,{add,scale,cross,dot,norm}=M,TAU=Math.PI*2;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
    function program(v,f){const p=gl.createProgram();gl.attachShader(p,shader(gl.VERTEX_SHADER,v));gl.attachShader(p,shader(gl.FRAGMENT_SHADER,f));gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;}
    const solidProgram=program(`
      attribute vec3 aPos;attribute vec3 aNormal;attribute vec2 aUV;attribute float aIndex;attribute vec3 aTint;attribute float aMotion;attribute vec3 aOffset;attribute vec3 aPivot;
      uniform mat4 uVP;uniform vec3 uCamera;uniform float uTime;uniform float uScatter;
      varying vec3 vNormal;varying vec2 vUV;varying float vIndex;varying vec3 vTint;varying float vDistance;
      vec3 turn(vec3 v,vec3 axis,float a){return v*cos(a)+cross(axis,v)*sin(a)+axis*dot(axis,v)*(1.-cos(a));}
      void main(){vec3 p=aPos,n=aNormal;
        if(aMotion>.5){vec3 axis=normalize(aPivot);float angle=uTime*(aMotion>1.5?.11:.18);p=aPivot+turn(aPos-aPivot,axis,angle);n=turn(n,axis,angle);}
        p+=aOffset*uScatter;vNormal=n;vUV=aUV;vIndex=aIndex;vTint=aTint;vDistance=distance(p,uCamera);gl_Position=uVP*vec4(p,1.);}
    `,`
      precision mediump float;uniform sampler2D uPaint;uniform vec3 uFog;uniform vec3 uSun;
      varying vec3 vNormal;varying vec2 vUV;varying float vIndex;varying vec3 vTint;varying float vDistance;
      void main(){float i=mod(vIndex+8.,8.);vec2 cell=vec2(mod(i,4.),floor(i/4.));
        vec3 paint=texture2D(uPaint,(cell+mix(vec2(.015),vec2(.985),clamp(vUV,0.,1.)))/vec2(4.,2.)).rgb;
        float material=i>5.5?.26:.40;vec3 colour=mix(paint,vTint,material);
        float light=.58+.42*max(dot(normalize(vNormal),normalize(uSun)),0.);
        colour=mix(colour*light,uFog,smoothstep(55.,165.,vDistance)*.38);gl_FragColor=vec4(colour,1.);}
    `);
    const waterProgram=program(`
      attribute vec3 aPos;attribute vec3 aNormal;attribute vec2 aUV;uniform mat4 uVP;uniform mediump float uTime;uniform vec3 uCamera;
      varying vec2 vUV;varying float vDistance;varying vec3 vNormal;
      void main(){float edge=1.-smoothstep(.32,.5,length(aUV-.5));
        float wave=(sin(aUV.x*25.+uTime*.8)*.035+cos(aUV.y*22.-uTime*.65)*.025)*edge;vec3 p=aPos+aNormal*wave;
        vUV=aUV;vNormal=aNormal;vDistance=distance(p,uCamera);gl_Position=uVP*vec4(p,1.);}
    `,`
      precision mediump float;uniform float uTime;uniform vec3 uFog;uniform vec3 uSun;varying vec2 vUV;varying float vDistance;varying vec3 vNormal;
      void main(){float ripple=sin(vUV.x*75.+sin(vUV.y*22.)*2.+uTime*.9)*cos(vUV.y*68.-uTime*.6);
        float light=.66+.34*max(dot(normalize(vNormal),normalize(uSun)),0.);vec3 c=mix(vec3(.12,.25,.29),vec3(.42,.59,.58),.42+.12*ripple)*light;
        c=mix(c,uFog,smoothstep(45.,130.,vDistance)*.30);gl_FragColor=vec4(c,.94);}
    `);
    const motesProgram=program(`
      attribute vec3 aPos;attribute float aSeed;attribute float aKind;uniform mat4 uVP;uniform vec3 uCamera;uniform float uTime;varying float vKind;varying float vFade;
      void main(){vec3 n=normalize(aPos),east=normalize(cross(vec3(0.,1.,0.),n)),north=normalize(cross(n,east));
        float phase=fract(aSeed+uTime*(.008+.002*mod(aKind,3.)));float angle=phase*12.56637+aSeed*6.28318;
        vec3 p=aPos+east*(phase*8.-4.+cos(angle)*.55)+north*sin(angle)*.55+n*(phase*3.);
        float d=distance(p,uCamera);vFade=(1.-smoothstep(22.,70.,d))*smoothstep(0.,.12,phase)*(1.-smoothstep(.85,1.,phase));
        vKind=aKind;gl_PointSize=clamp(26./max(d,1.),1.,4.);gl_Position=uVP*vec4(p,1.);}
    `,`
      precision mediump float;varying float vKind;varying float vFade;void main(){float a=(1.-smoothstep(.18,.5,length(gl_PointCoord-.5)))*vFade;
        vec3 c=vKind<2.?vec3(.84,.77,.64):vKind<4.?vec3(.69,.78,.77):vec3(.88,.68,.55);gl_FragColor=vec4(c,a*.58);}
    `);
    const shadowProgram=program(`attribute vec3 aPos;attribute float aAlpha;uniform mat4 uVP;varying float vAlpha;void main(){vAlpha=aAlpha;gl_Position=uVP*vec4(aPos,1.);}`,`
      precision mediump float;varying float vAlpha;void main(){gl_FragColor=vec4(.04,.035,.03,vAlpha);}
    `);
    const data=[],waterData=[],motes=[],shadowData=[];let seed=207133;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;},between=(a,b)=>a+(b-a)*random();
    function frame(u,lat){const n=normalAt((u+1)%1,lat),a=(u-.5)*TAU,east=[Math.cos(a),0,-Math.sin(a)],north=norm(cross(n,east)),base=radius+ground(n);
      return {n,east,north,point:(x,y,z)=>add(add(scale(n,base+y),scale(east,x)),scale(north,z))};}
    function shadow(f,width,height){const daylight=dot(f.n,sun);if(daylight<=.06)return;
      const direction=scale(norm(add(sun,scale(f.n,-daylight))),-1),side=norm(cross(f.n,direction)),length=Math.min(height*1.1,width*(1.6+(1-daylight)*2)),alpha=.19*Math.min(1,daylight*4);
      const point=(x,z)=>{const n=norm(add(f.n,scale(add(scale(direction,x),scale(side,z)),1/radius)));return scale(n,radius+ground(n)+.10);};
      const center=point(length*.22,0);for(let k=0;k<14;k++){const a=k/14*TAU,b=(k+1)/14*TAU;
        shadowData.push(...center,alpha,...point(length*.22+Math.cos(a)*length,Math.sin(a)*width),0,...point(length*.22+Math.cos(b)*length,Math.sin(b)*width),0);}}
    function vert(p,u,v,index,tint,motion=0,offset=[0,0,0],pivot=[0,0,0],normal=null){return{p,u,v,index,tint,motion,offset,pivot,normal};}
    function triangle(a,b,c){const face=norm(cross(add(b.p,scale(a.p,-1)),add(c.p,scale(a.p,-1))));
      [a,b,c].forEach(v=>data.push(...v.p,...(v.normal||face),v.u,v.v,v.index,...v.tint,v.motion,...v.offset,...v.pivot));}
    function quad(a,b,c,d){triangle(a,b,c);triangle(a,c,d);}
    function block(f,x,y,z,sx,sy,sz,index,tint,offset=[0,0,0],motion=0,pivot=[0,0,0]){
      const p=(dx,dy,dz)=>f.point(x+dx*sx,y+dy*sy,z+dz*sz);
      const v=[p(-.5,-.5,-.5),p(.5,-.5,-.5),p(.5,-.5,.5),p(-.5,-.5,.5),p(-.5,.5,-.5),p(.5,.5,-.5),p(.5,.5,.5),p(-.5,.5,.5)];
      [[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7],[4,5,6,7],[3,2,1,0]].forEach(q=>quad(vert(v[q[0]],0,0,index,tint,motion,offset,pivot),vert(v[q[1]],1,0,index,tint,motion,offset,pivot),vert(v[q[2]],1,1,index,tint,motion,offset,pivot),vert(v[q[3]],0,1,index,tint,motion,offset,pivot)));
    }
    // Rounded solids have smooth normals and carry the painting over their entire skin.
    function stone(u,lat,sx,sy,sz,index,tint){const f=frame(u,lat),segments=16,rings=10,rough=between(.015,.055),phase=between(0,TAU);
      const v=(i,j)=>{const a=i/segments*TAU,b=j/rings*Math.PI,noise=1+rough*Math.sin(a*3+phase)*Math.sin(b*4+phase),x=Math.sin(b)*Math.cos(a),y=Math.cos(b),z=Math.sin(b)*Math.sin(a);
        const normal=norm(add(add(scale(f.east,x/sx),scale(f.n,y/sy)),scale(f.north,z/sz)));
        return vert(f.point(x*sx*noise,sy+y*sy*noise,z*sz*noise),i/segments,j/rings,index,tint,0,[0,0,0],[0,0,0],normal);};
      for(let j=0;j<rings;j++)for(let i=0;i<segments;i++)quad(v(i,j),v(i+1,j),v(i+1,j+1),v(i,j+1));
      shadow(f,Math.min(sx,sz)*.8,sy*2);}
    // Uneven, tapering wood forms use a crop of an actual Montico sculpture photograph.
    function wood(u,lat,height,wide){const f=frame(u,lat),sides=14,levels=10,phase=between(0,TAU),lean=between(-.6,.6),tint=[.34,.22,.16];
      const v=(i,j)=>{const a=i/sides*TAU,t=j/levels,rr=wide*(1-.32*t)*(1+.12*Math.sin(a*3+phase+t*4)+.05*Math.sin(a*7-t*8));
        const x=Math.cos(a)*rr+lean*t*t,z=Math.sin(a)*rr+Math.sin(t*3+phase)*wide*.14*t;
        const normal=norm(add(add(scale(f.east,Math.cos(a)),scale(f.north,Math.sin(a))),scale(f.n,wide*.32/height)));
        return vert(f.point(x,height*t,z),i/sides,t,6,tint,0,[0,0,0],[0,0,0],normal);};
      for(let j=0;j<levels;j++)for(let i=0;i<sides;i++)quad(v(i,j),v(i+1,j),v(i+1,j+1),v(i,j+1));
      const top=vert(f.point(lean,height,Math.sin(3+phase)*wide*.14),.5,1,6,tint);
      for(let i=0;i<sides;i++)triangle(top,v(i,levels),v(i+1,levels));shadow(f,wide,height);}
    function woodArch(u,lat){const f=frame(u,lat),segments=24,sides=10,width=2.35,height=4.15,tint=[.34,.22,.16];
      // A single bent, irregular piece of wood creates a passage without a geometric frame.
      const v=(i,j)=>{const a=i/segments*Math.PI,b=j/sides*TAU;
        const thickness=.43*(1+.16*Math.sin(a*5+.4)+.05*Math.sin(b*4+a*7)),along=Math.sin(a)*height,across=Math.cos(a)*width;
        const x=Math.cos(b)*thickness+.18*Math.sin(a*3),y=along+Math.sin(b)*Math.sin(a)*thickness,z=across+Math.sin(b)*Math.cos(a)*thickness;
        const normal=norm(add(scale(f.east,Math.cos(b)),add(scale(f.n,Math.sin(b)*Math.sin(a)),scale(f.north,Math.sin(b)*Math.cos(a)))));
        return vert(f.point(x,y,z),i/segments,j/sides,6,tint,0,[0,0,0],[0,0,0],normal);};
      for(let i=0;i<segments;i++)for(let j=0;j<sides;j++)quad(v(i,j),v(i+1,j),v(i+1,j+1),v(i,j+1));
      shadow(f,width,height);
    }
    function monolith(u,lat,height,width,depth,index,tint){const f=frame(u,lat);block(f,0,height/2,0,width,height,depth,index,tint);shadow(f,Math.min(width,depth)*.6,height);
      // Fine vertical relief gives the surfaces a material rhythm rather than windows.
      for(let i=0;i<6;i++){const x=(i/5-.5)*width*.82;block(f,x,height*.48,-depth*.508,width*.025,height*.90,depth*.018,index,tint);}}
    function torus(u,lat,height,rad,index,tint){const f=frame(u,lat),pivot=f.point(0,height,0),segments=32,sides=6,tube=Math.max(.09,rad*.055);
      const v=(i,j)=>{const a=i/segments*TAU,b=j/sides*TAU,r=rad+tube*Math.cos(b);
        const normal=norm(add(add(scale(f.east,Math.cos(a)*Math.cos(b)),scale(f.n,Math.sin(a)*Math.cos(b))),scale(f.north,Math.sin(b))));
        return vert(f.point(Math.cos(a)*r,height+Math.sin(a)*r,tube*Math.sin(b)),i/segments,j/sides,index,tint,1,[0,0,0],pivot,normal);};
      for(let i=0;i<segments;i++)for(let j=0;j<sides;j++)quad(v(i,j),v(i+1,j),v(i+1,j+1),v(i,j+1));
      block(f,0,height*.50,0,.13,height,.13,index,[.26,.25,.23]);
      block(f,rad*.48,height,0,rad*.96,.11,.11,index,tint,[0,0,0],1,pivot);shadow(f,rad*.6,height+rad);}
    function positions(index,count,fn){const center=index/6+.016;for(let i=0;i<count;i++){
      const u=(center+between(-.074,.074)+1)%1,lat=between(-.23,.23);if(Math.abs(lat)*radius>4)fn(u,lat,i);}}
    const ash=[.45,.42,.39],clay=[.49,.32,.27],blue=[.28,.39,.43],ivory=[.58,.54,.46];
    // A few large landmarks and much smaller traces make scale part of the encounter.
    stone(.041,.046,4.7,4.7,4.6,0,ivory);stone(.058,-.065,2.5,3.0,2.2,0,blue);monolith(.066,.11,14,2.2,1.8,0,ash);
    positions(0,30,(u,lat)=>stone(u,lat,between(.12,1.1),between(.12,1.5),between(.12,1.0),0,ash));
    // The wood landscape is a collection of weathered sculptural forms, not cartoon trees.
    wood(1/6+.045,.045,17,1.8);wood(1/6+.055,-.055,11,1.15);wood(1/6+.031,.087,7,.9);
    positions(1,52,(u,lat)=>wood(u,lat,between(2.1,9.5),between(.18,.65)));
    // A curved piece recalls the artist's weathered wooden sculptures.
    woodArch(1/6+.033,0);
    // The lake is left open, with grounded forms placed outside the natural waterline.
    for(const lake of lakes){for(let i=0;i<8;i++){const a=i/8*TAU+.2,d=lake.r+between(5.5,9),du=Math.cos(a)*d/(radius*TAU*Math.max(.25,Math.cos(lake.lat))),dl=Math.sin(a)*d/radius;
      if(lake.main&&Math.abs((lake.lat+dl)*radius)<3.5)continue;const size=between(.25,1.3);stone((lake.u+du+1)%1,lake.lat+dl,size,size*.8,size*.9,2,blue);}}
    stone(2/6+.060,.10,2.6,2.2,2.7,2,blue);torus(2/6+.055,-.11,5.0,2.0,2,ivory);
    // Abstract, tall assemblages refer to Fabbriche without becoming houses or vehicles.
    monolith(3/6+.045,.055,19,3.6,2.7,3,ash);monolith(3/6+.070,-.085,11,4.3,1.6,3,clay);
    positions(3,24,(u,lat)=>{const h=between(2.0,12.0);monolith(u,lat,h,between(.5,2.1),between(.45,1.6),3,random()<.5?ash:clay);});
    torus(3/6+.028,-.035,4.6,1.8,3,ash);torus(3/6+.070,.12,7.0,2.8,3,blue);
    // Canyon walls come from the terrain itself, with a few small grounded fragments.
    positions(4,18,(u,lat)=>{if(Math.abs(lat)<.08){const a=between(.15,.7);stone(u,lat,a,a*.7,a*.9,4,clay);}});
    // The material can separate and reunite, and a supported ring turns independently.
    torus(5/6+.050,.050,6.3,2.6,5,ivory);stone(5/6+.065,-.07,3.4,2.7,3.0,5,clay);
    positions(5,22,(u,lat)=>{const a=between(.18,1.3);stone(u,lat,a,a*between(.7,1.6),a,5,random()<.5?clay:blue);});
    {const f=frame(5/6+.034,0);for(let k=0;k<30;k++){const a=k*2.399,layer=Math.floor(k/7),x=Math.cos(a)*.55,z=Math.sin(a)*.55,y=.38+layer*.48;
      const offset=add(add(scale(f.east,Math.cos(a)*(1.6+layer*.25)),scale(f.north,Math.sin(a)*(1.6+layer*.25))),scale(f.n,(k%3-1)*.7));
      block(f,x,y,z,.14+(k%3)*.09,.22+(k%4)*.07,.17+(k%2)*.10,5,k%2?clay:blue,offset);}}
    // Particles drift on helical paths, fading at the ends to avoid abrupt jumps.
    for(let biome=0;biome<6;biome++)for(let i=0;i<110;i++){const u=(biome/6+.016+between(-.08,.08)+1)%1,lat=between(-.25,.25),f=frame(u,lat),p=f.point(0,between(.3,5),0);motes.push(...p,random(),biome);}
    function waterVertex(lake,ring,k){const a=k/48*TAU,rad=(lake.r+3.4)*ring/8,n=normalAt(lake.u,lake.lat),ang=(lake.u-.5)*TAU,east=[Math.cos(ang),0,-Math.sin(ang)],north=norm(cross(n,east));
      const p=norm(add(n,scale(add(scale(east,Math.cos(a)*rad),scale(north,Math.sin(a)*rad)),1/radius)));return [...scale(p,radius-.55),...p,.5+Math.cos(a)*ring/16,.5+Math.sin(a)*ring/16];}
    for(const lake of lakes)for(let ring=0;ring<8;ring++)for(let k=0;k<48;k++){const a=waterVertex(lake,ring,k),b=waterVertex(lake,ring,k+1),c=waterVertex(lake,ring+1,k+1),d=waterVertex(lake,ring+1,k);waterData.push(...a,...b,...c,...a,...c,...d);}
    function buffer(values){const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(values),gl.STATIC_DRAW);return b;}
    const solidCount=data.length/19,waterCount=waterData.length/8,moteCount=motes.length/5,shadowCount=shadowData.length/4;
    const solid=buffer(data),waterBuffer=buffer(waterData),particleBuffer=buffer(motes),shadowsBuffer=buffer(shadowData);
    data.length=0;waterData.length=0;motes.length=0;shadowData.length=0;
    function attrib(p,name,size,stride,offset){const i=gl.getAttribLocation(p,name);if(i>=0){gl.enableVertexAttribArray(i);gl.vertexAttribPointer(i,size,gl.FLOAT,false,stride,offset);}}
    return {
      drawShadows(vp){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.useProgram(shadowProgram);gl.bindBuffer(gl.ARRAY_BUFFER,shadowsBuffer);attrib(shadowProgram,'aPos',3,16,0);attrib(shadowProgram,'aAlpha',1,16,12);gl.uniformMatrix4fv(gl.getUniformLocation(shadowProgram,'uVP'),false,vp);gl.drawArrays(gl.TRIANGLES,0,shadowCount);gl.depthMask(true);gl.disable(gl.BLEND);},
      drawSolid(vp,camera,time,scatter,fog){gl.useProgram(solidProgram);gl.bindBuffer(gl.ARRAY_BUFFER,solid);attrib(solidProgram,'aPos',3,76,0);attrib(solidProgram,'aNormal',3,76,12);attrib(solidProgram,'aUV',2,76,24);attrib(solidProgram,'aIndex',1,76,32);attrib(solidProgram,'aTint',3,76,36);attrib(solidProgram,'aMotion',1,76,48);attrib(solidProgram,'aOffset',3,76,52);attrib(solidProgram,'aPivot',3,76,64);
        gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,paintingTexture);gl.uniform1i(gl.getUniformLocation(solidProgram,'uPaint'),0);gl.uniformMatrix4fv(gl.getUniformLocation(solidProgram,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(solidProgram,'uCamera'),camera);gl.uniform3fv(gl.getUniformLocation(solidProgram,'uFog'),fog);gl.uniform3fv(gl.getUniformLocation(solidProgram,'uSun'),sun);gl.uniform1f(gl.getUniformLocation(solidProgram,'uTime'),time);gl.uniform1f(gl.getUniformLocation(solidProgram,'uScatter'),scatter);gl.drawArrays(gl.TRIANGLES,0,solidCount);},
      drawWater(vp,camera,time,fog){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.useProgram(waterProgram);gl.bindBuffer(gl.ARRAY_BUFFER,waterBuffer);attrib(waterProgram,'aPos',3,32,0);attrib(waterProgram,'aNormal',3,32,12);attrib(waterProgram,'aUV',2,32,24);
        gl.uniformMatrix4fv(gl.getUniformLocation(waterProgram,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(waterProgram,'uCamera'),camera);gl.uniform3fv(gl.getUniformLocation(waterProgram,'uFog'),fog);gl.uniform3fv(gl.getUniformLocation(waterProgram,'uSun'),sun);gl.uniform1f(gl.getUniformLocation(waterProgram,'uTime'),time);gl.drawArrays(gl.TRIANGLES,0,waterCount);gl.depthMask(true);gl.disable(gl.BLEND);},
      drawMotes(vp,camera,time){gl.enable(gl.BLEND);gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);gl.depthMask(false);gl.useProgram(motesProgram);gl.bindBuffer(gl.ARRAY_BUFFER,particleBuffer);attrib(motesProgram,'aPos',3,20,0);attrib(motesProgram,'aSeed',1,20,12);attrib(motesProgram,'aKind',1,20,16);
        gl.uniformMatrix4fv(gl.getUniformLocation(motesProgram,'uVP'),false,vp);gl.uniform3fv(gl.getUniformLocation(motesProgram,'uCamera'),camera);gl.uniform1f(gl.getUniformLocation(motesProgram,'uTime'),time);gl.drawArrays(gl.POINTS,0,moteCount);gl.depthMask(true);gl.disable(gl.BLEND);}
    };
  }
  window.MonticoMetaphysicalGeometry={create};
})();
