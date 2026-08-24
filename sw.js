/* Paralelo — service worker
   Estrategia:
   - App shell (html/manifest/icono): network-first con respaldo en caché,
     para que una versión nueva llegue apenas haya señal, pero la app abra igual sin datos.
   - APIs de tasas: NO se cachean aquí. La app ya guarda las últimas tasas en localStorage
     y las muestra con su antigüedad, que es más honesto que servir un JSON viejo como si fuera fresco. */
var CACHE = 'paralelo-v2';
var SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(SHELL); }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.map(function(k){ return k===CACHE?null:caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if(req.method !== 'GET') return;

  var url = new URL(req.url);
  if(url.origin !== self.location.origin) return;   // las APIs las maneja la app

  e.respondWith(
    fetch(req).then(function(res){
      if(res && res.ok){
        var copia = res.clone();
        caches.open(CACHE).then(function(c){ c.put(req, copia); });
      }
      return res;
    }).catch(function(){
      return caches.match(req).then(function(hit){
        return hit || caches.match('./index.html');
      });
    })
  );
});

self.addEventListener('notificationclick', function(e){
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({type:'window', includeUncontrolled:true}).then(function(ls){
      for(var i=0;i<ls.length;i++){ if('focus' in ls[i]) return ls[i].focus(); }
      if(self.clients.openWindow) return self.clients.openWindow('./');
    })
  );
});
