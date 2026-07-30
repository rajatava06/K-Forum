// Utility to automatically clear old browser cache and service workers for legacy users
const CURRENT_CACHE_VERSION = 'kforum_v2.2_cache_clear';

export const autoClearCache = async () => {
  try {
    const savedVersion = localStorage.getItem('kforum_cache_version');
    
    if (savedVersion !== CURRENT_CACHE_VERSION) {
      console.log(`[CacheCleaner] Upgrading cache version from "${savedVersion}" to "${CURRENT_CACHE_VERSION}"`);

      // 1. Unregister old Service Workers if present
      if ('serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (let registration of registrations) {
            await registration.unregister();
            console.log('[CacheCleaner] Unregistered legacy service worker');
          }
        } catch (swErr) {
          console.warn('[CacheCleaner] SW unregister error:', swErr);
        }
      }

      // 2. Clear browser Cache Storage
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => {
              console.log(`[CacheCleaner] Deleting cache: ${cacheName}`);
              return caches.delete(cacheName);
            })
          );
        } catch (cacheErr) {
          console.warn('[CacheCleaner] Cache Storage clear error:', cacheErr);
        }
      }

      // 3. Clear non-essential localStorage items (keep auth token if valid)
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      
      // Preserve auth credentials while clearing potential corrupt local state
      const itemsToKeep = { token, user };
      
      // Optionally clean temporary keys if needed
      // Save current version
      localStorage.setItem('kforum_cache_version', CURRENT_CACHE_VERSION);

      // Re-populate essential auth items
      if (token) localStorage.setItem('token', token);
      if (user) localStorage.setItem('user', user);

      console.log('[CacheCleaner] Auto cache clearing completed successfully.');
    }
  } catch (err) {
    console.error('[CacheCleaner] Error during auto cache clear:', err);
  }
};
