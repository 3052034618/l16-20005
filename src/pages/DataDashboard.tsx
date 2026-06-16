import { useState, useMemo } from "react";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { BarChart, PieChart, LineChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  MarkAreaComponent,
  GraphicComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { ClipboardList, CheckCircle, AlertTriangle, FlaskConical } from "lucide-react";
import { useStore } from "@/store";
import type { TaskStatus } from "@/types";

echarts.use([
  BarChart, PieChart, LineChart,
  GridComponent, TooltipComponent, LegendComponent,
  MarkLineComponent, MarkAreaComponent, GraphicComponent,
  CanvasRenderer,
]);

const statusLabels: Record<TaskStatus, string> = {
  pending_validation: "待验证",
  parsing: "解析中",
  coupling_calculation: "耦合计算",
  melt_pool_analysis: "熔池分析",
  completed: "已完成",
  error_rollback: "错误回滚",
};

const statusColors: Record<TaskStatus, string> = {
  pending_validation: "#8B949E",
  parsing: "#A78BFA",
  coupling_calculation: "#00D4FF",
  melt_pool_analysis: "#FBBF24",
  completed: "#00E5A0",
  error_rollback: "#FF4757",
};

type TimeRange = 7 | 14 | 30;

const fmt = (d: string) => {
  const dt = new Date(d);
  return `${String(dt.getMonth() + 1).padStart(2, "0")}/${String(dt.getDate()).padStart(2, "0")}`;
};

const darkTip = {
  backgroundColor: "#161B22",
  borderColor: "#21262D",
  textStyle: { color: "#E6EDF3" },
};

const barGrad = {
  type: "linear" as const, x: 0, y: 0, x2: 0, y2: 1,
  colorStops: [{ offset: 0, color: "#00D4FF" }, { offset: 1, color: "#00A5CC" }],
};

const darkAxis = { axisLabel: { color: "#8B949E", fontSize: 10 }, axisLine: { lineStyle: { color: "#21262D" } } };
const darkSplit = { splitLine: { lineStyle: { color: "#21262D" } } };

export default function DataDashboard() {
  const [range, setRange] = useState<TimeRange>(14);
  const { tasks, alerts, dailyStats, materialAlerts, reports } = useStore();

  const stats = useMemo(() => dailyStats.slice(-range), [dailyStats, range]);
  const dates = useMemo(() => stats.map((s) => fmt(s.date)), [stats]);

  const topStats = useMemo(() => {
    const n = stats.length || 1;
    return {
      totalTasks: tasks.length,
      avgRate: stats.reduce((s, d) => s + d.completionRate, 0) / n,
      totalAlerts: alerts.length,
      avgDev: stats.reduce((s, d) => s + d.avgPorosityDeviation, 0) / n,
    };
  }, [tasks, alerts, stats]);

  const completionOption = useMemo(() => ({
    tooltip: { ...darkTip, trigger: "axis" as const },
    grid: { left: 48, right: 16, top: 20, bottom: 28 },
    xAxis: { type: "category" as const, data: dates, ...darkAxis },
    yAxis: { type: "value" as const, axisLabel: { color: "#8B949E", formatter: "{value}%" }, ...darkSplit },
    series: [
      { type: "bar" as const, data: stats.map((s) => s.completionRate), barWidth: "40%", itemStyle: { color: barGrad } },
      { type: "line" as const, data: stats.map((s) => s.completionRate), smooth: true, symbol: "circle", symbolSize: 4, lineStyle: { color: "#00D4FF", width: 2 }, itemStyle: { color: "#00D4FF" } },
    ],
  }), [stats, dates]);

  const statusOption = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => { counts[t.status] = (counts[t.status] || 0) + 1; });
    return {
      tooltip: { ...darkTip, trigger: "item" as const },
      legend: { orient: "vertical" as const, right: 10, top: "center", textStyle: { color: "#8B949E", fontSize: 11 } },
      graphic: { type: "text" as const, left: "35%", top: "center", style: { text: `${tasks.length}`, fill: "#E6EDF3", fontSize: 28, fontWeight: "bold" as const, textAlign: "center" as const } },
      series: [{
        type: "pie" as const, radius: ["45%", "70%"], center: ["38%", "50%"],
        data: (Object.keys(statusLabels) as TaskStatus[]).map((s) => ({ name: statusLabels[s], value: counts[s] || 0, itemStyle: { color: statusColors[s] } })),
        label: { show: false }, emphasis: { label: { show: true, color: "#E6EDF3" } },
      }],
    };
  }, [tasks]);

  const alertOption = useMemo(() => {
    const w: Record<string, number> = {};
    const c: Record<string, number> = {};
    const dateSet = new Set(stats.map((s) => s.date));
    stats.forEach((s) => { w[s.date] = 0; c[s.date] = 0; });
    alerts.forEach((a) => {
      const d = new Date(a.createdAt).toISOString().slice(0, 10);
      if (!dateSet.has(d)) return;
      if (a.severity === "warning") w[d] = (w[d] || 0) + 1;
      else c[d] = (c[d] || 0) + 1;
    });
    return {
      tooltip: { ...darkTip, trigger: "axis" as const },
      legend: { data: ["警告", "严重"], textStyle: { color: "#8B949E" }, top: 0 },
      grid: { left: 48, right: 16, top: 30, bottom: 28 },
      xAxis: { type: "category" as const, data: dates, ...darkAxis },
      yAxis: { type: "value" as const, axisLabel: { color: "#8B949E" }, ...darkSplit },
      series: [
        { name: "警告", type: "bar" as const, stack: "a", data: stats.map((s) => w[s.date] || 0), itemStyle: { color: "#FF6B35" } },
        { name: "严重", type: "bar" as const, stack: "a", data: stats.map((s) => c[s.date] || 0), itemStyle: { color: "#FF4757" } },
      ],
    };
  }, [alerts, stats, dates]);

  const qualityOption = useMemo(() => ({
    tooltip: { ...darkTip, trigger: "axis" as const },
    grid: { left: 52, right: 16, top: 20, bottom: 28 },
    xAxis: { type: "category" as const, data: dates, ...darkAxis },
    yAxis: { type: "value" as const, axisLabel: { color: "#8B949E", formatter: "{value}%" }, ...darkSplit },
    series: [{
      type: "line" as const, data: stats.map((s) => s.avgPorosityDeviation),
      smooth: true, lineStyle: { color: "#A78BFA", width: 2 }, itemStyle: { color: "#A78BFA" },
      areaStyle: { color: "rgba(167,139,250,0.1)" },
      markLine: { silent: true, data: [{ yAxis: 20, lineStyle: { color: "#FF4757", type: "dashed" as const }, label: { formatter: "20%阈值", color: "#FF4757" } }] },
      markArea: { silent: true, data: [[{ yAxis: 20, itemStyle: { color: "rgba(255,71,87,0.08)" } }, { yAxis: 100 }]] },
    }],
  }), [stats, dates]);

  const matData = useMemo(() => {
    const m: Record<string, { t: number; c: number; ps: number; pc: number; ac: number }> = {};
    const tm: Record<string, string> = {};
    tasks.forEach((t) => {
      tm[t.id] = t.materialType;
      if (!m[t.materialType]) m[t.materialType] = { t: 0, c: 0, ps: 0, pc: 0, ac: 0 };
      m[t.materialType].t++;
      if (t.status === "completed") m[t.materialType].c++;
    });
    reports.forEach((r) => { const mt = tm[r.taskId]; if (mt && m[mt]) { m[mt].ps += r.porosityDeviation; m[mt].pc++; } });
    alerts.forEach((a) => { const mt = tm[a.taskId]; if (mt && m[mt]) m[mt].ac++; });
    return Object.entries(m).map(([mat, d]) => {
      const ma = materialAlerts.find((x) => x.materialType === mat);
      return { material: mat, tasks: d.t, completed: d.c, avgDev: d.pc ? d.ps / d.pc : 0, alerts: d.ac, status: ma?.isPaused ? "paused" : (ma?.consecutiveDeviations ?? 0) >= 3 ? "caution" : "normal" as const };
    });
  }, [tasks, reports, alerts, materialAlerts]);

  const badge = (s: string) => {
    if (s === "normal") return <span className="rounded px-2 py-0.5 text-xs bg-brand-green/20 text-brand-green">正常</span>;
    if (s === "caution") return <span className="rounded px-2 py-0.5 text-xs bg-brand-orange/20 text-brand-orange">注意</span>;
    return <span className="rounded px-2 py-0.5 text-xs bg-brand-red/20 text-brand-red">暂停</span>;
  };

  const statCards = [
    { Icon: ClipboardList, label: "总任务数", value: topStats.totalTasks, color: "text-brand-cyan" },
    { Icon: CheckCircle, label: "完成率", value: `${topStats.avgRate.toFixed(1)}%`, color: "text-brand-green" },
    { Icon: AlertTriangle, label: "预警总数", value: topStats.totalAlerts, color: "text-brand-orange" },
    { Icon: FlaskConical, label: "平均孔隙率偏差", value: `${topStats.avgDev.toFixed(2)}%`, color: "text-brand-purple" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-2">
        {([7, 14, 30] as TimeRange[]).map((r) => (
          <button key={r} onClick={() => setRange(r)}
            className={`rounded-lg px-4 py-1.5 text-sm transition-colors ${range === r ? "bg-brand-cyan/20 text-brand-cyan border border-brand-cyan/40" : "bg-brand-surface text-brand-text-muted border border-brand-border hover:text-brand-text"}`}>
            最近{r}天
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-4">
        {statCards.map(({ Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-brand-border bg-brand-surface p-4 card-hover">
            <div className="flex items-center gap-2 mb-2">
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-xs text-brand-text-muted">{label}</span>
            </div>
            <div className={`text-2xl font-bold font-mono ${color}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <h3 className="text-sm font-medium text-brand-text mb-3">完成率趋势</h3>
          <ReactEChartsCore echarts={echarts} option={completionOption} style={{ height: 260 }} />
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <h3 className="text-sm font-medium text-brand-text mb-3">任务状态分布</h3>
          <ReactEChartsCore echarts={echarts} option={statusOption} style={{ height: 260 }} />
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <h3 className="text-sm font-medium text-brand-text mb-3">预警趋势</h3>
          <ReactEChartsCore echarts={echarts} option={alertOption} style={{ height: 260 }} />
        </div>
        <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
          <h3 className="text-sm font-medium text-brand-text mb-3">材料质量分析</h3>
          <ReactEChartsCore echarts={echarts} option={qualityOption} style={{ height: 260 }} />
        </div>
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden">
        <h3 className="text-sm font-medium text-brand-text p-4 pb-2">材料质量明细</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-border bg-brand-cyan/5">
              <th className="px-4 py-2.5 text-left text-brand-cyan font-medium">材料类型</th>
              <th className="px-4 py-2.5 text-right text-brand-cyan font-medium">任务数</th>
              <th className="px-4 py-2.5 text-right text-brand-cyan font-medium">完成数</th>
              <th className="px-4 py-2.5 text-right text-brand-cyan font-medium">平均孔隙率偏差</th>
              <th className="px-4 py-2.5 text-right text-brand-cyan font-medium">预警数</th>
              <th className="px-4 py-2.5 text-center text-brand-cyan font-medium">状态</th>
            </tr>
          </thead>
          <tbody>
            {matData.map((row, i) => (
              <tr key={row.material} className={`border-b border-brand-border/50 ${i % 2 ? "bg-brand-surface" : "bg-brand-bg/40"}`}>
                <td className="px-4 py-2.5 text-brand-text">{row.material}</td>
                <td className="px-4 py-2.5 text-right font-mono text-brand-text">{row.tasks}</td>
                <td className="px-4 py-2.5 text-right font-mono text-brand-green">{row.completed}</td>
                <td className="px-4 py-2.5 text-right font-mono text-brand-purple">{row.avgDev.toFixed(2)}%</td>
                <td className="px-4 py-2.5 text-right font-mono text-brand-orange">{row.alerts}</td>
                <td className="px-4 py-2.5 text-center">{badge(row.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
