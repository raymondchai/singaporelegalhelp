export const SESSION_CONFIG = {
  maxAge: 60 * 60, // 1 hour in seconds
  warningTime: 10 * 60, // Show warning 10 minutes before expiry (10 minutes in seconds)
  extendOnActivity: true,
  activityEvents: ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'],
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
