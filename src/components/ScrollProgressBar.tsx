import { useGSAPScrollProgress } from "@/hooks/useGSAP";

export const ScrollProgressBar = () => {
  useGSAPScrollProgress(".scroll-progress-bar");

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-[100] pointer-events-none">
      <div className="scroll-progress-bar h-full bg-primary origin-left scale-x-0" />
    </div>
  );
};
