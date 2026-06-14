import { Platform } from 'react-native';
import { decode, encode } from 'base-64';

const G = typeof global !== 'undefined' ? global : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : {};

// Basic polyfills for Firebase
if (typeof G.btoa === 'undefined') {
  G.btoa = encode;
}
if (typeof G.atob === 'undefined') {
  G.atob = decode;
}

// WebSocket Fix for React Native 0.80+
if (Platform.OS !== 'web') {
  try {
    const RNWebSocket = require('react-native/Libraries/WebSocket/WebSocket');
    const ActualWS = (RNWebSocket && RNWebSocket.default) ? RNWebSocket.default : RNWebSocket;

    // Some envs define WebSocket as an object, breaking the constructor call
    if (typeof G.WebSocket !== 'function' && ActualWS) {
      G.WebSocket = ActualWS;
    }
  } catch (e) {
    // Ignore errors here to avoid crashing before main app loads
  }
}
