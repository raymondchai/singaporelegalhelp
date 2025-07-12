'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { SESSION_CONFIG, formatTime } from '@/lib/session-config';

export default function SessionManager() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showWarning, setShowWarning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(SESSION_CONFIG.warningTime);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  const handleSignOut = useCallback(async () => {
    await signOut();
    router.push('/auth/login?reason=session_expired');
  }, [signOut, router]);

  const extendSession = useCallback(() => {
    setShowWarning(false);
    setTimeLeft(SESSION_CONFIG.warningTime);
  }, []);

  const logoutNow = useCallback(async () => {
    await signOut();
    router.push('/auth/login?reason=manual_logout');
  }, [signOut, router]);

  useEffect(() => {
    if (!user) return;
    
    let inactivityTimer: NodeJS.Timeout;
    let warningTimer: NodeJS.Timeout;
    
    const resetTimers = () => {
      // Clear existing timers
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
      setShowWarning(false);
      
      // Show warning before logout
      warningTimer = setTimeout(() => {
        setShowWarning(true);
        setTimeLeft(SESSION_CONFIG.warningTime);
        
        // Start countdown
        countdownTimerRef.current = setInterval(() => {
          setTimeLeft(prev => {
            if (prev <= 1) {
              handleSignOut();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
      }, (SESSION_CONFIG.maxAge - SESSION_CONFIG.warningTime) * 1000);
      
      // Auto logout after max age
      inactivityTimer = setTimeout(() => {
        handleSignOut();
      }, SESSION_CONFIG.maxAge * 1000);
    };
    
    const handleActivity = () => {
      if (SESSION_CONFIG.extendOnActivity && !showWarning) {
        resetTimers();
      }
    };
    
    // Listen for user activity
    SESSION_CONFIG.activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
    });
    
    // Initialize timers
    resetTimers();
    
    return () => {
      // Cleanup
      clearTimeout(inactivityTimer);
      clearTimeout(warningTimer);
      if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
      SESSION_CONFIG.activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity);
      });
    };
  }, [user, showWarning, handleSignOut]);

  // Handle extend session
  const handleExtendSession = () => {
    if (countdownTimerRef.current) clearTimeout(countdownTimerRef.current);
    extendSession();
    // Activity handler will reset timers
    document.dispatchEvent(new Event('mousedown'));
  };
  
  if (!showWarning || !user) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="bg-orange-100 rounded-full p-2 mr-3">
            <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L3.349 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Session Expiring Soon</h3>
        </div>
        
        <p className="text-gray-600 mb-4">
          For your security, your session will expire in{' '}
          <span className="font-mono font-semibold text-red-600 text-lg">
            {formatTime(timeLeft)}
          </span>.
        </p>
        
        <p className="text-sm text-gray-500 mb-6">
          Click "Extend Session" to continue working, or "Logout Now" to sign out immediately.
        </p>
        
        <div className="flex gap-3">
          <button 
            onClick={handleExtendSession}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
          >
            Extend Session
          </button>
          <button 
            onClick={logoutNow}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-medium"
          >
            Logout Now
          </button>
        </div>
      </div>
    </div>
  );
}
