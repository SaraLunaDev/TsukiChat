(function () {
    'use strict';
    // This script runs inside the Twitch embed iframe (cross-origin, embedded in youtube.com).
    // Chrome 115+ partitions third-party storage by top-level site, so Twitch's auth token
    // (written in a first-party twitch.tv context) is invisible to the partitioned bucket.
    // requestStorageAccess() grants the iframe access to its *unpartitioned* storage.
    // Chrome 120+ may auto-grant if the user has sufficient engagement with twitch.tv.
    // If auto-grant fails, we wait for the first user click (a user gesture) to retry,
    // then reload so Twitch reinitialises with storage access and picks up the auth token.
    if (window.top === window.self) return;
    if (typeof document.requestStorageAccess !== 'function') return;

    // Prevent infinite reload loop after a successful grant
    if (sessionStorage.getItem('_tsuki_sar')) return;

    document.requestStorageAccess().catch(function () {
        // Auto-grant not available; wait for the first user interaction inside the iframe
        document.addEventListener('click', function onFirstClick() {
            document.removeEventListener('click', onFirstClick, true);
            document.requestStorageAccess()
                .then(function () {
                    // Got access via user gesture — reload so Twitch reads the auth state
                    sessionStorage.setItem('_tsuki_sar', '1');
                    window.location.reload();
                })
                .catch(function () {
                    // Denied even with user gesture; nothing more we can do from here
                });
        }, { capture: true, once: true });
    });
})();
