import { motion } from "framer-motion";
import { Shield, Activity, Users, Bell, LogOut, Server, Wifi, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/StatsCard";
import ActivityFeed from "@/components/ActivityFeed";

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <div className="absolute inset-0 scanline pointer-events-none" />

      {/* Header */}
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
            onClick={() => navigate("/")}
            className="font-mono text-xs text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-xl font-bold font-mono text-foreground mb-1">
            Welcome back, <span className="text-primary">User</span>
          </h1>
          <p className="text-sm text-muted-foreground font-mono mb-8">
            System Status: <span className="text-primary">● Online</span> — All services operational
          </p>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard icon={Server} label="Uptime" value="99.97%" trend="up" />
            <StatsCard icon={Wifi} label="Active Sessions" value="142" trend="up" />
            <StatsCard icon={Activity} label="Requests/min" value="1,247" trend="neutral" />
            <StatsCard icon={Clock} label="Avg Response" value="23ms" trend="down" />
          </div>

          {/* Activity + Info */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <ActivityFeed />
            </div>
            <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6">
              <h3 className="font-mono text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-primary" />
                Notifications
              </h3>
              <div className="space-y-3">
                {[
                  { text: "Security patch applied successfully", time: "2m ago", type: "success" },
                  { text: "New team member added to project", time: "1h ago", type: "info" },
                  { text: "Scheduled maintenance tonight at 02:00", time: "3h ago", type: "warning" },
                ].map((n, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${
                      n.type === "success" ? "bg-primary" : n.type === "warning" ? "bg-warning" : "bg-accent"
                    }`} />
                    <div>
                      <p className="text-xs text-foreground font-mono">{n.text}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
