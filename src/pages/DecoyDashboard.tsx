import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Shield, Activity, Server, Wifi, Clock, Database, LogOut, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/StatsCard";

const FAKE_LOGS = [
  "[SYS] Loading financial records...",
  "[DB] Connected to prod-db-west-02",
  "[API] GET /api/v2/accounts — 200 OK",
  "[SYS] Fetching transaction history...",
  "[DB] Query: SELECT * FROM users WHERE role='admin'",
  "[API] POST /api/v2/transfer — 200 OK",
  "[SYS] Generating quarterly report...",
  "[NET] Outbound connection to 192.168.1.50:8443",
  "[DB] Query: SELECT credentials FROM vault",
  "[API] GET /api/v2/admin/secrets — 403 Forbidden",
  "[SYS] Session token refreshed",
  "[NET] DNS lookup: internal-api.corp.net",
];

const DecoyDashboard = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState<string[]>([]);
  const [interactions, setInteractions] = useState<{ action: string; timestamp: string }[]>([]);
  const logEndRef = useRef<HTMLDivElement>(null);

  const trackInteraction = (action: string) => {
    setInteractions((prev) => [
      ...prev,
      { action, timestamp: new Date().toISOString() },
    ]);
  };

  useEffect(() => {
    trackInteraction("ENTERED_DECOY_ENVIRONMENT");
    let i = 0;
    const interval = setInterval(() => {
      if (i < FAKE_LOGS.length) {
        setLogs((prev) => [...prev, `${new Date().toLocaleTimeString()} ${FAKE_LOGS[i]}`]);
        i++;
      } else {
        i = 0;
      }
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <div className="absolute inset-0 scanline pointer-events-none" />

      {/* Subtle red overlay to differentiate */}
      <div className="absolute inset-0 bg-destructive/[0.02] pointer-events-none" />

      {/* Header — looks identical to real dashboard */}
      <header className="relative z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-mono font-bold text-foreground">
              SENTINEL<span className="text-primary">.</span>SHIELD
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-primary/10 text-primary border border-primary/20">
              USER
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              trackInteraction("CLICKED_LOGOUT");
              navigate("/");
            }}
            className="font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content — looks real but has fake data */}
      <main className="relative z-10 container px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-xl font-bold font-mono text-foreground mb-1">
            Welcome back, <span className="text-primary">Admin</span>
          </h1>
          <p className="text-sm text-muted-foreground font-mono mb-8">
            System Status: <span className="text-primary">● Online</span> — All services operational
          </p>

          {/* Fake Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div onClick={() => trackInteraction("CLICKED_STATS_UPTIME")}>
              <StatsCard icon={Server} label="Uptime" value="99.99%" trend="up" />
            </div>
            <div onClick={() => trackInteraction("CLICKED_STATS_SESSIONS")}>
              <StatsCard icon={Wifi} label="Active Sessions" value="2,341" trend="up" />
            </div>
            <div onClick={() => trackInteraction("CLICKED_STATS_REQUESTS")}>
              <StatsCard icon={Activity} label="Requests/min" value="8,102" trend="neutral" />
            </div>
            <div onClick={() => trackInteraction("CLICKED_STATS_DB")}>
              <StatsCard icon={Database} label="DB Records" value="1.2M" trend="up" />
            </div>
          </div>

          {/* Fake System Console */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl border border-border bg-card/80 backdrop-blur-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-secondary/30">
                <div className="w-3 h-3 rounded-full bg-destructive/60" />
                <div className="w-3 h-3 rounded-full bg-warning/60" />
                <div className="w-3 h-3 rounded-full bg-primary/60" />
                <span className="text-xs font-mono text-muted-foreground ml-2">
                  system-console — live
                </span>
              </div>
              <div className="p-4 h-80 overflow-y-auto bg-background/50">
                {logs.map((log, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-xs font-mono text-muted-foreground py-0.5"
                  >
                    <span className="text-primary/50">$</span> {log}
                  </motion.div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>

            {/* Fake Sensitive Data */}
            <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6">
              <h3 className="font-mono text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                Sensitive Files
              </h3>
              <div className="space-y-2">
                {[
                  "credentials_backup.sql",
                  "employee_records.csv",
                  "api_keys_2024.env",
                  "financial_report_Q4.xlsx",
                  "admin_passwords.txt",
                ].map((file, i) => (
                  <button
                    key={i}
                    onClick={() => trackInteraction(`CLICKED_FILE_${file}`)}
                    className="w-full text-left p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <p className="text-xs font-mono text-foreground">{file}</p>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      {Math.floor(Math.random() * 500 + 50)} KB
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default DecoyDashboard;
