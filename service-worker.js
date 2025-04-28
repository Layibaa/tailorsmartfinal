// service-worker.js
import { registerRootComponent } from 'expo';

self.onpush = function (event) {
  const notificationData = event.data.json();
  self.registration.showNotification(notificationData.title, {
    body: notificationData.body,
    icon: notificationData.icon,
  });
};
