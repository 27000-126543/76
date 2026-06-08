import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  duration?: number;
  decimals?: number;
  startOnMount?: boolean;
}

export function useCountUp(
  endValue: number,
  options: UseCountUpOptions = {},
): number {
  const { duration = 1000, decimals = 0, startOnMount = true } = options;
  const [displayValue, setDisplayValue] = useState(0);
  const startValueRef = useRef(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const easeOutExpo = (t: number): number => {
    return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
  };

  const animate = (timestamp: number) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp;
    }

    const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
    const easedProgress = easeOutExpo(progress);
    const currentValue =
      startValueRef.current + (endValue - startValueRef.current) * easedProgress;

    setDisplayValue(Number(currentValue.toFixed(decimals)));

    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    }
  };

  useEffect(() => {
    if (!startOnMount) return;

    startValueRef.current = displayValue;
    startTimeRef.current = null;

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [endValue, startOnMount]);

  return displayValue;
}
