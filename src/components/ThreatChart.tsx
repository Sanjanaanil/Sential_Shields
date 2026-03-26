import { BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { name: "Mon", threats: 45, blocked: 42 },
  { name: "Tue", threats: 52, blocked: 48 },
  { name: "Wed", threats: 38, blocked: 36 },
  { name: "Thu", threats: 67, blocked: 61 },
  { name: "Fri", threats: 89, blocked: 82 },
  { name: "Sat", threats: 34, blocked: 33 },
  { name: "Sun", threats: 28, blocked: 27 },
];

const ThreatChart = () => (
  <div className="rounded-xl border border-border bg-card/80 backdrop-blur-sm p-6">
    <h3 className="font-mono text-sm font-bold text-foreground mb-4 flex items-center gap-2">
      <BarChart3 className="w-4 h-4 text-primary" />
      Threat Activity — Last 7 Days
    </h3>
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} barGap={2}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 18%)" />
        <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "hsl(215 15% 50%)" }} />
        <YAxis tick={{ fontSize: 11, fontFamily: "JetBrains Mono", fill: "hsl(215 15% 50%)" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(220 18% 10%)",
            border: "1px solid hsl(220 15% 18%)",
            borderRadius: "8px",
            fontFamily: "JetBrains Mono",
            fontSize: "11px",
          }}
        />
        <Bar dataKey="threats" fill="hsl(0 80% 55%)" radius={[4, 4, 0, 0]} name="Threats" />
        <Bar dataKey="blocked" fill="hsl(160 100% 45%)" radius={[4, 4, 0, 0]} name="Blocked" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default ThreatChart;
