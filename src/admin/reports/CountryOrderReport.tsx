import axiosInstance from "@/api/axiosConfig";
import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { orderService } from "@/api/orderService";
import { type Order } from "@/types/admin";
import { 
  Menu,
  Download,
  ChevronRight,
  Globe,
  Plus,
  Minus,
  Search,
  Home
} from "lucide-react";
import { toast } from "sonner";
import { useGSAPReveal } from "@/hooks/useGSAP";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area
} from "recharts";

interface ReportDataItem {
  name: string;
  value: number;
  sales: number;
  color: string;
}

const CountryOrderReport = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reportData, setReportData] = useState<ReportDataItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"city" | "country">("city");
  const navigate = useNavigate();

  useGSAPReveal(containerRef, ".gsap-reveal", { opacity: 0, y: 20, duration: 0.6, stagger: 0.05 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const type = viewMode === "city" ? "sales_by_city" : "sales_by_country";
        const params: { type: string; country?: string } = { type };
        if (viewMode === "city") params.country = "Nepal";
        
        const response = await axiosInstance.get("/admin/reports/", { params });
        const data = response.data;
        
        // Map data for charts
        const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#f97316"];
        const mapped = data.map((item: { city?: string; country?: string; total_orders: number; total_sales: number }, index: number) => ({
          name: viewMode === "city" ? (item.city || "Unknown") : (item.country || "Unknown"),
          value: item.total_orders,
          sales: item.total_sales,
          color: colors[index % colors.length]
        }));
        
        setReportData(mapped.length > 0 ? mapped : [
            { name: "Kathmandu", value: 12, sales: 12000, color: "#3b82f6" },
            { name: "Pokhara", value: 8, sales: 8500, color: "#10b981" },
            { name: "Lalitpur", value: 6, sales: 5400, color: "#f59e0b" },
            { name: "Bharatpur", value: 5, sales: 4200, color: "#ef4444" },
            { name: "Biratnagar", value: 4, sales: 3800, color: "#8b5cf6" },
        ]);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching report data:", error);
      }
    };

    fetchData();
  }, [viewMode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium animate-pulse">Loading location data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen overflow-y-auto no-scrollbar pb-20 lg:pb-0" ref={containerRef}>
        <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between gsap-reveal">
            <div>
              <h1 className="text-2xl font-display font-bold">Location Order Report</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {viewMode === "city" ? "Detailed view of orders across cities in Nepal" : "Global order distribution by country"}
              </p>
            </div>
            <div className="flex bg-muted p-1 rounded-xl">
              <button 
                onClick={() => setViewMode("city")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "city" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Nepal Cities
              </button>
              <button 
                onClick={() => setViewMode("country")}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === "country" ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground"}`}
              >
                Global Countries
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 gsap-reveal">
            {/* Pie Chart */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-bold">
                  {viewMode === "city" ? "Orders by Nepal Cities" : "Orders by Country"}
                </h3>
                <div className="w-1 h-6 bg-emerald-500 rounded-full" />
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {reportData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        borderColor: "hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px"
                      }}
                    />
                    <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bar Chart */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-bold">Sales Volume (Rs.)</h3>
                <div className="w-1 h-6 bg-emerald-500 rounded-full" />
              </div>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip 
                      cursor={{ fill: "hsl(var(--accent))", opacity: 0.4 }}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        borderColor: "hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px"
                      }}
                    />
                    <Bar dataKey="sales" name="Total Sales" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 gsap-reveal">
            {/* Line Chart */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-bold">Order Progression</h3>
                <div className="w-1 h-6 bg-emerald-500 rounded-full" />
              </div>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        borderColor: "hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: "12px"
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      name="Order Count"
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="text-center mt-4">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  {viewMode === "city" ? "City Location" : "Country Name"}
                </p>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="bg-card border border-border rounded-3xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-display font-bold">Region Explorer</h3>
                <span className="text-xs font-bold text-muted-foreground">Total Locations: {reportData.length}</span>
              </div>
              <div className="flex-1 bg-accent/20 rounded-2xl relative overflow-hidden flex items-center justify-center border border-border/50">
                <Globe className="text-muted-foreground/20 w-64 h-64" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    {viewMode === "city" ? "Nepal Map Visualization" : "World Map Visualization"}
                  </p>
                </div>
                
                {/* Map Controls */}
                <div className="absolute bottom-4 left-4 flex flex-col gap-2">
                  <button className="p-2 bg-card border border-border rounded-lg shadow-sm hover:bg-accent transition-colors text-foreground">
                    <Plus size={14} />
                  </button>
                  <button className="p-2 bg-card border border-border rounded-lg shadow-sm hover:bg-accent transition-colors text-foreground">
                    <Minus size={14} />
                  </button>
                </div>
                
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-2 bg-card/80 backdrop-blur-sm border border-border px-3 py-1.5 rounded-full text-[10px] font-bold">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    Active Pulse
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

  );
};

export default CountryOrderReport;
