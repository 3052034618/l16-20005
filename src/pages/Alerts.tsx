import { useState } from "react";
import { useStore } from "@/store";
import {
  Thermometer,
  TrendingDown,
  CircleDot,
  Zap,
  Gauge,
  Wrench,
  AlertTriangle,
  X,
} from "lucide-react";
import { MockSimulationEngine } from "@/utils/mockEngine";
import type { Alert, AlertType, AlertSeverity, AlertStatus, AdjustStrategy } from "@/types";

type SeverityFilter = "all" | AlertSeverity;
type StatusFilter = "all" | AlertStatus;
type TypeFilter = "all" | AlertType;

let engine: MockSimulationEngine | null = null;
function getEngine() {
  if (!engine) engine = new MockSimulationEngine(useStore);
  return engine;
}

const TYPE_ICONS: Record<AlertType, typeof Thermometer> = {
  temperature: Thermometer,
  cooling_rate: TrendingDown,
  porosity: CircleDot,
};

const TYPE_LABELS: Record<AlertType, string> = {
  temperature: "温度",
  cooling_rate: "冷却速率",
  porosity: "孔隙率",
};

const SEVERITY_CONFIG: Record<AlertSeverity, { label: string; className: string; border: string }> = {
  warning: { label: "警告", className: "bg-brand-orange/15 text-brand-orange", border: "border-l-brand-orange" },
  critical: { label: "严重", className: "bg-brand-red/15 text-brand-red", border: "border-l-brand-red" },
};

const STATUS_LABELS: Record<AlertStatus, { label: string; className: string }> = {
  pending: { label: "待处理", className: "bg-brand-yellow/15 text-brand-yellow" },
  reviewing: { label: "复核中", className: "bg-brand-cyan/15 text-brand-cyan" },
  adjusted: { label: "已调整", className: "bg-brand-green/15 text-brand-green" },
  dismissed: { label: "已忽略", className: "bg-brand-text-muted/15 text-brand-text-muted" },
};

const STRATEGY_OPTIONS: { key: AdjustStrategy; label: string; icon: typeof Zap }[] = [
  { key: "laser_power", label: "调整激光功率", icon: Zap },
  { key: "scan_speed", label: "调整扫描速度", icon: Gauge },
  { key: "manual", label: "人工干预", icon: Wrench },
];

function relativeTime(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return `${Math.floor(diff / 86400000)} 天前`;
}

