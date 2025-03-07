importScripts('https://cdnjs.cloudflare.com/ajax/libs/pako/2.0.4/pako.min.js');

self.onmessage = function (e) {
    const buffer = e.data;
    const decompressed = pako.ungzip(new Uint8Array(buffer), { to: 'string' });
    self.postMessage(JSON.parse(decompressed));
};
