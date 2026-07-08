import React, { createContext, useContext, useEffect, useState } from 'react';
import { type Company } from '@/lib/types';
import { companyService } from '@/api/companyService';
import { safeStorage } from '@/lib/storage';

interface StoreContextType {
  companySlug?: string;
  company?: Company | null;
  loading: boolean;
}

const StoreContext = createContext<StoreContextType>({ 
  companySlug: undefined, 
  company: null, 
  loading: true 
});

export const useStore = () => useContext(StoreContext);

// Helper to convert hex to HSL for CSS variable injection
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0;
    const l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

// Helper to determine if a color is dark or light
function getLuminance(hex: string): number {
  hex = hex.replace(/^#/, '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export const StoreProvider: React.FC<{ companySlug?: string, company?: Company | null, children: React.ReactNode }> = ({ 
  companySlug: initialSlug, 
  company: initialCompany, 
  children 
}) => {
  const [company, setCompany] = useState<Company | null>(initialCompany || null);
  const [companySlug, setCompanySlug] = useState<string | undefined>(initialSlug);
  const [loading, setLoading] = useState(!initialCompany);

  useEffect(() => {
    if (initialCompany) {
      setCompany(initialCompany);
      setCompanySlug(initialSlug);
      setLoading(false);
      return;
    }

    async function loadCurrentCompany() {
      try {
        const hostname = window.location.hostname;
        const parts = hostname.split('.');
        if (parts.length > 1 && parts[parts.length - 1] === 'localhost') {
          const subdomain = parts[0];
          if (subdomain && subdomain !== 'www') {
            safeStorage.setItem('current_company_slug', subdomain);
          }
        }

        const params = new URLSearchParams(window.location.search);
        const querySlug = params.get('company');
        if (querySlug) {
          safeStorage.setItem('current_company_slug', querySlug);
        }
        const activeCompany = await companyService.getCurrentCompany();
        if (activeCompany) {
          setCompany(activeCompany);
          setCompanySlug(activeCompany.slug);
        }
      } catch (error) {
        console.error("Failed to load active tenant company:", error);
      } finally {
        setLoading(false);
      }
    }

    loadCurrentCompany();
  }, [initialCompany, initialSlug]);

  useEffect(() => {
    if (company) {
      const style = document.documentElement.style;
      
      if (company.theme_color) {
        try {
          const hsl = hexToHsl(company.theme_color);
          style.setProperty('--primary', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
          style.setProperty('--ring', `${hsl.h} ${hsl.s}% ${hsl.l}%`);
          
          // Determine contrast for primary foreground
          const luminance = getLuminance(company.theme_color);
          style.setProperty('--primary-foreground', luminance > 0.6 ? '0 0% 0%' : '0 0% 100%');
        } catch (err) {
          console.error("Failed to parse primary theme color:", err);
        }
      }

      if (company.theme_color_secondary) {
        try {
          const hslS = hexToHsl(company.theme_color_secondary);
          style.setProperty('--secondary', `${hslS.h} ${hslS.s}% ${hslS.l}%`);
          
          const lumS = getLuminance(company.theme_color_secondary);
          style.setProperty('--secondary-foreground', lumS > 0.6 ? '0 0% 0%' : '0 0% 100%');
        } catch (err) {
          console.error("Failed to parse secondary theme color:", err);
        }
      }
    }
  }, [company]);

  return (
    <StoreContext.Provider value={{ companySlug, company, loading }}>
      {children}
    </StoreContext.Provider>
  );
};
