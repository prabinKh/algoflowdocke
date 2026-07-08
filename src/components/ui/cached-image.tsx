import React, { useState, useEffect } from 'react';
import { motion, type HTMLMotionProps } from 'motion/react';

interface CachedImageProps extends HTMLMotionProps<'img'> {
  src: string;
  alt: string;
  fallback?: string;
}

const CACHE_NAME = 'image-cache-v1';

export const CachedImage: React.FC<CachedImageProps> = ({ src, alt, fallback, ...props }) => {
  const [imgSrc, setImgSrc] = useState<string>(src);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!src) return;

      // Only try to cache external images
      if (!src.startsWith('http')) {
        if (isMounted) {
          setImgSrc(src);
          setLoading(false);
        }
        return;
      }

      try {
        const cache = await window.caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(src);

        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          const objectUrl = URL.createObjectURL(blob);
          if (isMounted) {
            setImgSrc(objectUrl);
            setLoading(false);
          }
          return;
        }

        // Not in cache, try to fetch and cache
        // Use a timeout to avoid hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(src, { 
          signal: controller.signal 
        });
        clearTimeout(timeoutId);

        if (!response.ok) throw new Error('Failed to fetch image');

        // Only cache valid CORS responses (not opaque ones)
        if (response.type === 'basic' || response.type === 'cors') {
          try {
            const responseClone = response.clone();
            await cache.put(src, responseClone);
          } catch (putError) {
            // Silently ignore cache put errors (e.g. disk full, network error during write)
          }
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        if (isMounted) {
          setImgSrc(objectUrl);
          setLoading(false);
        }
      } catch (error) {
        // Silently fail and use original src if caching fails (likely CORS or network)
        if (isMounted) {
          setImgSrc(src);
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [src, fallback]);

  useEffect(() => {
    return () => {
      if (imgSrc.startsWith('blob:')) {
        URL.revokeObjectURL(imgSrc);
      }
    };
  }, [imgSrc]);

  return (
    <motion.img
      {...props}
      src={imgSrc}
      alt={alt}
      onError={() => {
        if (fallback && imgSrc !== fallback) {
          setImgSrc(fallback);
        }
      }}
      style={{
        ...props.style,
        opacity: loading ? 0.5 : 1,
        transition: 'opacity 0.3s ease-in-out',
      }}
    />
  );
};
