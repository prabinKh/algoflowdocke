import { useEffect, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register ScrollTrigger globally
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

export const useGSAPReveal = (
  scope: React.RefObject<HTMLElement | null>,
  selector: string,
  vars: gsap.TweenVars = { opacity: 0, y: 50, duration: 1, ease: 'power3.out' },
  scrollTriggerOptions: Partial<ScrollTrigger.Vars> = {}
) => {
  // Use stringified versions for stable dependencies
  const varsString = JSON.stringify(vars);
  const optionsString = JSON.stringify(scrollTriggerOptions);

  useLayoutEffect(() => {
    if (!scope.current || !ScrollTrigger) return;

    const ctx = gsap.context(() => {
      // Ensure the selector exists within the scope
      const elements = scope.current?.querySelectorAll(selector);
      if (!elements || elements.length === 0) return;

      gsap.from(selector, {
        ...vars,
        scrollTrigger: {
          trigger: selector,
          start: 'top 85%',
          toggleActions: 'play none none none',
          ...scrollTriggerOptions,
        },
      });
    }, scope.current);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, selector, varsString, optionsString]);
};

export const useGSAPParallax = (
  scope: React.RefObject<HTMLElement | null>,
  selector: string,
  yPercent: number = 20,
  scrollTriggerOptions: Partial<ScrollTrigger.Vars> = {}
) => {
  const optionsString = JSON.stringify(scrollTriggerOptions);

  useLayoutEffect(() => {
    if (!scope.current || !ScrollTrigger) return;

    const ctx = gsap.context(() => {
      // Ensure the selector exists within the scope
      const elements = scope.current?.querySelectorAll(selector);
      if (!elements || elements.length === 0) return;

      gsap.to(selector, {
        yPercent: yPercent,
        ease: 'none',
        scrollTrigger: {
          trigger: selector,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          ...scrollTriggerOptions,
        },
      });
    }, scope.current);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scope, selector, yPercent, optionsString]);
};

export const useGSAPScrollProgress = (
  progressBarSelector: string
) => {
  useLayoutEffect(() => {
    if (!ScrollTrigger) return;

    const ctx = gsap.context(() => {
      gsap.to(progressBarSelector, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: 'body',
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0.3,
        },
      });
    });

    return () => ctx.revert();
  }, [progressBarSelector]);
};

export { ScrollTrigger };
export default gsap;
