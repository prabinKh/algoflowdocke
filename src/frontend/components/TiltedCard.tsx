import { useState, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "motion/react";
import { CachedImage } from "@/components/ui/cached-image";

interface TiltedCardProps {
  imageSrc: string;
  altText: string;
  captionText?: string;
  containerClassName?: string;
  imageClassName?: string;
  captionClassName?: string;
  rotateAmplitude?: number;
  scaleOnHover?: number;
  showMobileConfirmation?: boolean;
  showTooltip?: boolean;
  overlayContent?: React.ReactNode;
}

export default function TiltedCard({
  imageSrc,
  altText,
  captionText,
  containerClassName = "",
  imageClassName = "",
  captionClassName = "",
  rotateAmplitude = 25,
  scaleOnHover = 1.3,
  showTooltip = true,
  overlayContent = null,
}: TiltedCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [showCaption, setShowCaption] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(
    mouseYSpring,
    [-0.5, 0.5],
    [rotateAmplitude, -rotateAmplitude]
  );
  const rotateY = useTransform(
    mouseXSpring,
    [-0.5, 0.5],
    [-rotateAmplitude, rotateAmplitude]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setShowCaption(false);
  };

  const handleMouseEnter = () => {
    setShowCaption(true);
  };

  return (
    <div
      ref={ref}
      className={`relative w-full h-full [perspective:1000px] ${containerClassName}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: scaleOnHover }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className="relative w-full h-full"
      >
        <CachedImage
          src={imageSrc}
          alt={altText}
          className={`w-full h-full object-contain ${imageClassName}`}
          referrerPolicy="no-referrer"
        />

        {overlayContent && (
          <div className="absolute inset-0 pointer-events-none [transform:translateZ(50px)]">
            {overlayContent}
          </div>
        )}
      </motion.div>

      {showTooltip && showCaption && captionText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded text-xs whitespace-nowrap z-10 ${captionClassName}`}
        >
          {captionText}
        </motion.div>
      )}
    </div>
  );
}
