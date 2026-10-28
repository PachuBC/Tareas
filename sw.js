/* Service worker: guarda la app y la librería de voz para uso sin conexión.
   Si cambias algún archivo, sube también el número de CACHE para que el móvil lo actualice. */
var CACHE='tareas-v2',SHELL=['./','index.html','voz.js','manifest.webmanifest','icon-192.png','icon-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(SHELL)}));self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==CACHE}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){
 if(e.request.method!=='GET')return;
 var u=new URL(e.request.url);
 if(u.origin!==location.origin&&u.hostname!=='cdn.jsdelivr.net')return;
 e.respondWith(caches.match(e.request).then(function(h){return h||fetch(e.request).then(function(r){if(r.ok){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,cp)})}return r})}))});
