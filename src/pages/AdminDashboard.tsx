import { motion } from "framer-motion";
import { Shield, LogOut, Activity, AlertTriangle, Users, Eye, Brain, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/StatsCard";
import ThreatChart from "@/components/ThreatChart";
import AttackerTable from "@/components/AttackerTable";
import ThreatMap from "@/components/ThreatMap";

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background cyber-grid">
      <div className="absolute inset-0 scanline pointer-events-none" />

      <header className="relative z-10 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16 px-6">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <span className="font-mono font-bold text-foreground">
              SENTINEL<span className="text-primary">.</span>SHIELD
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono bg-destructive/10 text-destructive border border-destructive/20">
              ADMIN
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

      <main className="relative z-10 container px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-xl font-bold font-mono text-foreground mb-1">
            Attack Intelligence <span className="text-primary">Dashboard</span>
          </h1>
          <p className="text-sm text-muted-foreground font-mono mb-8">
            Real-time threat monitoring and attacker behavioral analysis
          </p>

          {/* Threat Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard icon={AlertTriangle} label="Total Threats" value="847" trend="up" color="destructive" />
            <StatsCard icon={Users} label="Trapped Attackers" value="156" trend="up" color="warning" />
            <StatsCard icon={Eye} label="Decoy Sessions" value="312" trend="up" />
            <StatsCard icon={Brain} label="ML Accuracy" value="94.7%" trend="up" />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <ThreatChart />
            <ThreatMap />
          </div>

          {/* Attacker Table */}
          <AttackerTable />
        </motion.div>
      </main>
    </div>
  );
};

export default AdminDashboard;
