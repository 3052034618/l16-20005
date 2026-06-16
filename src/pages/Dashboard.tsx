import { useMemo } from "react";
import { useStore } from "@/store";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { PieChart, LineChart } from "echarts/charts";
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
  GraphicComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Activity, AlertTriangle, CheckSquare } from "lucide-react";
import type { TaskStatus, AlertSeverity } from "@/types";

echarts.use([
  PieChart,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  MarkLineComponent,
  GraphicComponent,
  CanvasRenderer,
]);

const STATUS_LABEL: Record<TaskStatus, string> = {
  pending_validation: "待校验",
  parsing: "参数解析",
  coupling_calculation: "耦合计算",
  melt_pool_analysis: "熔池分析",
  completed: "已完成",
  error_rollback: "异常回退",
};

const STATUS_COLORS: Record<TaskStatus, string> = {
  pending_validation: "#8B949E",
  parsing: "#A78BFA",
  coupling_calculation: "#00D4FF",
  melt_pool_analysis: "#FBBF24",
  completed: "#00E5A0",
  error_rollback: "#FF4757",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "刚刚";
  if (min < 60) return `${min}分钟前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}小时前`;
  return `${Math.floor(hr / 24)}天前`;
}

const SEVERITY_STRIPE: Record<AlertSeverity, string> = {
  warning: "bg-brand-orange",
  critical: "bg-brand-red",
};

const SEVERITY_BADGE: Record<AlertSeverity, string> = {
  warning: "bg-brand-orange/20 text-brand-orange",
  critical: "bg-brand-red/20 text-brand-red",
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-brand-yellow/20 text-brand-yellow",
  reviewing: "bg-brand-cyan/20 text-brand-cyan",
  adjusted: "bg-brand-green/20 text-brand-green",
  dismissed: "bg-brand-text-muted/20 text-brand-text-muted",
};

