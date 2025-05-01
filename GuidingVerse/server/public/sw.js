// public/sw.js

console.log('[Service Worker] Loaded.');

// Listener for receiving push messages
self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  
  // Default data (can be overridden by push payload)
  let notificationData = {
    title: 'GuidingVerse',
    body: 'You have a new notification.',
    icon: '/icons/icon-192x192.png' // Default icon path (adjust if needed)
  };

  // Try to parse payload data sent from the server
  if (event.data) {
    try {
      const payload = event.data.json();
      console.log('[Service Worker] Push data:', payload);
      // Merge payload data with defaults
      notificationData = { ...notificationData, ...payload }; 
    } catch (e) {
      console.error('[Service Worker] Error parsing push data:', e);
      notificationData.body = event.data.text(); // Fallback to plain text if JSON fails
    }
  } else {
      console.log('[Service Worker] Push event but no data');
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon, // Path relative to origin
    badge: '/icons/icon-96x96.png', // Optional: Small icon for notification bar (adjust path)
    vibrate: [100, 50, 100], // Optional vibration pattern
    data: { // Can pass data to notification click handler
      url: notificationData.url || '/' // Default URL to open on click
    }
    // Add other options like actions if needed
    // actions: [
    //   { action: 'explore', title: 'Explore' },
    // ]
  };

  // Keep the service worker alive until the notification is shown
  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Listener for notification click
self.addEventListener('notificationclick', event => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close(); // Close the notification

  // Open the app or a specific URL
  const urlToOpen = event.notification.data.url || '/';

  // Check if the client window/tab is already open and focus it
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then(clientList => {
      for (let i = 0; i < clientList.length; i++) {
        let client = clientList[i];
        // Check if the client's URL matches the target (or just focus any open client)
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // If no matching client is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Optional: Add other listeners like 'activate', 'install' if needed
self.addEventListener('install', event => {
  console.log('[Service Worker] Install event');
  // Perform install steps, like caching assets
  // self.skipWaiting(); // Optional: Force activation immediately
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] Activate event');
  // Perform activate steps, like cleaning up old caches
  // event.waitUntil(clients.claim()); // Optional: Take control of clients immediately
}); 