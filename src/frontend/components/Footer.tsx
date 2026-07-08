import { Link } from "react-router-dom";
import { Mail, Clock, MapPin, Phone, Facebook, Twitter, Instagram, Youtube, Linkedin } from "lucide-react";
import { useRef } from "react";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { useStore } from "@/frontend/context/StoreContext";

export const Footer = () => {
  const { company } = useStore();
  const footerRef = useRef<HTMLElement>(null);
  
  useGSAPReveal(footerRef, ".gsap-reveal", { opacity: 0, y: 30, duration: 0.8, stagger: 0.1 });

  const footer = company?.footer_settings;
  const locations = company?.store_locations?.filter(l => l.is_active) || [];

  const displayName = footer?.company_name || (company ? company.name : 'algoflow-e');
  const displayEmail = footer?.email || company?.email || 'contact@algoflow-e.com';
  const displayPhone = footer?.phone || company?.phone;
  const displayWeekday = footer?.opening_hours_weekday || 'Sun - Fri: 10AM - 7:30PM';
  const displayWeekend = footer?.opening_hours_weekend || 'Saturday: 11AM - 6PM';
  const showLocations = footer?.show_store_locations ?? true;
  const showInformation = footer?.show_information ?? true;
  const showPolicies = footer?.show_policies ?? true;
  const showCustomerService = footer?.show_customer_service ?? true;
  const locationTitle = footer?.location_title || 'Our Store Locations';

  const socialLinks = [
    { icon: Facebook, url: footer?.facebook_url, brand: 'facebook' },
    { icon: Twitter, url: footer?.twitter_url, brand: 'twitter' },
    { icon: Instagram, url: footer?.instagram_url, brand: 'instagram' },
    { icon: Youtube, url: footer?.youtube_url, brand: 'youtube' },
    { icon: Linkedin, url: footer?.linkedin_url, brand: 'linkedin' },
  ].filter(s => s.url);

  return (
    <footer ref={footerRef} className="bg-card border-t border-border text-muted-foreground mt-16 sm:mt-24">
      <div className="neo-container py-10 sm:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 gsap-reveal">
            <div className="text-3xl sm:text-4xl font-display font-bold tracking-tighter text-foreground mb-4">{displayName}</div>
            <div className="space-y-3 text-sm sm:text-base">
              <div className="flex items-center gap-2">
                <Mail size={14} className="shrink-0" />
                <span>{displayEmail}</span>
              </div>
              {displayPhone && (
                <div className="flex items-center gap-2">
                  <Phone size={14} className="shrink-0" />
                  <span>{displayPhone}</span>
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <Clock size={14} className="shrink-0" />
                <span>{displayWeekday}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="shrink-0" />
                <span>{displayWeekend}</span>
              </div>
            </div>

            {socialLinks.length > 0 && (
              <div className="flex items-center gap-4 mt-6">
                {socialLinks.map((social, i) => (
                  <a 
                    key={i} 
                    href={social.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all"
                  >
                    <social.icon size={16} />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Information */}
          {showInformation && (
            <div className="gsap-reveal">
              <h3 className="text-sm sm:text-base font-semibold uppercase tracking-wider text-foreground mb-3 sm:mb-4">Information</h3>
              <ul className="space-y-3 text-sm sm:text-base">
                <li><Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link to="/about" className="hover:text-foreground transition-colors">About Us</Link></li>
                <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact Us</Link></li>
              </ul>
            </div>
          )}

          {/* Policies */}
          {showPolicies && (
            <div className="gsap-reveal">
              <h3 className="text-sm sm:text-base font-semibold uppercase tracking-wider text-foreground mb-3 sm:mb-4">Policies</h3>
              <ul className="space-y-3 text-sm sm:text-base">
                <li><Link to="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
                <li><Link to="/return-policy" className="hover:text-foreground transition-colors">Return Policy</Link></li>
                <li><Link to="/terms" className="hover:text-foreground transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>
          )}

          {/* Customer Service */}
          {showCustomerService && (
            <div className="gsap-reveal">
              <h3 className="text-sm sm:text-base font-semibold uppercase tracking-wider text-foreground mb-3 sm:mb-4">Customer Service</h3>
              <ul className="space-y-3 text-sm sm:text-base">
                <li><Link to="/store-locations" className="hover:text-foreground transition-colors">Store Locations</Link></li>
                <li><Link to="/service-center" className="hover:text-foreground transition-colors">Service Center</Link></li>
                <li><Link to="/track-orders" className="hover:text-foreground transition-colors">Track Orders</Link></li>
              </ul>
            </div>
          )}
        </div>

        {/* Store Locations */}
        {showLocations && (
          <div className="mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-border gsap-reveal">
            <h3 className="text-sm sm:text-base font-semibold uppercase tracking-wider text-foreground mb-4 sm:mb-6 text-center">{locationTitle}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
              {locations.length > 0 ? (
                locations.map(loc => (
                  <div key={loc.id || loc.name} className="text-xs sm:text-sm space-y-1.5 bg-muted/50 rounded-xl p-4">
                    <p className="font-semibold text-foreground">{loc.name}</p>
                    <p className="text-muted-foreground leading-relaxed">{loc.address}</p>
                    <p className="flex items-center gap-1.5 text-muted-foreground mt-2">
                      <Phone size={12} /> {loc.phone}
                    </p>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-4 text-muted-foreground/40 italic">
                  No stores listed
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 sm:mt-12 pt-4 sm:pt-6 border-t border-border text-center text-xs sm:text-sm text-muted-foreground/60 gsap-reveal">
          © {new Date().getFullYear()} {displayName} – All Rights Reserved
        </div>
      </div>
    </footer>
  );
};
