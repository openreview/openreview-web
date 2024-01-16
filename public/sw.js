/* eslint-disable no-restricted-globals */

self.addEventListener('install', (e) => {
  console.log('[Service Worker] install')
})

self.addEventListener('fetch', (e) => {
  console.log('[Service Worker] fetch')
})

// Register event listener for the 'push' event
// self.addEventListener('push', (event) => {
//   // Keep the service worker alive until the notification is created.
//   event.waitUntil(
//     // Show a notification with title 'ServiceWorker Cookbook' and body 'Alea iacta est'.
//     // Set other parameters such as the notification language, a vibration pattern associated
//     // to the notification, an image to show near the body.
//     self.registration.showNotification('ServiceWorker Cookbook', {
//       lang: 'la',
//       body: 'Alea iacta est',
//       icon: 'caesar.jpg',
//       vibrate: [500, 100, 500],
//     })
//   )
// })

// Register event listener for the 'notificationclick' event
// See https://github.com/mdn/serviceworker-cookbook/blob/master/push-clients/service-worker.js
// self.addEventListener('notificationclick', (event) => {
//   event.waitUntil(
//     // Retrieve a list of the clients of this service worker
//     self.clients.matchAll().then((clientList) => {
//       // If there is at least one client, focus it.
//       if (clientList.length > 0) {
//         return clientList[0].focus()
//       }

//       // Otherwise, open a new page.
//       return self.clients.openWindow('/')
//     })
//   )
// })
