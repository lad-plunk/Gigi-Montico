/* Local-only questionnaire; visitors decide whether and how to share answers. */
(() => {
  'use strict';
  const it=document.documentElement.lang==='it', form=document.getElementById('feedbackForm'), list=document.getElementById('questions'), storageKey='montico-laboratorio-feedback-1';
  const questions=it?[
    ['Segni che diventano paesaggio','Le linee del dipinto diventano forme tridimensionali.'],
    ['Materia che si separa e ricompone','Prova i pulsanti Disgrega e Ricomponi.'],
    ['Dal grande al piccolo','Entra nel legno immaginato, esploralo e torna al pianeta.'],
    ['Le opere si incontrano','Osserva il passaggio tra colori e forme di opere vicine.'],
    ['Paesaggio vivo','Osserva il movimento lento delle forme.'],
    ['Dialogo con le avanguardie','Guarda la composizione e apri la nota proposta.'],
    ['Da una scultura reale','Confronta la forma interpretata con la fotografia di Casa Montico.'],
    ['Suono che cambia','Ascolta il sottofondo in luoghi diversi, se possibile con le cuffie.'],
    ['Mappa e percorso guidato','Prova a raggiungere un’idea dalla mappa o ad avviare il giro guidato.']
  ]:[
    ['Marks become landscape','Lines from the painting become three-dimensional forms.'],
    ['Matter scatters and reassembles','Try the Scatter and Reassemble buttons.'],
    ['From large to small','Enter the imagined wood, explore it and return to the planet.'],
    ['Artworks meet','Observe the transition between colours and forms from neighbouring works.'],
    ['A living landscape','Observe the slow movement of the forms.'],
    ['A conversation with the avant-gardes','View the composition and open the proposed note.'],
    ['Starting from a real sculpture','Compare the interpreted form with the Casa Montico photograph.'],
    ['Changing sound','Listen to the background in different places, with headphones if possible.'],
    ['Map and guided route','Use the map to reach an idea or start the guided circuit.']
  ];
  const no=it?'Non provato':'Not tried';
  questions.forEach(([title,detail],index)=>{
    const fs=document.createElement('fieldset'),legend=document.createElement('legend'),p=document.createElement('p'),ratings=document.createElement('div');ratings.className='rating';legend.textContent=String(index+1).padStart(2,'0')+'. '+title;p.textContent=detail;fs.append(legend,p,ratings);
    [[1,'1'],[2,'2'],[3,'3'],[4,'4'],[5,'5'],['not_tried',no]].forEach(([value,label])=>{const wrap=document.createElement('label'),input=document.createElement('input');input.type='radio';input.name='q'+(index+1);input.value=String(value);wrap.append(input,document.createTextNode(label));ratings.appendChild(wrap);});list.appendChild(fs);
  });
  function save(){try{localStorage.setItem(storageKey,JSON.stringify(Object.fromEntries(new FormData(form).entries())));}catch(error){/* The form also works without local storage. */}}
  try{const saved=JSON.parse(localStorage.getItem(storageKey)||'{}');for(const [name,value] of Object.entries(saved)){
    const controls=form.elements.namedItem(name);if(!controls)continue;controls.value=value;
  }}catch(error){/* Ignore unavailable or invalid local drafts. */}
  form.addEventListener('input',save);form.addEventListener('change',save);
  form.addEventListener('reset',()=>setTimeout(()=>{try{localStorage.removeItem(storageKey);}catch(error){/* Optional storage. */}document.getElementById('result').hidden=true;document.getElementById('summary').value='';},0));
  function selected(name){const el=form.elements.namedItem(name);return el?el.value:'';}
  function summary(){
    const lines=[it?'QUESTIONARIO · IL PIANETA, LABORATORIO DI IDEE':'QUESTIONNAIRE · THE PLANET, LABORATORY OF IDEAS',''];
    if(selected('name').trim())lines.push((it?'Nome: ':'Name: ')+selected('name').trim(),'');
    lines.push(it?'Impatto delle idee (1 = poco, 5 = molto):':'Impact of the ideas (1 = little, 5 = a lot):');
    questions.forEach(([title],index)=>{const value=selected('q'+(index+1));lines.push((index+1)+'. '+title+': '+(value==='not_tried'?no:value||'-'));});
    const fields=it?[
      ['comparison','Confronto con il pianeta precedente'],['sky','Preferenza per il cielo'],['sky_notes','Commenti su cielo e ombre'],['comfort','Facilità di movimento'],['sound','Volume del suono'],['liked','Cosa ha avuto più impatto?'],['confusing','Cosa era confuso o distraente?'],['next','Cosa cambieresti o svilupperesti?']
    ]:[
      ['comparison','Comparison with the earlier planet'],['sky','Sky preference'],['sky_notes','Comments on sky and shadows'],['comfort','Ease of movement'],['sound','Sound level'],['liked','What had the most impact?'],['confusing','What was confusing or distracting?'],['next','What would you change or develop?']
    ];
    lines.push('');fields.forEach(([name,label])=>{const control=form.elements.namedItem(name),raw=selected(name).trim(),value=control&&control.tagName==='SELECT'&&raw?control.options[control.selectedIndex].text:raw;if(value)lines.push(label+': '+value,'');});return lines.join('\n');
  }
  form.addEventListener('submit',event=>{event.preventDefault();save();document.getElementById('summary').value=summary();document.getElementById('result').hidden=false;document.getElementById('summary').focus();document.getElementById('result').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});});
  document.getElementById('copy').addEventListener('click',async()=>{const box=document.getElementById('summary'),status=document.getElementById('copyStatus');
    try{await navigator.clipboard.writeText(box.value);status.textContent=it?'Copiato. Ora puoi incollare le risposte in un messaggio.':'Copied. You can now paste the answers into a message.';}
    catch(error){box.focus();box.select();status.textContent=it?'Seleziona e copia il testo qui sopra.':'Select and copy the text above.';}
  });
})();
