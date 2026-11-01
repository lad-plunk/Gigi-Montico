/* A quiet music bed and slowly changing procedural environmental layers. */
(() => {
  'use strict';
  function create(button, italian){
    const Context=window.AudioContext||window.webkitAudioContext;if(!Context||!button)return null;
    const key='montico-ambient-muted';let muted=false,context=null,audio=null,master=null,filter=null,noiseLevel=null,panner=null,started=false,region=0,inside=false;
    try{muted=localStorage.getItem(key)==='1';}catch(error){/* Optional preference. */}
    function label(){button.hidden=false;button.textContent=muted?'♪ off':'♪ on';button.setAttribute('aria-pressed',String(!muted));button.setAttribute('aria-label',italian?'Suono ambientale':'Ambient sound');}
    function apply(){
      if(!context)return;
      const frequencies=[210,380,150,330,680,250,190,950,280],levels=[.050,.075,.045,.060,.070,.045,.050,.080,.045],now=context.currentTime;
      filter.frequency.setTargetAtTime(inside?110:frequencies[region],now,2.0);noiseLevel.gain.setTargetAtTime(inside?.055:levels[region],now,2.0);
      if(panner)panner.pan.setTargetAtTime(inside?0:Math.sin(region*1.37)*.38,now,2.0);
    }
    function setup(){
      if(context)return;context=new Context();master=context.createGain();master.gain.value=0;master.connect(context.destination);
      audio=document.createElement('audio');audio.hidden=true;audio.loop=true;audio.preload='none';audio.playsInline=true;audio.setAttribute('playsinline','');audio.src='../assets/audio/that-zen-moment.mp3';document.body.appendChild(audio);
      const music=context.createMediaElementSource(audio),musicGain=context.createGain();musicGain.gain.value=.88;music.connect(musicGain);musicGain.connect(master);
      const buffer=context.createBuffer(1,context.sampleRate*4,context.sampleRate),data=buffer.getChannelData(0);let seed=24365;
      for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;data[i]=(seed/4294967296)*2-1;}
      const noise=context.createBufferSource();noise.buffer=buffer;noise.loop=true;filter=context.createBiquadFilter();filter.type='lowpass';filter.frequency.value=180;noiseLevel=context.createGain();noiseLevel.gain.value=.04;
      noise.connect(filter);filter.connect(noiseLevel);if(context.createStereoPanner){panner=context.createStereoPanner();noiseLevel.connect(panner);panner.connect(master);}else noiseLevel.connect(master);
      noise.start();apply();
      // Sparse, quiet metallic notes appear only in the listening region.
      setInterval(()=>{if(!context||muted||document.hidden||region!==7||inside)return;
        const now=context.currentTime,osc=context.createOscillator(),gain=context.createGain();osc.type='sine';osc.frequency.value=region%2?392:440;
        gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.025,now+.12);gain.gain.exponentialRampToValueAtTime(.0001,now+3.0);
        osc.connect(gain);gain.connect(master);osc.start(now);osc.stop(now+3.1);
      },8500);
    }
    function start(){
      if(muted)return;try{setup();started=true;if(context.state!=='running')context.resume().catch(()=>{});master.gain.setTargetAtTime(.26,context.currentTime,.7);
        const play=audio.play();if(play&&play.catch)play.catch(()=>{muted=true;pause();label();});}catch(error){muted=true;pause();label();}
    }
    function pause(){if(!context)return;master.gain.setTargetAtTime(0,context.currentTime,.15);setTimeout(()=>{if(muted||document.hidden)audio.pause();},300);}
    button.addEventListener('click',()=>{muted=!muted;try{localStorage.setItem(key,muted?'1':'0');}catch(error){/* Optional preference. */}label();if(muted)pause();else start();});
    document.addEventListener('visibilitychange',()=>{if(!started)return;if(document.hidden)pause();else if(!muted)start();});
    label();return {start, setRegion(i,isInside){region=Math.max(0,Math.min(8,i));inside=!!isInside;apply();}};
  }
  window.MonticoLabAudio={create};
})();
