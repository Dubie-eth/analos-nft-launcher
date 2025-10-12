// Aggressively disable WebSocket connections at the browser level
(function() {
  'use strict';
  
  console.log('🚫 Disabling WebSocket connections for security');
  
  // Override WebSocket constructor
  if (typeof WebSocket !== 'undefined') {
    const OriginalWebSocket = WebSocket;
    
    window.WebSocket = function(url, protocols) {
      console.log('🚫 WebSocket connection blocked:', url);
      throw new Error('WebSocket connections are disabled for security. Use HTTP RPC only.');
    };
    
    // Copy static properties
    Object.setPrototypeOf(window.WebSocket, OriginalWebSocket);
    Object.defineProperty(window.WebSocket, 'prototype', {
      value: OriginalWebSocket.prototype,
      writable: false
    });
  }
  
  // Also block EventSource (Server-Sent Events)
  if (typeof EventSource !== 'undefined') {
    const OriginalEventSource = EventSource;
    
    window.EventSource = function(url, eventSourceInitDict) {
      console.log('🚫 EventSource connection blocked:', url);
      throw new Error('EventSource connections are disabled for security.');
    };
    
    Object.setPrototypeOf(window.EventSource, OriginalEventSource);
    Object.defineProperty(window.EventSource, 'prototype', {
      value: OriginalEventSource.prototype,
      writable: false
    });
  }
  
  console.log('✅ WebSocket and EventSource blocked successfully');
})();
