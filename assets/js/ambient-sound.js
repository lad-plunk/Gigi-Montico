/* A quiet, locally synthesised soundscape. No recordings or services are required. */
(() => {
  'use strict';
  const profiles={
    prima:{notes:[196.00,293.66,392.00],filter:720,rate:.027},
    teatrino:{notes:[174.61,261.63,349.23],filter:640,rate:.031},
    deserto:{notes:[146.83,220.00,293.66],filter:560,rate:.038},
    fabbriche:{notes:[130.81,196.00,261.63],filter:600,rate:.034},
    wood:{notes:[123.47,185.00,246.94],filter:480,rate:.025},
    viaggio:{notes:[164.81,246.94,329.63],filter:760,rate:.029}
  };
  const preferenceKey='montico-ambient-muted';
  function create(button,italian){
    const AudioConstructor=window.AudioContext||window.webkitAudioContext;
    if(!button||!AudioConstructor)return null;
    let muted=false;
    try{muted=localStorage.getItem(preferenceKey)==='1';}catch(error){/* Optional preference storage. */}
    let context=null,master=null,current=null,requested=null,suspendTimer=null;
    function updateButton(){
      button.hidden=false;button.textContent=muted?'♪ off':'♪ on';
      button.setAttribute('aria-pressed',String(!muted));
      button.setAttribute('aria-label',italian?'Suono ambientale':'Ambient sound');
      button.title=italian?'Suono ambientale':'Ambient sound';
    }
    function fade(param,value,seconds){
      const now=context.currentTime;
      if(typeof param.cancelAndHoldAtTime==='function')param.cancelAndHoldAtTime(now);
      else{const previous=param.value;param.cancelScheduledValues(now);param.setValueAtTime(previous,now);}
      param.linearRampToValueAtTime(value,now+seconds);
    }
    function ensureContext(){
      if(context)return;
      context=new AudioConstructor();master=context.createGain();master.gain.value=0;master.connect(context.destination);
    }
    function buildPad(key){
      const profile=profiles[key],bus=context.createGain(),filter=context.createBiquadFilter(),nodes=[],oscillators=[];
      bus.gain.value=0;bus.connect(master);filter.type='lowpass';filter.frequency.value=profile.filter;filter.Q.value=.25;filter.connect(bus);
      profile.notes.forEach((frequency,index)=>{
        const tone=context.createOscillator(),volume=context.createGain(),lfo=context.createOscillator(),depth=context.createGain();
        tone.type=index===0?'triangle':'sine';tone.frequency.value=frequency;
        volume.gain.value=[.23,.14,.10][index];lfo.type='sine';lfo.frequency.value=profile.rate+index*.008;depth.gain.value=[.045,.03,.022][index];
        tone.connect(volume);volume.connect(filter);lfo.connect(depth);depth.connect(volume.gain);
        tone.start();lfo.start();nodes.push(tone,volume,lfo,depth);oscillators.push(tone,lfo);
      });
      nodes.push(filter,bus);
      return {key,bus,nodes,oscillators};
    }
    function changePad(){
      if(!context||muted||!requested||current?.key===requested)return;
      const next=buildPad(requested),old=current;current=next;fade(next.bus.gain,1,2.8);
      if(old){
        fade(old.bus.gain,0,2.8);
        old.oscillators[0].onended=()=>old.nodes.forEach(node=>node.disconnect());
        old.oscillators.forEach(oscillator=>oscillator.stop(context.currentTime+3));
      }
    }
    function setScene(key){if(profiles[key]){requested=key;changePad();}}
    function start(key){
      setScene(key);if(muted||!requested)return;
      try{
        ensureContext();changePad();clearTimeout(suspendTimer);
        if(context.state!=='running')context.resume().catch(()=>{muted=true;updateButton();});
        fade(master.gain,.16,2.5);
      }catch(error){muted=true;updateButton();}
    }
    button.addEventListener('click',()=>{
      muted=!muted;try{localStorage.setItem(preferenceKey,muted?'1':'0');}catch(error){/* Sound still works without storage. */}
      updateButton();
      if(muted&&context){
        fade(master.gain,0,.45);clearTimeout(suspendTimer);
        suspendTimer=setTimeout(()=>{if(muted&&context.state==='running')context.suspend().catch(()=>{});},600);
      }else if(!muted)start(requested);
    });
    document.addEventListener('visibilitychange',()=>{
      if(!context)return;
      if(document.hidden&&context.state==='running')context.suspend().catch(()=>{});
      else if(!document.hidden&&!muted&&context.state!=='running'&&context.state!=='closed')context.resume().catch(()=>{});
    });
    updateButton();
    return {start,setScene};
  }
  window.MonticoAmbient={create};
})();
