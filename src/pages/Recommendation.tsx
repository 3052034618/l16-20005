import { useState } from "react";
import { useStore } from "@/store";
import { useNavigate } from "react-router-dom";
import { v4 } from "uuid";
import { Lightbulb, Zap, ArrowRight, GitCompare, X } from "lucide-react";
import { MockSimulationEngine } from "@/utils/mockEngine";
import type { Recommendation, SimulationTask } from "@/types";

const MATERIALS = ["Ti6Al4V", "IN718", "316L SS", "AlSi10Mg", "全部"] as const;
type MaterialFilter = (typeof MATERIALS)[number];

const MATERIAL_COLORS: Record<string, string> = {
  Ti6Al4V: "bg-brand-cyan/15 text-brand-cyan",
  IN718: "bg-brand-orange/15 text-brand-orange",
  "316L SS": "bg-brand-green/15 text-brand-green",
  AlSi10Mg: "bg-brand-purple/15 text-brand-purple",
};

function confidenceColor(c: number): string {
  if (c > 0.8) return "bg-brand-green";
  if (c > 0.6) return "bg-brand-cyan";
  return "bg-brand-yellow";
}

function confidenceTextColor(c: number): string {
  if (c > 0.8) return "text-brand-green";
  if (c > 0.6) return "text-brand-cyan";
  return "text-brand-yellow";
}

