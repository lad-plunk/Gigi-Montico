/* Background music is played from local, attributed CC BY recordings. */
(() => {
  'use strict';
  const tracks={
    prima:{file:'meditation-impromptu-01.mp3',title:'Meditation Impromptu 01',isrc:'USUAN1100163',level:1.8},
    teatrino:{file:'meditation-impromptu-02.mp3',title:'Meditation Impromptu 02',isrc:'USUAN1100162',level:1.8},
    deserto:{file:'healing.mp3',title:'Healing',isrc:'USUAN1200048',level:.95},
    fabbriche:{file:'morning.mp3',title:'Morning',isrc:'USUAN2300003',level:.95},
    wood:{file:'that-zen-moment.mp3',title:'That Zen Moment',isrc:'USUAN2400001',level:.95},
    viaggio:{file:'meditation-impromptu-03.mp3',title:'Meditation Impromptu 03',isrc:'USUAN1100161',level:1.8}
  };
  const preferenceKey='montico-ambient-muted';
  function create(button,italian){
    const AudioConstructor=window.AudioContext||window.webkitAudioContext;
    if(!button||!AudioConstructor)return null;
    let muted=false;
    try{muted=localStorage.getItem(preferenceKey)==='1';}catch(error){/* Optional preference storage. */}
    let context=null,master=null,slots=[],active=null,pending=null,requested=null,started=false,serial=0,suspendTimer=null;
    function updateButton(){
      button.hidden=false;button.textContent=muted?'♪ off':'♪ on';
      button.setAttribute('aria-pressed',String(!muted));
      button.setAttribute('aria-label',italian?'Suono ambientale':'Ambient sound');
      button.title=italian?'Suono ambientale':'Ambient sound';
    }
    function updateCredit(){
      const credit=document.getElementById('musicCredit'),link=document.getElementById('musicTrack');
      if(!credit||!link||!tracks[requested])return;
      link.textContent=tracks[requested].title;
      link.href='https://incompetech.com/music/royalty-free/index.html?isrc='+tracks[requested].isrc;
      credit.hidden=false;
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
      for(let i=0;i<2;i++){
        const audio=document.createElement('audio'),gain=context.createGain();
        audio.preload='none';audio.loop=true;audio.playsInline=true;audio.hidden=true;audio.setAttribute('playsinline','');document.body.appendChild(audio);
        gain.gain.value=0;context.createMediaElementSource(audio).connect(gain);gain.connect(master);
        slots.push({audio,gain,key:null,token:0});
      }
    }
    function silence(){
      serial++;pending=null;
      if(!context||!master)return;
      fade(master.gain,0,.4);clearTimeout(suspendTimer);
      suspendTimer=setTimeout(()=>{
        if(muted){slots.forEach(slot=>slot.audio.pause());if(context.state==='running')context.suspend().catch(()=>{});}
      },500);
    }
    function failed(operation){
      if(operation!==serial)return;
      muted=true;silence();updateButton();
    }
    function resumeContext(){
      if(context.state==='running')return;
      context.resume().catch(()=>{
        if(!document.hidden&&!muted&&context.state!=='running'){muted=true;silence();updateButton();}
      });
    }
    function changeTrack(key){
      if(!context||muted||!started||!tracks[key]||pending?.key===key||(!pending&&active?.key===key))return;
      const operation=++serial,slot=slots.find(candidate=>candidate!==active)||slots[0],track=tracks[key];
      slot.audio.pause();slot.gain.gain.cancelScheduledValues(context.currentTime);slot.gain.gain.setValueAtTime(0,context.currentTime);
      slot.key=key;slot.token=operation;slot.audio.src='../assets/audio/'+track.file;
      pending={key,operation};
      let playback;
      try{playback=slot.audio.play();}catch(error){failed(operation);return;}
      Promise.resolve(playback).then(()=>{
        if(operation!==serial||muted||requested!==key||document.hidden){if(slot.token===operation)slot.audio.pause();return;}
        const old=active;active=slot;pending=null;fade(slot.gain.gain,track.level,2.5);
        if(old&&old!==slot){
          const oldToken=old.token;fade(old.gain.gain,0,2.5);
          setTimeout(()=>{if(active!==old&&old.token===oldToken)old.audio.pause();},2700);
        }
      }).catch(()=>failed(operation));
    }
    function setScene(key){
      if(!tracks[key])return;
      requested=key;updateCredit();
      if(context&&!muted&&started){
        resumeContext();changeTrack(key);
      }
    }
    function start(key){
      if(tracks[key]){requested=key;updateCredit();}
      if(muted||!requested)return;
      try{
        ensureContext();started=true;clearTimeout(suspendTimer);
        resumeContext();
        fade(master.gain,.35,1.5);
        if(active?.key===requested&&!pending){
          const operation=serial;Promise.resolve(active.audio.play()).catch(()=>failed(operation));
        }else changeTrack(requested);
      }catch(error){muted=true;silence();updateButton();}
    }
    button.addEventListener('click',()=>{
      muted=!muted;try{localStorage.setItem(preferenceKey,muted?'1':'0');}catch(error){/* Sound still works without storage. */}
      updateButton();
      if(muted)silence();else start(requested);
    });
    document.addEventListener('visibilitychange',()=>{
      if(!context||!started)return;
      if(document.hidden){
        serial++;pending=null;slots.forEach(slot=>slot.audio.pause());
        if(context.state==='running')context.suspend().then(()=>{if(!document.hidden&&!muted)start(requested);}).catch(()=>{});
      }else if(!muted)start(requested);
    });
    updateButton();
    return {start,setScene};
  }
  window.MonticoAmbient={create};
})();
