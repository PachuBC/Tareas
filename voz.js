/* Dictado local: Whisper (Xenova/whisper-base, cuantizado) ejecutado en el propio navegador con transformers.js.
   El audio no se envía a ningún sitio ni se guarda. Solo se descargan la librería (jsdelivr) y el modelo (Hugging Face), una vez. */
(function(){
var LIB='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1',MODEL='Xenova/whisper-base';
var rec=null,chunks=[],stream=null,busy=false,asr=null,msg='';
function st(t){msg=t;var e=document.getElementById('vs');if(e)e.textContent=t}
function paint(){var b=document.getElementById('mic');if(b){b.textContent=rec?'⏹ Detener':'🎤 Dictar';b.disabled=busy}var e=document.getElementById('vs');if(e)e.textContent=msg}
async function load(){
 if(asr)return asr;
 st('Cargando el modelo de voz (solo la primera vez)…');
 var T=await import(LIB);T.env.allowLocalModels=false;
 asr=await T.pipeline('automatic-speech-recognition',MODEL,{dtype:'q8',device:'wasm',progress_callback:function(p){if(p.status==='progress'&&p.progress!=null)st('Descargando modelo: '+Math.round(p.progress)+' %')}});
 return asr}
async function start(){
 if(!navigator.mediaDevices||!window.MediaRecorder){st('Este navegador no permite grabar. Escribe el título.');return}
 try{stream=await navigator.mediaDevices.getUserMedia({audio:true})}catch(e){st('No hay acceso al micrófono. Escribe el título.');return}
 chunks=[];rec=new MediaRecorder(stream);
 rec.ondataavailable=function(e){if(e.data.size)chunks.push(e.data)};
 rec.onstop=transcribe;rec.start();st('Grabando… pulsa Detener al terminar.');paint()}
async function transcribe(){
 var blob=new Blob(chunks,{type:rec.mimeType});chunks=[];stream.getTracks().forEach(function(t){t.stop()});rec=null;busy=true;paint();
 try{
  var ctx=new AudioContext({sampleRate:16000});
  var buf=await ctx.decodeAudioData(await blob.arrayBuffer());ctx.close();
  var m=await load();st('Transcribiendo…');
  var r=await m(buf.getChannelData(0),{language:'spanish',task:'transcribe'});
  var t=(r.text||'').trim();
  if(!t)st('No he entendido nada. Repite o escribe el título.');
  else if(window.V&&V.draft){V.draft.title=t;V.draft.src='voz';msg='Revisa el título y guarda.';render()}
 }catch(e){st('Falló el reconocimiento. Repite o escribe el título.')}
 busy=false;paint()}
window.Voz={toggle:function(){if(busy)return;rec?rec.stop():start()},paint:paint};
})();