export default function Recommendation() {
  const { recommendations, addTask, getMaterialAlert } = useStore();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<MaterialFilter>("全部");
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [pausedTip, setPausedTip] = useState<string | null>(null);

  const filtered =
    filter === "全部"
      ? recommendations
      : recommendations.filter((r) => r.materialType === filter);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id];
      return [...prev, id];
    });
  };

  const compareItems = compareIds
    .map((cid) => recommendations.find((r) => r.id === cid))
    .filter(Boolean) as Recommendation[];

  const applyParams = (rec: Recommendation) => {
    const matAlert = getMaterialAlert(rec.materialType);
    if (matAlert?.isPaused) {
      setPausedTip(rec.materialType);
      setTimeout(() => setPausedTip(null), 3000);
      return;
    }

    const task: SimulationTask = {
      id: v4(),
      name: `${rec.materialType}-推荐-${Date.now().toString(36).toUpperCase()}`,
      status: "pending_validation",
      materialType: rec.materialType,
      powderParams: {
        material: rec.materialType,
        particleSize: 30,
        layerThickness: 0.03,
        packingDensity: 0.62,
      },
      laserParams: {
        power: rec.params.laserPower,
        scanSpeed: rec.params.scanSpeed,
        hatchSpacing: rec.params.hatchSpacing,
        scanStrategy: "stripe",
      },
      substrateParams: {
        temperature: rec.params.substrateTemp,
        preheatingEnabled: rec.params.substrateTemp > 100,
      },
      statusHistory: [{ status: "pending_validation", timestamp: Date.now() }],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: "推荐引擎",
    };

    addTask(task);

    const engine = new MockSimulationEngine(useStore as never);
    engine.startSimulation(task.id);

    navigate(`/simulation/${task.id}`);
  };

  const ParamRow = ({ label, value, unit }: { label: string; value: string; unit: string }) => (
    <tr className="border-b border-brand-border/50 last:border-0">
      <td className="py-1.5 pr-2 text-xs text-brand-text-muted">{label}</td>
      <td className="py-1.5 text-right text-xs font-medium text-brand-text">
        {value} <span className="text-brand-text-muted">{unit}</span>
      </td>
    </tr>
  );

  return (
    <div className="animate-fade-in space-y-6">
      {pausedTip && (
        <div className="fixed right-6 top-20 z-50 rounded-lg border border-brand-red/40 bg-brand-red/10 px-4 py-3 text-sm text-brand-red shadow-lg animate-slide-in-right">
          材料 {pausedTip} 已暂停，无法应用推荐参数
        </div>
      )}

      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold text-brand-text">
          <Lightbulb className="h-6 w-6 text-brand-cyan" />
          工艺推荐引擎
        </h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          基于历史模拟数据推荐最优工艺参数
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {MATERIALS.map((m) => (
          <button
            key={m}
            onClick={() => setFilter(m)}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-colors ${
              filter === m
                ? "bg-brand-cyan/15 text-brand-cyan border border-brand-cyan/30"
                : "bg-brand-surface text-brand-text-muted border border-brand-border hover:text-brand-text"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-brand-text-muted">
          <Lightbulb className="mx-auto mb-3 h-10 w-10 opacity-40" />
          <p>暂无推荐数据</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {filtered.map((rec) => {
            const isSelected = compareIds.includes(rec.id);
            const matAlert = getMaterialAlert(rec.materialType);
            const isPaused = matAlert?.isPaused ?? false;
            return (
              <div
                key={rec.id}
                className={`card-hover rounded-xl border bg-brand-surface p-5 ${
                  isSelected ? "border-brand-cyan/50" : "border-brand-border"
                } ${isPaused ? "opacity-60" : ""}`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                        MATERIAL_COLORS[rec.materialType] ?? "bg-brand-surface text-brand-text-muted"
                      }`}
                    >
                      {rec.materialType}
                    </span>
                    {isPaused && (
                      <span className="rounded-md bg-brand-red/20 px-2 py-0.5 text-[10px] font-medium text-brand-red">
                        已暂停
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => toggleCompare(rec.id)}
                    className={`rounded p-1 transition-colors ${
                      isSelected
                        ? "bg-brand-cyan/20 text-brand-cyan"
                        : "text-brand-text-muted hover:text-brand-text"
                    }`}
                    title="对比"
                  >
                    <GitCompare className="h-4 w-4" />
                  </button>
                </div>

                <table className="mb-4 w-full">
                  <tbody>
                    <ParamRow label="激光功率" value={rec.params.laserPower.toFixed(0)} unit="W" />
                    <ParamRow label="扫描速度" value={rec.params.scanSpeed.toFixed(0)} unit="mm/s" />
                    <ParamRow label="扫描间距" value={rec.params.hatchSpacing.toFixed(2)} unit="mm" />
                    <ParamRow label="基板温度" value={rec.params.substrateTemp.toFixed(0)} unit="°C" />
                  </tbody>
                </table>

                <div className="mb-4 rounded-lg bg-brand-bg/60 p-3">
                  <p className="mb-2 text-xs text-brand-text-muted">预期结果</p>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div>
                      <p className="font-semibold text-brand-text">
                        {(rec.expectedResults.porosity * 100).toFixed(1)}%
                      </p>
                      <p className="text-brand-text-muted">孔隙率</p>
                    </div>
                    <div>
                      <p className="font-semibold text-brand-text">
                        {rec.expectedResults.residualStress.toFixed(0)}
                      </p>
                      <p className="text-brand-text-muted">应力 MPa</p>
                    </div>
                    <div>
                      <p className="font-semibold text-brand-text">
                        {rec.expectedResults.meltPoolWidth.toFixed(3)}
                      </p>
                      <p className="text-brand-text-muted">熔池宽 mm</p>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs text-brand-text-muted">置信度</span>
                    <span className={`text-xs font-semibold ${confidenceTextColor(rec.confidence)}`}>
                      {(rec.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-brand-bg">
                    <div
                      className={`h-full rounded-full transition-all ${confidenceColor(rec.confidence)}`}
                      style={{ width: `${rec.confidence * 100}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-text-muted">
                    来源任务：{rec.sourceTaskIds.length} 个
                  </span>
                  <button
                    onClick={() => applyParams(rec)}
                    disabled={isPaused}
                    className={`flex items-center gap-1 rounded-lg px-4 py-2 text-xs font-medium transition-colors ${
                      isPaused
                        ? "cursor-not-allowed bg-brand-text-muted/20 text-brand-text-muted/60"
                        : "bg-brand-cyan/10 text-brand-cyan hover:bg-brand-cyan/20"
                    }`}
                  >
                    <Zap className="h-3.5 w-3.5" />
                    {isPaused ? "材料已暂停" : "应用参数"}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {compareItems.length === 2 && (
        <div className="rounded-xl border border-brand-cyan/30 bg-brand-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-brand-cyan">参数对比</h3>
            <button
              onClick={() => setCompareIds([])}
              className="text-brand-text-muted hover:text-brand-text"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center text-sm">
            <div />
            <div className="font-medium text-brand-cyan">{compareItems[0].materialType}</div>
            <div className="font-medium text-brand-orange">{compareItems[1].materialType}</div>

            {(
              [
                ["激光功率", "laserPower", "W"],
                ["扫描速度", "scanSpeed", "mm/s"],
                ["扫描间距", "hatchSpacing", "mm"],
                ["基板温度", "substrateTemp", "°C"],
              ] as const
            ).map(([label, key, unit]) => {
              const v0 = compareItems[0].params[key];
              const v1 = compareItems[1].params[key];
              const diff = Math.abs(v0 - v1);
              const highlight = diff / Math.max(v0, v1) > 0.1;
              return (
                <div key={key} className="contents">
                  <div className="py-1.5 text-xs text-brand-text-muted">{label}</div>
                  <div className={`py-1.5 ${highlight ? "font-semibold text-brand-cyan" : "text-brand-text"}`}>
                    {v0.toFixed(key === "hatchSpacing" ? 2 : 0)} <span className="text-brand-text-muted text-xs">{unit}</span>
                  </div>
                  <div className={`py-1.5 ${highlight ? "font-semibold text-brand-orange" : "text-brand-text"}`}>
                    {v1.toFixed(key === "hatchSpacing" ? 2 : 0)} <span className="text-brand-text-muted text-xs">{unit}</span>
                  </div>
                </div>
              );
            })}

            {(
              [
                ["孔隙率", "porosity", "%", 100],
                ["残余应力", "residualStress", "MPa", 1],
                ["熔池宽度", "meltPoolWidth", "mm", 1],
              ] as const
            ).map(([label, key, unit, mul]) => {
              const v0 = compareItems[0].expectedResults[key] * mul;
              const v1 = compareItems[1].expectedResults[key] * mul;
              return (
                <div key={key} className="contents">
                  <div className="border-t border-brand-border/50 py-1.5 text-xs text-brand-text-muted">{label}</div>
                  <div className="border-t border-brand-border/50 py-1.5 text-brand-text">
                    {key === "porosity" ? v0.toFixed(1) : key === "meltPoolWidth" ? v0.toFixed(3) : v0.toFixed(0)}{" "}
                    <span className="text-brand-text-muted text-xs">{unit}</span>
                  </div>
                  <div className="border-t border-brand-border/50 py-1.5 text-brand-text">
                    {key === "porosity" ? v1.toFixed(1) : key === "meltPoolWidth" ? v1.toFixed(3) : v1.toFixed(0)}{" "}
                    <span className="text-brand-text-muted text-xs">{unit}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
