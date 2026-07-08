import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import gsap, { ScrollTrigger } from '@/hooks/useGSAP';

export const SmoothScroll = ({ children }: { children: React.ReactNode }) => {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;

    // Synchronize ScrollTrigger with Lenis
    const handleScroll = () => {
      if (ScrollTrigger) {
        ScrollTrigger.update();
      }
    };

    lenis.on('scroll', handleScroll);

    // Use GSAP ticker for smooth animation frame updates
    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(updateLenis);
      lenis.off('scroll', handleScroll);
    };
  }, []);

  return <>{children}</>;
};
