import { Activity } from "lucide-react";

const activities = [
  { action: "User session started", user: "jdoe@company.com", time: "Just now", type: "info" },
  { action: "File download: Q4_report.pdf", user: "asmith@company.com", time: "5m ago", type: "info" },
  { action: "API key rotated", user: "system", time: "12m ago", type: "success" },
  { action: "Failed login attempt", user: "unknown@ext.net", time: "18m ago", type: "warning" },
  { action: "Database backup completed", user: "system", time: "1h ago", type: "success" },
  { action: "New user provisioned", user: "admin", time: "2h ago", type: "info" },
];

const ActivityFeed = () => (
  <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6">
    <h3 className="font-mono text-sm font-bold text-foreground mb-4 flex items-center gap-2">
      <Activity className="w-4 h-4 text-primary" />
      Recent Activity
    </h3>
    <div className="space-y-3">
      {activities.map((a, i) => (
        <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${
              a.type === "success" ? "bg-primary" : a.type === "warning" ? "bg-warning" : "bg-accent"
            }`} />
            <div>
              <p className="text-xs font-mono text-foreground">{a.action}</p>
              <p className="text-xs text-muted-foreground font-mono">{a.user}</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{a.time}</span>
        </div>
      ))}
    </div>
  </div>
);

export default ActivityFeed;
