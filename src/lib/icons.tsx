import React from "react";
import * as LucideIcons from "lucide-react";

export const getCategoryColor = (name: string) => {
  const colors: Record<string, string> = {
    "Laptops": "#3B82F6",
    "Computers": "#2563EB",
    "Mobiles": "#10B981",
    "Phones": "#059669",
    "Audio": "#8B5CF6",
    "Headphones": "#7C3AED",
    "Cameras": "#F59E0B",
    "Gaming": "#EF4444",
    "Monitors": "#06B6D4",
    "Peripherals": "#6366F1",
    "Accessories": "#EC4899",
    "Home": "#F97316",
    "Kitchen": "#D97706",
    "Fitness": "#14B8A6",
    "Health": "#0D9488",
    "Tablets": "#8B5CF6",
    "Smartwatch": "#F43F5E",
    "Networking": "#0EA5E9",
    "Storage": "#64748B",
    "Components": "#8247E5",
    "Printers": "#10B981",
    "Drones": "#F43F5E",
    "Security": "#EF4444",
    "Software": "#3B82F6",
  };

  const lowerName = (name || "").toLowerCase();
  for (const [key, color] of Object.entries(colors)) {
    if (lowerName.includes(key.toLowerCase())) return color;
  }
  
  // Default colors based on string hash if no match
  const defaultColors = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#EC4899", "#06B6D4", "#F97316", "#14B8A6"];
  let hash = 0;
  if (name) {
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
  }
  return defaultColors[Math.abs(hash) % defaultColors.length];
};

export const renderCategoryIcon = (iconName: string, size: number = 20, color?: string) => {
  // If it's an emoji
  if (iconName && iconName.length <= 2 && !/^[a-zA-Z0-9]+$/.test(iconName)) {
    return iconName;
  }

  // If it's a URL
  if (iconName && (iconName.startsWith("http") || iconName.startsWith("data:image"))) {
    return <img src={iconName} alt="icon" className="w-full h-full object-contain" referrerPolicy="no-referrer" />;
  }

  // If it's a Lucide icon name
  const IconComponent = (LucideIcons as Record<string, React.ComponentType<{ size?: number, color?: string }>>)[iconName];
  if (IconComponent) {
    return <IconComponent size={size} color={color} />;
  }

  // Fallback
  return iconName || "📦";
};