export default function AlertsPage() {
  const { alerts, tasks, materialAlerts, updateAlert, updateMaterialAlert } = useStore();
  const [sevFilter, setSevFilter] = useState<SeverityFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [strategy, setStrategy] = useState<AdjustStrategy>("laser_power");
  const [laserPower, setLaserPower] = useState(300);
  const [scanSpeed, setScanSpeed] = useState(1000);

  const pausedMaterials = materialAlerts.filter((ma) => ma.isPaused);

  const filtered = alerts.filter((a) => {
    if (sevFilter !== "all" && a.severity !== sevFilter) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (typeFilter !== "all" && a.type !== typeFilter) return false;
    return true;
  });

  const totalAlerts = alerts.length;
  const pendingAlerts = alerts.filter((a) => a.status === "pending").length;
  const criticalAlerts = alerts.filter((a) => a.severity === "critical").length;
  const adjustedAlerts = alerts.filter((a) => a.status === "adjusted").length;

  const handleReview = (alertId: string) => {
    updateAlert(alertId, { status: "reviewing" });
    setExpandedId(alertId);
    setStrategy("laser_power");
  };

  const handleConfirm = (alertId: string) => {
    getEngine().reviewAlert(alertId, strategy);
    setExpandedId(null);
  };

  const handleDismiss = (alertId: string) => {
    updateAlert(alertId, {
      status: "dismissed",
      reviewedBy: useStore.getState().currentUser.name,
      reviewedAt: Date.now(),
    });
    setExpandedId(null);
  };

  const handleUnpause = (materialType: string) => {
    updateMaterialAlert(materialType, { isPaused: false });
  };

  const stats = [
    { label: "总预警", value: totalAlerts, color: "text-brand-text" },
    { label: "待处理", value: pendingAlerts, color: "text-brand-yellow" },
    { label: "严重", value: criticalAlerts, color: "text-brand-red" },
    { label: "已调整", value: adjustedAlerts, color: "text-brand-green" },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-text">预警中心</h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          实时监测模拟异常，提供智能调整策略
        </p>
      </div>

      {pausedMaterials.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-brand-orange/30 bg-brand-orange/10 px-4 py-3">
          <AlertTriangle className="h-5 w-5 shrink-0 text-brand-orange" />
          <div className="flex-1 text-sm text-brand-orange">
            {pausedMaterials.map((ma) => (
              <span key={ma.id} className="mr-4">
                ⚠ [{ma.materialType}] 已暂停 - 连续{ma.consecutiveDeviations}次孔隙率偏差超20%，新任务已自动暂停
              </span>
            ))}
          </div>
          {pausedMaterials.map((ma) => (
            <button
              key={ma.id}
              onClick={() => handleUnpause(ma.materialType)}
              className="shrink-0 rounded-md bg-brand-orange/20 px-3 py-1 text-xs font-medium text-brand-orange transition-colors hover:bg-brand-orange/30"
            >
              解除暂停
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-brand-border bg-brand-surface px-4 py-3">
            <div className="text-xs text-brand-text-muted">{s.label}</div>
            <div className={`mt-1 text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex gap-1 rounded-lg bg-brand-surface p-1">
          {(["all", "warning", "critical"] as SeverityFilter[]).map((v) => (
            <button
              key={v}
              onClick={() => setSevFilter(v)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                sevFilter === v ? "bg-brand-border text-brand-text" : "text-brand-text-muted hover:text-brand-text"
              }`}
            >
              {v === "all" ? "全部" : v === "warning" ? "警告" : "严重"}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg bg-brand-surface p-1">
          {(["all", "pending", "reviewing", "adjusted", "dismissed"] as StatusFilter[]).map((v) => (
            <button
              key={v}
              onClick={() => setStatusFilter(v)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === v ? "bg-brand-border text-brand-text" : "text-brand-text-muted hover:text-brand-text"
              }`}
            >
              {v === "all" ? "全部" : STATUS_LABELS[v].label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 rounded-lg bg-brand-surface p-1">
          {(["all", "temperature", "cooling_rate", "porosity"] as TypeFilter[]).map((v) => (
            <button
              key={v}
              onClick={() => setTypeFilter(v)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === v ? "bg-brand-border text-brand-text" : "text-brand-text-muted hover:text-brand-text"
              }`}
            >
              {v === "all" ? "全部" : TYPE_LABELS[v]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-brand-text-muted">暂无预警记录</div>
        )}
        {filtered.map((alert) => {
          const task = tasks.find((t) => t.id === alert.taskId);
          const sevConf = SEVERITY_CONFIG[alert.severity];
          const TypeIcon = TYPE_ICONS[alert.type];
          const isExpanded = expandedId === alert.id;
          const canReview = alert.status === "pending" || alert.status === "reviewing";

          return (
            <div
              key={alert.id}
              className={`card-hover rounded-lg border border-brand-border border-l-4 ${sevConf.border} bg-brand-surface`}
            >
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TypeIcon className="h-4 w-4 text-brand-text-muted" />
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${sevConf.className}`}>
                      {sevConf.label}
                    </span>
                    <span className="text-sm text-brand-text">{alert.message}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {task && (
                      <span className="text-xs text-brand-text-muted">{task.name}</span>
                    )}
                    <span className="text-xs text-brand-text-muted">{relativeTime(alert.createdAt)}</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-medium ${STATUS_LABELS[alert.status].className}`}>
                      {STATUS_LABELS[alert.status].label}
                    </span>
                  </div>
                </div>

                {canReview && !isExpanded && (
                  <div className="mt-3 flex justify-end border-t border-brand-border pt-3">
                    <button
                      onClick={() => handleReview(alert.id)}
                      className="rounded-md bg-brand-cyan/15 px-3 py-1.5 text-xs font-medium text-brand-cyan transition-colors hover:bg-brand-cyan/25"
                    >
                      复核
                    </button>
                  </div>
                )}

                {!canReview && alert.reviewedBy && (
                  <div className="mt-3 border-t border-brand-border pt-3 text-xs text-brand-text-muted">
                    <span>处理人: {alert.reviewedBy}</span>
                    {alert.reviewedAt && <span className="ml-4">{relativeTime(alert.reviewedAt)}</span>}
                    {alert.adjustStrategy && (
                      <span className="ml-4">
                        策略: {STRATEGY_OPTIONS.find((s) => s.key === alert.adjustStrategy)?.label}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {isExpanded && (
                <div className="border-t border-brand-border bg-brand-bg/50 p-4 animate-slide-up">
                  <div className="mb-3 text-xs font-medium text-brand-text-muted">选择调整策略</div>
                  <div className="flex gap-2">
                    {STRATEGY_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => setStrategy(opt.key)}
                        className={`flex items-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                          strategy === opt.key
                            ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30"
                            : "border border-brand-border text-brand-text-muted hover:text-brand-text"
                        }`}
                      >
                        <opt.icon className="h-3.5 w-3.5" />
                        {opt.label}
                      </button>
                    ))}
                  </div>

                  {strategy === "laser_power" && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-brand-text-muted">
                        <span>激光功率调整</span>
                        <span className="font-mono text-brand-cyan">{laserPower}W</span>
                      </div>
                      <input
                        type="range"
                        min={100}
                        max={500}
                        value={laserPower}
                        onChange={(e) => setLaserPower(Number(e.target.value))}
                        className="mt-1 w-full accent-brand-cyan"
                      />
                      <div className="flex justify-between text-[10px] text-brand-text-muted">
                        <span>100W</span><span>500W</span>
                      </div>
                    </div>
                  )}

                  {strategy === "scan_speed" && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-brand-text-muted">
                        <span>扫描速度调整</span>
                        <span className="font-mono text-brand-cyan">{scanSpeed} mm/s</span>
                      </div>
                      <input
                        type="range"
                        min={200}
                        max={2000}
                        value={scanSpeed}
                        onChange={(e) => setScanSpeed(Number(e.target.value))}
                        className="mt-1 w-full accent-brand-cyan"
                      />
                      <div className="flex justify-between text-[10px] text-brand-text-muted">
                        <span>200 mm/s</span><span>2000 mm/s</span>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end gap-3">
                    <button
                      onClick={() => handleDismiss(alert.id)}
                      className="rounded-md bg-brand-text-muted/10 px-3 py-1.5 text-xs font-medium text-brand-text-muted transition-colors hover:bg-brand-text-muted/20"
                    >
                      忽略预警
                    </button>
                    <button
                      onClick={() => handleConfirm(alert.id)}
                      className="rounded-md bg-brand-green/15 px-3 py-1.5 text-xs font-medium text-brand-green transition-colors hover:bg-brand-green/25"
                    >
                      确认调整
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
