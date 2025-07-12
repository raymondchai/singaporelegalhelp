'use client';

import { useEffect } from 'react';

export default function DevCacheCleaner() {
  useEffect(() => {
    // Only run in development and disable all console output for production-like experience
    if (process.env.NODE_ENV !== 'development') return;

    const clearDevelopmentCache = async () => {
      try {
        // Silent cache cleanup - no console spam

        // Clear service workers silently
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(
            registrations.map(async (registration) => {
              await registration.unregister();
            })
          );
        }

        // Clear caches silently
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(async (cacheName) => {
              await caches.delete(cacheName);
            })
          );
        }

        // Clear problematic localStorage silently (but keep our cleanup flags)
        const localStorageKeys = Object.keys(localStorage);
        localStorageKeys.forEach(key => {
          // Keep our cleanup tracking flags and user preferences
          if (!key.includes('cache_cleanup') && !key.includes('theme') && !key.includes('pwa')) {
            localStorage.removeItem(key);
          }
        });

        // Clear sessionStorage silently (but keep essential data)
        const sessionStorageKeys = Object.keys(sessionStorage);
        sessionStorageKeys.forEach(key => {
          // Keep essential session data
          if (!key.includes('pwa-install') && !key.includes('auth')) {
            sessionStorage.removeItem(key);
          }
        });

        // Clear IndexedDB silently
        if ('indexedDB' in window) {
          try {
            const databases = await indexedDB.databases();
            for (const db of databases) {
              if (db.name && !db.name.includes('supabase')) {
                indexedDB.deleteDatabase(db.name);
              }
            }
          } catch (error) {
            // Silent fail - no console output
          }
        }

        // Set flag to indicate cache was cleaned
        localStorage.setItem('cache_cleanup_performed', Date.now().toString());

      } catch (error) {
        // Silent error handling - no console spam
      }
    };

    // Only run cleanup once per session - no console warnings
    const lastCleanup = localStorage.getItem('cache_cleanup_performed');
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000); // 1 hour

    // Only run cleanup if it hasn't been done in the last hour - silently
    if (!lastCleanup || parseInt(lastCleanup) < oneHourAgo) {
      clearDevelopmentCache();
    }
    // No "skipping" message - silent operation
  }, []);

  // This component doesn't render anything
  return null;
}
