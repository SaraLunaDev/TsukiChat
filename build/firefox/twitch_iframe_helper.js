(function () {
    'use strict';
    // This script runs inside the Twitch embed iframe (cross-origin, embedded in youtube.com).
    // Chrome 115+ partitions third-party localStorage by top-level site, so Twitch's auth
    // token (written by the OAuth popup in a first-party twitch.tv context) is invisible to
    // the iframe's partitioned storage bucket.
    // Calling requestStorageAccess() grants the iframe access to its *unpartitioned* storage,
    // allowing Twitch to read/write the auth token normally.
    // Chrome 120+ auto-grants this if the user has previously visited twitch.tv directly.
    if (window.top === window.self) return; // only in iframe context
    if (typeof document.requestStorageAccess !== 'function') return;
    document.requestStorageAccess().catch(function () {});
})();
