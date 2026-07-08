import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import { Header } from "@/frontend/components/Header";
import { Footer } from "@/frontend/components/Footer";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/frontend/components/ProductCard";
import { GoogleGenAI, Type } from "@google/genai";
import { Sparkles, Loader2, Cpu, Zap, ShoppingBag, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";

const RequirementFinder = () => {
  const [requirement, setRequirement] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recommendedIds, setRecommendedIds] = useState<string[]>([]);
  const [aiReasoning, setAiReasoning] = useState("");
  const { products, loading: productsLoading } = useProducts();

  const recommendedProducts = useMemo(() => {
    return products.filter(p => recommendedIds.includes(p.id) || recommendedIds.includes(p.slug));
  }, [products, recommendedIds]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requirement.trim()) {
      toast.error("Please enter your requirements first.");
      return;
    }

    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Prepare a condensed product list for the AI
      const productList = products.map(p => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: p.price,
        specs: p.specs
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a professional tech consultant for "FixItAll" electronics store. Based on the following product catalog, recommend the best products for the user's requirement.
        
        Catalog: ${JSON.stringify(productList)}
        
        User Requirement: "${requirement}"
        
        Return your response in JSON format with two fields:
        1. "recommendedIds": An array of product IDs or slugs that best match the requirement (max 6).
        2. "reasoning": A brief explanation (max 3 sentences) of why these products were chosen and how they meet the specific needs.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendedIds: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              reasoning: { type: Type.STRING }
            },
            required: ["recommendedIds", "reasoning"]
          }
        }
      });

      const result = JSON.parse(response.text);
      setRecommendedIds(result.recommendedIds);
      setAiReasoning(result.reasoning);
      
      if (result.recommendedIds.length === 0) {
        toast.info("No exact matches found, but here are some similar options.");
      } else {
        toast.success(`Found ${result.recommendedIds.length} recommendations!`);
      }
    } catch (error) {
      console.error("AI Analysis Error:", error);
      toast.error("Failed to analyze requirements. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <Helmet>
        <title>AI Requirement Finder | FixItAll Tech Store</title>
        <meta name="description" content="Use our AI-powered tech consultant to find the perfect electronic items based on your specific requirements and budget." />
      </Helmet>
      <Header />
      
      <main className="neo-container py-8 sm:py-16">
        <div className="max-w-5xl mx-auto">
          {/* Hero Header */}
          <div className="text-center mb-10 sm:mb-16">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em] mb-6"
            >
              <Sparkles size={14} className="animate-pulse" />
              AI Tech Consultant
            </motion.div>
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-display font-black tracking-tighter mb-6 leading-[0.9]">
              Find Your Perfect <br />
              <span className="text-primary relative">
                Tech Match
                <svg className="absolute -bottom-2 left-0 w-full h-3 text-primary/20" viewBox="0 0 100 10" preserveAspectRatio="none">
                  <path d="M0 5 Q 25 0, 50 5 T 100 5" fill="none" stroke="currentColor" strokeWidth="4" />
                </svg>
              </span>
            </h1>
            <p className="text-muted-foreground text-base sm:text-xl max-w-2xl mx-auto leading-relaxed">
              Describe what you need in plain English. Our AI scans our entire inventory to find the electronic items that perfectly match your needs and budget.
            </p>
          </div>

          {/* Requirement Input Area */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-purple-500/20 to-blue-500/20 rounded-[2.5rem] sm:rounded-[3.5rem] blur-xl opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
            <div className="relative bg-card border border-border/50 rounded-[2.5rem] sm:rounded-[3.5rem] p-6 sm:p-12 shadow-2xl backdrop-blur-sm">
              <form onSubmit={handleAnalyze} className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-muted-foreground">
                      Describe Your Requirements
                    </label>
                    <div className="flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary/40" />
                      <span className="w-2 h-2 rounded-full bg-purple-500/40" />
                      <span className="w-2 h-2 rounded-full bg-blue-500/40" />
                    </div>
                  </div>
                  <textarea
                    value={requirement}
                    onChange={(e) => setRequirement(e.target.value)}
                    placeholder="e.g., I'm a graphic designer looking for a laptop with a color-accurate screen, at least 1TB storage, and enough power for Adobe Creative Cloud. My budget is around Rs. 200,000."
                    className="w-full min-h-[180px] sm:min-h-[220px] p-6 sm:p-8 bg-accent/20 border border-border/50 rounded-[2rem] text-base sm:text-xl focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all resize-none placeholder:text-muted-foreground/40 leading-relaxed"
                  />
                </div>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    type="submit"
                    disabled={isAnalyzing || productsLoading}
                    className="w-full sm:w-auto group relative flex items-center justify-center gap-3 px-12 py-5 bg-primary text-primary-foreground rounded-2xl font-black text-lg shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="animate-spin" size={24} />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Cpu size={24} />
                        Get Recommendations
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                      </>
                    )}
                  </button>
                  
                  {!isAnalyzing && (
                    <button
                      type="button"
                      onClick={() => setRequirement("")}
                      className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors px-6 py-2"
                    >
                      Clear Input
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Results Section */}
          <AnimatePresence mode="wait">
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                className="text-center py-20"
              >
                <div className="relative w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                  <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Sparkles className="text-primary animate-pulse" size={32} />
                  </div>
                </div>
                <h3 className="text-2xl font-display font-bold mb-2">Consulting AI Expert...</h3>
                <p className="text-muted-foreground animate-pulse">Scanning specifications and matching with your needs</p>
              </motion.div>
            )}

            {!isAnalyzing && recommendedProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-20 space-y-12"
              >
                <div className="relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-primary rounded-full" />
                  <div className="bg-card border border-border/50 rounded-3xl p-8 sm:p-10 shadow-xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                        <Zap size={24} />
                      </div>
                      <h3 className="text-2xl font-display font-bold">AI Consultant's Verdict</h3>
                    </div>
                    <p className="text-lg leading-relaxed text-muted-foreground italic">
                      "{aiReasoning}"
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                  {recommendedProducts.map((product, index) => (
                    <div key={product.id} className="gsap-reveal">
                      <ProductCard product={product} index={index} />
                    </div>
                  ))}
                </div>
                
                <div className="text-center pt-8">
                  <p className="text-sm text-muted-foreground mb-6">Not exactly what you were looking for?</p>
                  <button
                    onClick={() => {
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="px-8 py-3 bg-accent hover:bg-accent/80 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                  >
                    Refine Your Requirement
                  </button>
                </div>
              </motion.div>
            )}

            {!isAnalyzing && recommendedIds.length === 0 && requirement && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-20 text-center py-24 bg-accent/10 rounded-[3rem] border-2 border-dashed border-border/50"
              >
                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShoppingBag size={32} className="text-muted-foreground/30" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-3">No direct matches found</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Try being more specific about the features you need, or broaden your budget range for better results.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default RequirementFinder;
