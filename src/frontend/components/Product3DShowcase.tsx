import React, { useState, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stage, useGLTF, PresentationControls } from '@react-three/drei';
import { CachedImage } from '@/components/ui/cached-image';

interface Product3DShowcaseProps {
  mainImage: string;
  additionalImages?: string[];
  model3D?: string;
}

const Model = ({ url }: { url: string }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
};

export const Product3DShowcase: React.FC<Product3DShowcaseProps> = ({ mainImage, additionalImages = [], model3D }) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Total frames for the rotation
  const totalFrames = 30;
  
  const frames = additionalImages.length >= totalFrames 
    ? additionalImages.slice(0, totalFrames) 
    : Array.from({ length: totalFrames }, (_, i) => mainImage);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (model3D || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    const percentage = Math.max(0, Math.min(1, x / width));
    const frameIndex = Math.floor(percentage * (totalFrames - 1));
    
    if (frameIndex !== currentFrame) {
      setCurrentFrame(frameIndex);
    }
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto py-12 px-4">
      <div className="mb-8 flex flex-col items-center text-center">
        <span className="text-primary text-[10px] font-mono uppercase tracking-[0.3em] mb-2">Interactive Experience</span>
        <h2 className="text-3xl font-display font-bold tracking-tight text-foreground">
          {model3D ? "Immersive 3D Model" : "360° Product View"}
        </h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-md">
          {model3D 
            ? "Interact with the 3D model directly. Rotate, zoom, and explore every angle." 
            : "Move your mouse over the product to rotate it 360° and explore every detail."}
        </p>
      </div>

      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        className={`relative mx-auto w-full aspect-[16/10] max-w-4xl group ${model3D ? "" : "cursor-ew-resize"}`}
      >
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-3xl border border-white/10 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            
            <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-12">
              {model3D ? (
                <Canvas dpr={[1, 2]} shadows camera={{ fov: 45 }}>
                  <Suspense fallback={null}>
                    <PresentationControls 
                      speed={1.5} 
                      global 
                      zoom={0.7} 
                      polar={[-0.1, Math.PI / 4]}
                    >
                      <Stage environment="city" intensity={0.6} contactShadow={false}>
                        <Model url={model3D} />
                      </Stage>
                    </PresentationControls>
                  </Suspense>
                </Canvas>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentFrame}
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1 }}
                    className="relative w-full h-full flex items-center justify-center"
                  >
                    <CachedImage 
                      src={frames[currentFrame]} 
                      alt={`Product Frame ${currentFrame}`}
                      className="max-w-full max-h-full object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
                      referrerPolicy="no-referrer"
                      style={{
                        transform: additionalImages.length < totalFrames 
                          ? `rotateY(${(currentFrame - 15) * 2}deg) scale(${1 + Math.abs(currentFrame - 15) * 0.005})` 
                          : 'none',
                        filter: `brightness(${1 - Math.abs(currentFrame - 15) * 0.01})`
                      }}
                    />
                  </motion.div>
                </AnimatePresence>
              )}

              {!model3D && (
                <div className="absolute bottom-6 right-8 font-mono text-[10px] text-white/30 tracking-widest uppercase">
                  Frame {currentFrame + 1} / {totalFrames}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer frame elements removed for a cleaner look */}

        {!isHovering && !model3D && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none"
          >
            <div className="bg-card/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full flex items-center gap-3 shadow-2xl">
              <div className="flex gap-1">
                <motion.div 
                  animate={{ x: [-5, 5, -5] }} 
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-1 h-1 bg-card rounded-full" 
                />
                <div className="w-1 h-1 bg-card/30 rounded-full" />
                <div className="w-1 h-1 bg-card/30 rounded-full" />
              </div>
              <span className="text-white text-xs font-bold uppercase tracking-widest">Slide to Rotate</span>
            </div>
          </motion.div>
        )}
      </div>

      {!model3D && (
        <div className="mt-16 w-full overflow-hidden opacity-50 hover:opacity-100 transition-opacity duration-500">
          <div className="flex gap-2 justify-center">
            {Array.from({ length: 15 }).map((_, i) => (
              <div 
                key={i}
                className={`w-12 aspect-[4/3] rounded-sm border transition-all duration-300 ${currentFrame === i * 2 ? 'border-primary scale-110 bg-primary/10' : 'border-white/10 grayscale'}`}
              >
                <CachedImage 
                  src={mainImage} 
                  className="w-full h-full object-cover opacity-50" 
                  alt="strip"
                  referrerPolicy="no-referrer"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Product3DShowcase;
