import { useState, useEffect, useRef, useCallback } from "react";
import { useStore } from "@/store";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { LineChart, BarChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  MarkAreaComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { MockSimulationEngine } from "@/utils/mockEngine";
import {
  Activity,
  AlertTriangle,
  Thermometer,
  Snowflake,
  Play,
  ChevronDown,
  X,
  CheckCircle,
  AlertOctagon,
} from "lucide-react";
import type { Alert, AdjustStrategy } from "@/types";

echarts.use([
  LineChart,
  BarChart,
  GridComponent,
  TooltipComponent,
  MarkLineComponent,
  MarkAreaComponent,
  LegendComponent,
  CanvasRenderer,
]);

const ACTIVE_STATUSES = ["coupling_calculation", "melt_pool_analysis", "parsing"];

const STRATEGY_OPTIONS: { value: AdjustStrategy; label: string }[] = [
  { value: "laser_power", label: "调整激光功率" },
  { value: "scan_speed", label: "调整扫描速度" },
  { value: "manual", label: "人工干预" },
];

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toTimeString().slice(0, 8);
}

const AXIS_LABEL = { color: "#8B949E", fontSize: 11 };
const SPLIT_LINE = { lineStyle: { color: "#21262D" } };

export default function Monitor() {
  const { tasks, monitoringData, alerts } = useStore();
  const engineRef = useRef<MockSimulationEngine | null>(null);
  if (!engineRef.current) {
    engineRef.current = new MockSimulationEngine(useStore);
  }
  const engine = engineRef.current;

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [reviewAlertId, setReviewAlertId] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<AdjustStrategy>("laser_power");
  const [, setTick] = useState(0);

  const activeTasks = tasks.filter((t) =>
    ACTIVE_STATUSES.includes(t.status)
  );

  const pendingTasks = tasks.filter((t) => t.status === "pending_validation");

  const selectedTask = tasks.find((t) => t.id === selectedTaskId);

  const dataPoints = selectedTaskId
    ? monitoringData.get(selectedTaskId) ?? []
    : [];

  const taskAlerts = selectedTaskId
    ? alerts.filter((a) => a.taskId === selectedTaskId && a.status === "pending")
    : [];

  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 2000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (
      selectedTaskId &&
      selectedTask?.status === "coupling_calculation"
    ) {
      engine.startMonitoring(selectedTaskId);
    }
  }, [selectedTaskId, selectedTask?.status, engine]);

  const handleStartSimulation = useCallback(
    (taskId: string) => {
      engine.startSimulation(taskId);
      setSelectedTaskId(taskId);
    },
    [engine]
  );

  const handleConfirmReview = useCallback(() => {
    if (!reviewAlertId) return;
    engine.reviewAlert(reviewAlertId, strategy);
    setReviewAlertId(null);
  }, [reviewAlertId, strategy, engine]);

  const tempOption = {
    backgroundColor: "transparent",
    grid: { left: 60, right: 20, top: 30, bottom: 40 },
    tooltip: {
      trigger: "axis" as const,
      backgroundColor: "#161B22",
      borderColor: "#21262D",
      textStyle: { color: "#E6EDF3", fontSize: 12 },
    },
    xAxis: {
      type: "category" as const,
      data: dataPoints.map((d) => formatTime(d.timestamp)),
      axisLabel: AXIS_LABEL,
      splitLine: SPLIT_LINE,
      axisLine: { lineStyle: { color: "#21262D" } },
    },
    yAxis: {
      type: "value" as const,
      name: "温度 (°C)",
      nameTextStyle: { color: "#8B949E" },
      axisLabel: AXIS_LABEL,
      splitLine: SPLIT_LINE,
      axisLine: { lineStyle: { color: "#21262D" } },
    },
    series: [
      {
        type: "line",
        smooth: true,
        data: dataPoints.map((d) => d.temperature),
        lineStyle: { color: "#00D4FF", width: 2 },
        itemStyle: { color: "#00D4FF" },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "rgba(0,212,255,0.35)" },
            { offset: 1, color: "rgba(0,212,255,0.02)" },
          ]),
        },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: "#FF4757", type: "dashed" as const, width: 2 },
          label: {
            formatter: "安全阈值 2500°C",
            color: "#FF4757",
            fontSize: 11,
          },
          data: [{ yAxis: 2500 }],
        },
        markArea: {
          silent: true,
          data: [
            [
              {
                yAxis: 2500,
                itemStyle: {
                  color: "rgba(255,71,87,0.08)",
                },
              },
              { yAxis: 4000 },
            ],
          ],
        },
      },
    ],
  };

  const coolingOption = {
    backgroundColor: "transparent",
    grid: { left: 60, right: 20, top: 30, bottom: 40 },
    tooltip: {
      trigger: "axis" as const,
      backgroundColor: "#161B22",
      borderColor: "#21262D",
      textStyle: { color: "#E6EDF3", fontSize: 12 },
    },
    legend: {
      data: ["冷却速率", "超限标记"],
      textStyle: { color: "#8B949E", fontSize: 11 },
      top: 0,
    },
    xAxis: {
      type: "category" as const,
      data: dataPoints.map((d) => formatTime(d.timestamp)),
      axisLabel: AXIS_LABEL,
      splitLine: SPLIT_LINE,
      axisLine: { lineStyle: { color: "#21262D" } },
    },
    yAxis: {
      type: "value" as const,
      name: "×10⁵ °C/s",
      nameTextStyle: { color: "#8B949E" },
      axisLabel: AXIS_LABEL,
      splitLine: SPLIT_LINE,
      axisLine: { lineStyle: { color: "#21262D" } },
    },
    series: [
      {
        name: "冷却速率",
        type: "line",
        smooth: true,
        data: dataPoints.map((d) => +(d.coolingRate / 1e5).toFixed(2)),
        lineStyle: { color: "#A78BFA", width: 2 },
        itemStyle: { color: "#A78BFA" },
        markLine: {
          silent: true,
          symbol: "none",
          lineStyle: { color: "#FF4757", type: "dashed" as const, width: 2 },
          label: {
            formatter: "安全阈值",
            color: "#FF4757",
            fontSize: 11,
          },
          data: [{ yAxis: 15 }],
        },
      },
      {
        name: "超限标记",
        type: "bar",
        data: dataPoints.map((d) =>
          d.thresholdExceeded ? +(d.coolingRate / 1e5).toFixed(2) : 0
        ),
        itemStyle: { color: "#FF6B35", opacity: 0.7 },
        barWidth: 3,
      },
    ],
  };

  const severityIcon = (severity: Alert["severity"]) =>
    severity === "critical" ? (
      <AlertOctagon className="h-4 w-4 text-brand-red" />
    ) : (
      <AlertTriangle className="h-4 w-4 text-brand-orange" />
    );

  const severityStripe = (severity: Alert["severity"]) =>
    severity === "critical" ? "border-l-brand-red" : "border-l-brand-orange";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <div className="relative">
          <select
            value={selectedTaskId ?? ""}
            onChange={(e) => setSelectedTaskId(e.target.value || null)}
            className="appearance-none rounded-lg border border-brand-border bg-brand-surface px-4 py-2 pr-8 text-sm text-brand-text outline-none focus:border-brand-cyan"
          >
            <option value="">选择监控任务</option>
            {activeTasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.status})
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-text-muted" />
        </div>

        {pendingTasks.map((t) => (
          <button
            key={t.id}
            onClick={() => handleStartSimulation(t.id)}
            className="flex items-center gap-2 rounded-lg bg-brand-cyan/10 px-4 py-2 text-sm font-medium text-brand-cyan transition-colors hover:bg-brand-cyan/20"
          >
            <Play className="h-4 w-4" />
            启动模拟 - {t.name}
          </button>
        ))}

        {!activeTasks.length && !pendingTasks.length && (
          <span className="text-sm text-brand-text-muted">
            暂无运行中的模拟任务
          </span>
        )}
      </div>

      {selectedTaskId && (
        <>
          <div className="grid grid-cols-5 gap-5">
            <div className="col-span-3 rounded-xl border border-brand-border bg-brand-surface p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-brand-text">
                <Thermometer className="h-4 w-4 text-brand-cyan" />
                温度曲线
              </div>
              <ReactEChartsCore
                echarts={echarts}
                option={tempOption}
                style={{ height: 320 }}
                notMerge
              />
            </div>
            <div className="col-span-2 rounded-xl border border-brand-border bg-brand-surface p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-brand-text">
                <Snowflake className="h-4 w-4 text-brand-purple" />
                冷却速率
              </div>
              <ReactEChartsCore
                echarts={echarts}
                option={coolingOption}
                style={{ height: 320 }}
                notMerge
              />
            </div>
          </div>

          <div className="rounded-xl border border-brand-border bg-brand-surface p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-brand-text">
              <Activity className="h-4 w-4 text-brand-orange" />
              活跃预警
              {taskAlerts.length > 0 && (
                <span className="rounded-full bg-brand-red/20 px-2 py-0.5 text-xs text-brand-red">
                  {taskAlerts.length}
                </span>
              )}
            </div>
            {taskAlerts.length === 0 ? (
              <p className="py-6 text-center text-sm text-brand-text-muted">
                暂无活跃预警
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {taskAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-center gap-3 rounded-lg border border-brand-border border-l-4 ${severityStripe(alert.severity)} bg-brand-bg px-4 py-3`}
                  >
                    {severityIcon(alert.severity)}
                    <span className="flex-1 text-sm text-brand-text">
                      {alert.message}
                    </span>
                    <span className="text-xs text-brand-text-muted">
                      {formatTime(alert.createdAt)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        alert.severity === "critical"
                          ? "bg-brand-red/20 text-brand-red"
                          : "bg-brand-orange/20 text-brand-orange"
                      }`}
                    >
                      {alert.severity === "critical" ? "严重" : "警告"}
                    </span>
                    <button
                      onClick={() => {
                        setReviewAlertId(alert.id);
                        setStrategy("laser_power");
                      }}
                      className="rounded bg-brand-cyan/10 px-3 py-1 text-xs text-brand-cyan transition-colors hover:bg-brand-cyan/20"
                    >
                      复核
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {reviewAlertId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-96 rounded-xl border border-brand-border bg-brand-surface p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-brand-text">
                预警复核
              </h3>
              <button
                onClick={() => setReviewAlertId(null)}
                className="text-brand-text-muted hover:text-brand-text"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="mb-4 flex flex-col gap-2">
              {STRATEGY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
                    strategy === opt.value
                      ? "border-brand-cyan bg-brand-cyan/10 text-brand-cyan"
                      : "border-brand-border text-brand-text-muted hover:border-brand-border-light"
                  }`}
                >
                  <input
                    type="radio"
                    name="strategy"
                    value={opt.value}
                    checked={strategy === opt.value}
                    onChange={() => setStrategy(opt.value)}
                    className="accent-brand-cyan"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
            <button
              onClick={handleConfirmReview}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-cyan py-2 text-sm font-medium text-brand-bg transition-colors hover:bg-brand-cyan-dim"
            >
              <CheckCircle className="h-4 w-4" />
              确认复核
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
