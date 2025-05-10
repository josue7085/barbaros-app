// /home/sandoval7085/Mi-App/sw.js
const CACHE_NAME = 'barbaros-cache-v1';
const urlsToCache = [
  '/', // Importante para la raíz de tu sitio
  'index.html',
  'styles.css',
  // Si tienes archivos JavaScript externos, añádelos aquí.
  // Ejemplo: 'scripts/main.js',
  'manifest.json', // También es bueno cachear el manifest
  'images/logo.PNG',
  'images/login-background.jpg',
  // URLs de CDNs (opcional, pero puede ayudar si la CDN falla)
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  // Iconos que quieres que estén disponibles offline (los que usas en tu manifest)
  'images/logo-192x192.png', // Asegúrate de tener estos iconos
  'images/logo-512x512.png'  // Asegúrate de tener estos iconos
  // Añade aquí las rutas a los otros iconos que definiste en el manifest.json si lo deseas
];

// Evento 'install': se dispara cuando el Service Worker se instala por primera vez.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache abierto y archivos principales cacheados');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Falló el cacheo de archivos durante la instalación:', error);
        // Es importante manejar este error, si un archivo de urlsToCache falla, la instalación del SW falla.
        // Podrías intentar cachear individualmente y loguear errores por archivo.
      })
  );
});

// Evento 'fetch': se dispara cada vez que la página solicita un recurso.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Si el recurso está en caché, lo devuelve desde la caché.
        if (response) {
          return response;
        }
        // Si no, lo busca en la red.
        return fetch(event.request).then(
          networkResponse => {
            // Opcional: Cachear dinámicamente nuevos recursos que no estaban en urlsToCache
            // Solo cachear respuestas GET válidas
            if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
              // No cachear recursos de extensiones de Chrome
              if (!event.request.url.startsWith('chrome-extension://')) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then(cache => {
                    cache.put(event.request, responseToCache);
                  });
              }
            }
            return networkResponse;
          }
        ).catch(error => {
          console.error('Error en fetch y no se encontró en caché:', event.request.url, error);
          // Podrías devolver una página offline genérica aquí si lo deseas
          // Por ejemplo: return caches.match('/offline.html');
        });
      })
  );
});

// Evento 'activate': se dispara cuando el Service Worker se activa.
// Es un buen lugar para limpiar cachés antiguas.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME]; // Solo queremos mantener la caché actual
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Borrando caché antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});