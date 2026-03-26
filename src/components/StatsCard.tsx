import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  trend: "up" | "down" | "neutral";
  color?: "primary" | "destructive" | "warning" | "accent";
}

const StatsCard = ({ icon: Icon, label, value, trend, color = "primary" }: StatsCardProps) => {
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
  const trendColor = trend === "up" ? "text-primary" : trend === "down" ? "text-destructive" : "text-muted-foreground";

  const colorMap = {
    primary: "text-primary bg-primary/10 border-primary/20",
    destructive: "text-destructive bg-destructive/10 border-destructive/20",
    warning: "text-warning bg-warning/10 border-warning/20",
    accent: "text-accent bg-accent/10 border-accent/20",
  };

  return (
    <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5 hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center border ${colorMap[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
        <TrendIcon className={`w-4 h-4 ${trendColor}`} />
      </div>
      <p className="text-2xl font-bold font-mono text-foreground">{value}</p>
      <p className="text-xs font-mono text-muted-foreground mt-1 uppercase tracking-wider">{label}</p>
    </div>
  );
};

export default StatsCard;
