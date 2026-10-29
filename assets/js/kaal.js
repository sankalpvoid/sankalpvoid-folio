/* An editorial sprite-state preview, not an Electron bridge or microphone. */
(() => {
 const host=document.querySelector('[data-kaal-presence]');if(!host)return;
 const bird=host.querySelector('.kaal-sprite'),label=host.querySelector('[data-kaal-state]');
 const states={quiet:{pos:'0px 0px',text:'Quiet · the default presence'},listening:{pos:'0px -256px',text:'Listening · only when invited'},thinking:{pos:'-256px -256px',text:'Attentive · while a reply is prepared'}};
 host.querySelectorAll('[data-kaal-state-to]').forEach(button=>button.addEventListener('click',()=>{
  const state=states[button.dataset.kaalStateTo];bird.style.backgroundPosition=state.pos;label.textContent=state.text;
  host.querySelectorAll('[data-kaal-state-to]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
 }));
})();
