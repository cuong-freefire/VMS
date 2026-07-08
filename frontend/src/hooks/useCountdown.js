import { useState, useEffect, useCallback, useRef } from 'react';

export default function useCountdown() {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => { return () => clearInterval(intervalRef.current); }, []);

  useEffect(() => {
    if (seconds <= 0) { clearInterval(intervalRef.current); intervalRef.current = null; return; }
    if (!intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setSeconds((s) => { if (s <= 1) { clearInterval(intervalRef.current); intervalRef.current = null; return 0; } return s - 1; });
      }, 1000);
    }
  }, [seconds]);

  const start = useCallback((s) => { clearInterval(intervalRef.current); intervalRef.current = null; setSeconds(Math.max(0, Math.floor(s))); }, []);
  const reset = useCallback(() => { clearInterval(intervalRef.current); intervalRef.current = null; setSeconds(0); }, []);

  return { seconds, isActive: seconds > 0, start, reset };
}
