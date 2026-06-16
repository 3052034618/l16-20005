import { useParams, useNavigate, Link } from "react-router-dom";
import { useStore } from "@/store";
import ReactEChartsCore from "echarts-for-react/lib/core";
import * as echarts from "echarts/core";
import { BarChart } from "echarts/charts";
import { GridComponent, TooltipComponent, TitleComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { ArrowLeft, Download, FileText, AlertTriangle, CheckCircle } from "lucide-react";

echarts.use([BarChart, GridComponent, TooltipComponent, TitleComponent, CanvasRenderer]);

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { reports, tasks } = useStore();

  const report = reports.find((r) => r.id === id);
  const task = report ? tasks.find((t) => t.id === report.taskId) : undefined;

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-brand-text-muted">
        <FileText className="mb-4 h-12 w-12 opacity-40" />
        <p className="mb-4">未找到该报告</p>
        <Link to="/reports" className="text-sm text-brand-cyan hover:underline">
          返回报告列表
        </Link>
      </div>
    );
  }

  const mp = report.meltPoolMorphology;
  const tf = report.temperatureField;
  const rs = report.residualStress;
  const porosityPercent = (report.porosityDeviation * 100).toFixed(1);
  const isPorosityHigh = report.porosityDeviation >= 0.2;

  const stressPositions = ["起点", "1/4", "中点", "3/4", "终点"];
  const stressValues = stressPositions.map((_, i) => {
    const base = rs.maxStress;
    const offsets = [0.65, 0.85, 1.0, 0.78, 0.55];
    return Math.round(base * offsets[i]);
  });

  const barOption = {
    tooltip: { trigger: "axis" as const },
    grid: { left: 50, right: 20, top: 20, bottom: 40 },
    xAxis: {
      type: "category" as const,
      data: stressPositions,
      axisLine: { lineStyle: { color: "#30363D" } },
      axisLabel: { color: "#8B949E", fontSize: 11 },
    },
    yAxis: {
      type: "value" as const,
      name: "MPa",
      nameTextStyle: { color: "#8B949E", fontSize: 11 },
      axisLine: { lineStyle: { color: "#30363D" } },
      axisLabel: { color: "#8B949E", fontSize: 11 },
      splitLine: { lineStyle: { color: "#21262D" } },
    },
    series: [
      {
        type: "bar" as const,
        data: stressValues.map((v) => ({
          value: v,
          itemStyle: {
            color:
              v > rs.maxStress * 0.9
                ? "#FF4757"
                : v > rs.maxStress * 0.7
                ? "#FF6B35"
                : "#00E5A0",
          },
        })),
        barWidth: "50%",
      },
    ],
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/reports")}
          className="rounded-lg p-2 text-brand-text-muted transition-colors hover:bg-brand-surface hover:text-brand-text"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h2 className="text-xl font-bold text-brand-text">
            报告详情
            <span className="ml-3 font-mono text-sm text-brand-cyan">
              {report.id.slice(0, 8).toUpperCase()}
            </span>
          </h2>
          <p className="mt-0.5 text-sm text-brand-text-muted">
            关联任务：{task?.name ?? "未知"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-brand-cyan">熔池形貌</h3>
          <div className="mb-4 flex h-44 items-center justify-center overflow-hidden rounded-lg bg-brand-bg">
            <div
              className="relative"
              style={{ width: 180, height: 100 }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  inset: 0,
                  background:
                    "radial-gradient(ellipse at center, #FFFFFF 0%, #FFD93D 18%, #FF6B35 40%, #FF4757 65%, #1a0a0a 100%)",
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-brand-bg/60 px-2 py-2">
              <p className="text-xs text-brand-text-muted">宽度</p>
              <p className="text-sm font-semibold text-brand-text">{mp.width.toFixed(3)}</p>
              <p className="text-[10px] text-brand-text-muted">mm</p>
            </div>
            <div className="rounded-lg bg-brand-bg/60 px-2 py-2">
              <p className="text-xs text-brand-text-muted">深度</p>
              <p className="text-sm font-semibold text-brand-text">{mp.depth.toFixed(3)}</p>
              <p className="text-[10px] text-brand-text-muted">mm</p>
            </div>
            <div className="rounded-lg bg-brand-bg/60 px-2 py-2">
              <p className="text-xs text-brand-text-muted">长度</p>
              <p className="text-sm font-semibold text-brand-text">{mp.length.toFixed(3)}</p>
              <p className="text-[10px] text-brand-text-muted">mm</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-brand-orange">温度场</h3>
          <div className="mb-4 flex h-44 items-center justify-center overflow-hidden rounded-lg bg-brand-bg">
            <div
              className="relative"
              style={{ width: 200, height: 120 }}
            >
              <div
                className="absolute rounded-full"
                style={{
                  inset: 0,
                  background:
                    "radial-gradient(circle at center, #FFFFFF 0%, #FFD93D 12%, #FF6B35 30%, #FF4757 50%, #8B0000 70%, #0D1117 100%)",
                }}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-brand-bg/60 px-2 py-2">
              <p className="text-xs text-brand-text-muted">最高温度</p>
              <p className="text-sm font-semibold text-brand-text">{tf.maxTemp.toFixed(0)}</p>
              <p className="text-[10px] text-brand-text-muted">°C</p>
            </div>
            <div className="rounded-lg bg-brand-bg/60 px-2 py-2">
              <p className="text-xs text-brand-text-muted">平均温度</p>
              <p className="text-sm font-semibold text-brand-text">{tf.avgTemp.toFixed(0)}</p>
              <p className="text-[10px] text-brand-text-muted">°C</p>
            </div>
            <div className="rounded-lg bg-brand-bg/60 px-2 py-2">
              <p className="text-xs text-brand-text-muted">温度梯度</p>
              <p className="text-sm font-semibold text-brand-text">{(tf.gradient / 1e6).toFixed(2)}</p>
              <p className="text-[10px] text-brand-text-muted">×10⁶ °C/m</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
          <h3 className="mb-4 text-sm font-semibold text-brand-green">残余应力分布</h3>
          <div className="mb-4 h-44">
            <ReactEChartsCore
              echarts={echarts}
              option={barOption}
              style={{ height: "100%", width: "100%" }}
              notMerge
              lazyUpdate
            />
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-lg bg-brand-bg/60 px-2 py-2">
              <p className="text-xs text-brand-text-muted">最大应力</p>
              <p className="text-sm font-semibold text-brand-text">{rs.maxStress.toFixed(0)}</p>
              <p className="text-[10px] text-brand-text-muted">MPa</p>
            </div>
            <div className="rounded-lg bg-brand-bg/60 px-2 py-2">
              <p className="text-xs text-brand-text-muted">分布类型</p>
              <p className="text-sm font-semibold text-brand-text">{rs.distribution}</p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`rounded-xl border p-5 ${
          isPorosityHigh
            ? "border-brand-orange/40 bg-brand-orange/5"
            : "border-brand-border bg-brand-surface"
        }`}
      >
        <div className="flex items-center gap-3">
          {isPorosityHigh ? (
            <AlertTriangle className="h-5 w-5 text-brand-orange" />
          ) : (
            <CheckCircle className="h-5 w-5 text-brand-green" />
          )}
          <div>
            <h3 className="text-sm font-semibold text-brand-text">孔隙率偏差</h3>
            <p className="text-xs text-brand-text-muted">
              {isPorosityHigh
                ? "偏差超过 20%，建议优化工艺参数"
                : "偏差在可接受范围内"}
            </p>
          </div>
          <span
            className={`ml-auto font-mono text-lg font-bold ${
              isPorosityHigh ? "text-brand-orange" : "text-brand-green"
            }`}
          >
            {porosityPercent}%
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => navigate("/reports")}
          className="rounded-lg border border-brand-border px-5 py-2.5 text-sm text-brand-text-muted transition-colors hover:bg-brand-surface hover:text-brand-text"
        >
          返回列表
        </button>
        <button className="flex items-center gap-2 rounded-lg bg-brand-cyan/10 px-5 py-2.5 text-sm font-medium text-brand-cyan transition-colors hover:bg-brand-cyan/20">
          <Download className="h-4 w-4" />下载 PDF
        </button>
      </div>
    </div>
  );
}