const STATUS_BADGE_LABEL: Record<string, string> = {
  pending: "待处理",
  reviewing: "审查中",
  adjusted: "已调整",
  dismissed: "已忽略",
};

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="relative bg-brand-surface border border-brand-border rounded-xl p-5 overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{ backgroundColor: accent, boxShadow: `0 0 8px ${accent}` }}
      />
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-3xl font-bold" style={{ color: accent }}>
            {value}
          </div>
          <div className="text-sm text-brand-text-muted mt-1">{label}</div>
        </div>
        <Icon className="w-6 h-6 text-brand-text-muted" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { tasks, alerts, approvals, dailyStats } = useStore();

  const completionRate = useMemo(() => {
    const total = tasks.length;
    if (total === 0) return "0%";
    const done = tasks.filter((t) => t.status === "completed").length;
    return `${Math.round((done / total) * 100)}%`;
  }, [tasks]);

  const runningCount = useMemo(
    () =>
      tasks.filter((t) =>
        ["parsing", "coupling_calculation", "melt_pool_analysis"].includes(t.status)
      ).length,
    [tasks]
  );

  const pendingAlerts = useMemo(
    () => alerts.filter((a) => a.status === "pending").length,
    [alerts]
  );

  const pendingApprovals = useMemo(
    () => approvals.filter((a) => a.status === "pending").length,
    [approvals]
  );

  const recentAlerts = useMemo(
    () => [...alerts].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
    [alerts]
  );

  const pieOption = useMemo(() => {
    const counts: Record<string, number> = {};
    tasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    const data = Object.entries(counts).map(([status, value]) => ({
      name: STATUS_LABEL[status as TaskStatus],
      value,
      itemStyle: { color: STATUS_COLORS[status as TaskStatus] },
    }));
    return {
      backgroundColor: "transparent",
      title: {
        text: "任务状态分布",
        left: "center",
        top: 0,
        textStyle: { color: "#E6EDF3", fontSize: 14, fontWeight: 500 },
      },
      tooltip: {
        trigger: "item",
        backgroundColor: "#161B22",
        borderColor: "#30363D",
        textStyle: { color: "#E6EDF3" },
      },
      legend: {
        bottom: 0,
        textStyle: { color: "#8B949E", fontSize: 11 },
        itemWidth: 10,
        itemHeight: 10,
      },
      series: [
        {
          type: "pie",
          radius: ["40%", "65%"],
          center: ["50%", "48%"],
          avoidLabelOverlap: true,
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 12, color: "#E6EDF3" },
          },
          data,
        },
      ],
      graphic: [
        {
          type: "text",
          left: "center",
          top: "42%",
          style: {
            text: String(tasks.length),
            textAlign: "center",
            fill: "#E6EDF3",
            fontSize: 22,
            fontWeight: "bold",
            fontFamily: "JetBrains Mono, monospace",
          },
        },
        {
          type: "text",
          left: "center",
          top: "52%",
          style: {
            text: "总任务",
            textAlign: "center",
            fill: "#8B949E",
            fontSize: 11,
          },
        },
      ],
    };
  }, [tasks]);

  const lineOption = useMemo(() => {
    const last14 = dailyStats.slice(-14);
    const dates = last14.map((d) => d.date);
    const values = last14.map((d) => +(d.avgPorosityDeviation * 100).toFixed(1));
    return {
      backgroundColor: "transparent",
      title: {
        text: "材料质量趋势",
        left: "center",
        top: 0,
        textStyle: { color: "#E6EDF3", fontSize: 14, fontWeight: 500 },
      },
      tooltip: {
        trigger: "axis",
        backgroundColor: "#161B22",
        borderColor: "#30363D",
        textStyle: { color: "#E6EDF3" },
        formatter: (params: any) => {
          const p = params[0];
          return `${p.axisValue}<br/>气孔率偏差: ${p.value}%`;
        },
      },
      grid: { left: 50, right: 20, top: 40, bottom: 30 },
      xAxis: {
        type: "category",
        data: dates,
        axisLabel: { color: "#8B949E", fontSize: 10, rotate: 30 },
        axisLine: { lineStyle: { color: "#30363D" } },
        axisTick: { show: false },
      },
      yAxis: {
        type: "value",
        axisLabel: { color: "#8B949E", fontSize: 10, formatter: "{value}%" },
        splitLine: { lineStyle: { color: "#21262D" } },
        axisLine: { show: false },
      },
      series: [
        {
          type: "line",
          data: values.map((v) => ({
            value: v,
            itemStyle:
              v > 20
                ? { color: "#FF4757", borderColor: "#FF4757", borderWidth: 2 }
                : { color: "#FF6B35" },
          })),
          smooth: true,
          lineStyle: { color: "#FF6B35", width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: "rgba(255,107,53,0.25)" },
              { offset: 1, color: "rgba(255,107,53,0)" },
            ]),
          },
          symbolSize: values.map((v) => (v > 20 ? 8 : 4)),
          markLine: {
            silent: true,
            symbol: "none",
            lineStyle: { color: "#FF4757", type: "dashed", width: 1 },
            data: [{ yAxis: 20, label: { formatter: "阈值 20%", color: "#FF4757", fontSize: 10 } }],
          },
        },
      ],
    };
  }, [dailyStats]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="今日完成率" value={completionRate} icon={TrendingUp} accent="#00D4FF" />
        <StatCard label="运行中任务" value={runningCount} icon={Activity} accent="#00D4FF" />
        <StatCard label="待处理预警" value={pendingAlerts} icon={AlertTriangle} accent="#FF6B35" />
        <StatCard label="待审批" value={pendingApprovals} icon={CheckSquare} accent="#A78BFA" />
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 bg-brand-surface border border-brand-border rounded-xl p-4">
          <ReactEChartsCore echarts={echarts} option={pieOption} style={{ height: 320 }} />
        </div>

        <div className="col-span-4 bg-brand-surface border border-brand-border rounded-xl p-4">
          <ReactEChartsCore echarts={echarts} option={lineOption} style={{ height: 320 }} />
        </div>

        <div className="col-span-3 bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col">
          <h3 className="text-sm font-medium text-brand-text mb-3">最近预警</h3>
          <div className="flex-1 space-y-2 overflow-auto">
            {recentAlerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-stretch gap-3 bg-brand-bg rounded-lg px-3 py-2 cursor-pointer hover:bg-brand-border/40 transition-colors"
                onClick={() => navigate("/alerts")}
              >
                <div className={`w-1 rounded-full shrink-0 ${SEVERITY_STRIPE[alert.severity]}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${SEVERITY_BADGE[alert.severity]}`}>
                      {alert.severity === "critical" ? "严重" : "警告"}
                    </span>
                    <span className="text-[10px] text-brand-text-muted">{timeAgo(alert.createdAt)}</span>
                  </div>
                  <p className="text-xs text-brand-text truncate">{alert.message}</p>
                  <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded mt-1 ${STATUS_BADGE[alert.status] || ""}`}>
                    {STATUS_BADGE_LABEL[alert.status] || alert.status}
                  </span>
                </div>
              </div>
            ))}
            {recentAlerts.length === 0 && (
              <p className="text-xs text-brand-text-muted text-center py-4">暂无预警</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
