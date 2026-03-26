import { Skull } from "lucide-react";

const attackers = [
  { id: "ATK-001", ip: "223.71.167.42", type: "Brute Force", classification: "Script Kiddie", sessions: 12, risk: 87, status: "trapped" },
  { id: "ATK-002", ip: "185.220.101.33", type: "Credential Stuffing", classification: "Organized", sessions: 8, risk: 94, status: "active" },
  { id: "ATK-003", ip: "104.28.55.91", type: "Recon Scan", classification: "APT", sessions: 3, risk: 98, status: "monitoring" },
  { id: "ATK-004", ip: "177.54.12.88", type: "SQL Injection", classification: "Script Kiddie", sessions: 15, risk: 72, status: "trapped" },
  { id: "ATK-005", ip: "49.36.200.11", type: "Phishing", classification: "Social Engineer", sessions: 5, risk: 65, status: "blocked" },
];

const statusColors: Record<string, string> = {
  trapped: "bg-warning/10 text-warning border-warning/20",
  active: "bg-destructive/10 text-destructive border-destructive/20",
  monitoring: "bg-accent/10 text-accent border-accent/20",
  blocked: "bg-primary/10 text-primary border-primary/20",
};

const AttackerTable = () => (
  <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
    <div className="px-6 py-4 border-b border-border flex items-center gap-2">
      <Skull className="w-4 h-4 text-destructive" />
      <h3 className="font-mono text-sm font-bold text-foreground">
        Identified Attackers — ML Classification
      </h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-secondary/20">
            {["ID", "IP Address", "Attack Type", "ML Class", "Sessions", "Risk", "Status"].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-mono text-muted-foreground uppercase tracking-wider">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {attackers.map((a, i) => (
            <tr key={i} className="border-b border-border/50 hover:bg-secondary/20 transition-colors">
              <td className="px-4 py-3 text-xs font-mono text-primary">{a.id}</td>
              <td className="px-4 py-3 text-xs font-mono text-foreground">{a.ip}</td>
              <td className="px-4 py-3 text-xs font-mono text-foreground">{a.type}</td>
              <td className="px-4 py-3 text-xs font-mono text-accent">{a.classification}</td>
              <td className="px-4 py-3 text-xs font-mono text-foreground">{a.sessions}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                    <div
                      className={`h-full rounded-full ${a.risk >= 90 ? "bg-destructive" : a.risk >= 70 ? "bg-warning" : "bg-primary"}`}
                      style={{ width: `${a.risk}%` }}
                    />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">{a.risk}%</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <span className={`px-2 py-0.5 rounded text-xs font-mono border ${statusColors[a.status]}`}>
                  {a.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default AttackerTable;
