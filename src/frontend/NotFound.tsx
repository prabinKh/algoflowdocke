import { useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useGSAPReveal } from "@/hooks/useGSAP";

const NotFound = () => {
  const location = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, scale: 0.9, duration: 0.8, stagger: 0.1 });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted" ref={containerRef}>
      <div className="text-center gsap-reveal">
        <h1 className="mb-4 text-6xl font-display font-bold text-primary">404</h1>
        <p className="mb-6 text-xl text-muted-foreground font-display">Oops! Page not found</p>
        <a href="/" className="btn-primary inline-flex">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
