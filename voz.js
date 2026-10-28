/* Dictado local: Whisper (Xenova/whisper-small, cuantizado) ejecutado en el propio navegador con transformers.js.
   El audio no se envía a ningún sitio ni se guarda. Solo se descargan la librería (jsdelivr) y el modelo (Hugging Face), una vez. */
(function(){
var LIB='https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1',MODEL='Xenova/whisper-small';
var rec=null,chunks=[],stream=null,busy=false,asr=null,msg='';
/* Corrección fija de fechas habladas (sin IA): solo actúa cuando hay un número junto a un mes. */
var MES='enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre';
var DIAS=['lunes','martes','miércoles','jueves','viernes','sábado','domingo'];
var NUM={uno:1,primero:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,dieciseis:16,diecisiete:17,dieciocho:18,diecinueve:19,veinte:20,veintiuno:21,veintidos:22,veintitres:23,veinticuatro:24,veinticinco:25,veintiseis:26,veintisiete:27,veintiocho:28,veintinueve:29,treinta:30,'treinta y uno':31};
function nrm(s){return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function lev(a,b){var d=[],i,j;for(i=0;i<=a.length;i++){d[i]=[i]}for(j=1;j<=b.length;j++)d[0][j]=j;
 for(i=1;i<=a.length;i++)for(j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return d[a.length][b.length]}
function fix(t){
 t=t.replace(new RegExp('(^|\\s)(\\p{L}+(?:\\s+y\\s+uno)?)(\\s+(?:de\\s+)?(?:'+MES+'))(?![\\p{L}])','giu'),function(m,pre,w,post){
  var n=NUM[nrm(w)];return n?pre+n+post:m});
 t=t.replace(new RegExp('(\\p{L}+)(,?\\s+\\d{1,2}(?:\\s+de)?\\s+(?:'+MES+'))(?![\\p{L}])','giu'),function(m,w,rest){
  var k=nrm(w);if(w.length<5)return m;var best=null,bd=3;
  DIAS.forEach(function(d){var x=lev(k,nrm(d));if(x<bd){bd=x;best=d}});
  if(!best||bd===0)return m;
  if(w[0]!==w[0].toLowerCase())best=best[0].toUpperCase()+best.slice(1);
  return best+rest});
 return t}

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
  var t=fix((r.text||'').trim());
  if(!t)st('No he entendido nada. Repite o escribe el título.');
  else if(window.V&&V.draft){V.draft.title=t;V.draft.src='voz';msg='Revisa el título y guarda.';render()}
 }catch(e){st('Falló el reconocimiento. Repite o escribe el título.')}
 busy=false;paint()}
window.Voz={toggle:function(){if(busy)return;rec?rec.stop():start()},paint:paint,fix:fix};
})();
