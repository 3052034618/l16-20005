import { useState } from "react";
import { useStore } from "@/store";
import { useNavigate } from "react-router-dom";
import { FileText, Download, ChevronRight, Thermometer, Layers, TrendingUp, Loader } from "lucide-react";
import { generateReportPDF } from "@/utils/pdfExport";

function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const MATERIAL_COLORS: Record<string, string> = {
  Ti6Al4V: "bg-brand-cyan/15 text-brand-cyan",
  IN718: "bg-brand-orange/15 text-brand-orange",
  "316L SS": "bg-brand-green/15 text-brand-green",
  AlSi10Mg: "bg-brand-purple/15 text-brand-purple",
};

export default function ReportsPage() {
  const { reports, tasks } = useStore();
  const navigate = useNavigate();
  const [exportingId, setExportingId] = useState<string | null>(null);

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-brand-text">报告中心</h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          查看模拟任务生成的分析报告，包含熔池形貌、温度场与残余应力分布数据
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-text-muted">
          <FileText className="mb-4 h-12 w-12 opacity-40" />
          <p>暂无报告数据</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {reports.map((report) => {
            const task = tasks.find((t) => t.id === report.taskId);
            const porosityPercent = (report.porosityDeviation * 100).toFixed(1);
            const isPorosityHigh = report.porosityDeviation > 0.2;
            const badgeCls = MATERIAL_COLORS[task?.materialType ?? ""] ?? "bg-brand-surface text-brand-text-muted";

            return (
              <div
                key={report.id}
                className="card-hover rounded-xl border border-brand-border bg-brand-surface p-5"
              >
                <div className="mb-3 flex items-start justify-between">
                  <span className="font-mono text-sm text-brand-cyan">
                    {report.id.slice(0, 8).toUpperCase()}
                  </span>
                  {task && (
                    <span className={`rounded-md px-2 py-0.5 text-xs font-medium ${badgeCls}`}>
                      {task.materialType}
                    </span>
                  )}
                </div>

                <h3 className="mb-3 text-sm font-semibold text-brand-text">
                  {task?.name ?? "未知任务"}
                </h3>

                <div className="mb-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-brand-bg/60 px-3 py-2">
                    <div className="mb-0.5 flex items-center gap-1 text-xs text-brand-text-muted">
                      <Layers className="h-3 w-3" />熔池宽度
                    </div>
                    <span className="text-sm font-semibold text-brand-text">
                      {report.meltPoolMorphology.width.toFixed(3)} mm
                    </span>
                  </div>
                  <div className="rounded-lg bg-brand-bg/60 px-3 py-2">
                    <div className="mb-0.5 flex items-center gap-1 text-xs text-brand-text-muted">
                      <Thermometer className="h-3 w-3" />最高温度
                    </div>
                    <span className="text-sm font-semibold text-brand-text">
                      {report.temperatureField.maxTemp.toFixed(0)} °C
                    </span>
                  </div>
                  <div className="rounded-lg bg-brand-bg/60 px-3 py-2">
                    <div className="mb-0.5 flex items-center gap-1 text-xs text-brand-text-muted">
                      <TrendingUp className="h-3 w-3" />最大应力
                    </div>
                    <span className="text-sm font-semibold text-brand-text">
                      {report.residualStress.maxStress.toFixed(0)} MPa
                    </span>
                  </div>
                  <div className="rounded-lg bg-brand-bg/60 px-3 py-2">
                    <div className="mb-0.5 flex items-center gap-1 text-xs text-brand-text-muted">
                      <Layers className="h-3 w-3" />孔隙率偏差
                    </div>
                    <span
                      className={`text-sm font-semibold ${
                        isPorosityHigh ? "text-brand-orange" : "text-brand-green"
                      }`}
                    >
                      {porosityPercent}%
                    </span>
                  </div>
                </div>

                <p className="mb-4 text-xs text-brand-text-muted">
                  生成时间：{formatDate(report.createdAt)}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/reports/${report.id}`)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-cyan/10 py-2 text-xs font-medium text-brand-cyan transition-colors hover:bg-brand-cyan/20"
                  >
                    查看详情 <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExportingId(report.id);
                      setTimeout(() => {
                        generateReportPDF(report, task);
                        setExportingId(null);
                      }, 200);
                    }}
                    disabled={exportingId === report.id}
                    className={`flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      exportingId === report.id
                        ? "cursor-wait bg-brand-cyan/20 text-brand-cyan"
                        : "bg-brand-surface text-brand-text-muted hover:bg-brand-border hover:text-brand-text"
                    }`}
                  >
                    {exportingId === report.id ? (
                      <Loader className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    {exportingId === report.id ? "生成中" : "PDF"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
