import { Globe } from "lucide-react";

const attackSources = [
  { country: "China", ip: "223.71.xxx.xx", attacks: 234, risk: "critical" },
  { country: "Russia", ip: "185.220.xxx.xx", attacks: 189, risk: "critical" },
  { country: "USA", ip: "104.28.xxx.xx", attacks: 67, risk: "high" },
  { country: "Brazil", ip: "177.54.xxx.xx", attacks: 45, risk: "medium" },
  { country: "India", ip: "49.36.xxx.xx", attacks: 31, risk: "low" },
];

const riskColors: Record<string, string> = {
  critical: "bg-destructive/10 text-destructive border-destructive/20",
  high: "bg-warning/10 text-warning border-warning/20",
  medium: "bg-accent/10 text-accent border-accent/20",
  low: "bg-primary/10 text-primary border-primary/20",
};

const ThreatMap = () => (
  <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6">
    <h3 className="font-mono text-sm font-bold text-foreground mb-4 flex items-center gap-2">
      <Globe className="w-4 h-4 text-accent" />
      Attack Sources
    </h3>
    <div className="space-y-3">
      {attackSources.map((src, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-foreground w-20">{src.country}</span>
            <span className="text-xs font-mono text-muted-foreground">{src.ip}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground">{src.attacks} hits</span>
            <span className={`px-2 py-0.5 rounded text-xs font-mono border ${riskColors[src.risk]}`}>
              {src.risk}
            </span>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default ThreatMap;
