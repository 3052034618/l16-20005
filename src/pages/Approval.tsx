import { useState } from "react";
import { useStore } from "@/store";
import {
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  X,
  Send,
  Layers,
  Shield,
} from "lucide-react";
import type { Approval, ApprovalLevel } from "@/types";

type FilterTab = "all" | "level1" | "level2" | "approved" | "rejected" | "pushed";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "level1", label: "一级审批" },
  { key: "level2", label: "二级审批" },
  { key: "approved", label: "已通过" },
  { key: "pushed", label: "已推送" },
  { key: "rejected", label: "已驳回" },
];

const LEVEL_LABELS: Record<ApprovalLevel, string> = { 1: "一级", 2: "二级" };
const LEVEL_COLORS: Record<ApprovalLevel, string> = {
  1: "bg-brand-cyan/15 text-brand-cyan",
  2: "bg-brand-purple/15 text-brand-purple",
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; icon: typeof CheckCircle }
> = {
  pending: { label: "待审批", className: "bg-brand-yellow/15 text-brand-yellow", icon: Clock },
  approved: { label: "已通过", className: "bg-brand-green/15 text-brand-green", icon: CheckCircle },
  rejected: { label: "已驳回", className: "bg-brand-red/15 text-brand-red", icon: XCircle },
};

function formatTime(ts: number) {
  return new Date(ts).toLocaleString("zh-CN");
}

export default function ApprovalPage() {
  const { approvals, reports, tasks, currentUser, updateApproval } = useStore();
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [modalApproval, setModalApproval] = useState<Approval | null>(null);
  const [comment, setComment] = useState("");
  const [toast, setToast] = useState("");

  const pendingCount = approvals.filter((a) => a.status === "pending").length;
  const approvedCount = approvals.filter((a) => a.status === "approved").length;
  const rejectedCount = approvals.filter((a) => a.status === "rejected").length;
  const pushedCount = reports.filter((r) => {
    const reportApprovals = approvals.filter((a) => a.reportId === r.id);
    const l1 = reportApprovals.find((a) => a.level === 1);
    const l2 = reportApprovals.find((a) => a.level === 2);
    return l1?.status === "approved" && l2?.status === "approved";
  }).length;

  const getTaskByReportId = (reportId: string) => {
    const report = reports.find((r) => r.id === reportId);
    if (!report) return null;
    return tasks.find((t) => t.id === report.taskId) ?? null;
  };

  const getLevel1Approval = (reportId: string) =>
    approvals.find((a) => a.reportId === reportId && a.level === 1);
  const getLevel2Approval = (reportId: string) =>
    approvals.find((a) => a.reportId === reportId && a.level === 2);

  const isReportPushed = (reportId: string) => {
    const l1 = getLevel1Approval(reportId);
    const l2 = getLevel2Approval(reportId);
    return l1?.status === "approved" && l2?.status === "approved";
  };

  const canApproveLevel2 = (reportId: string) => {
    const l1 = getLevel1Approval(reportId);
    return l1?.status === "approved";
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const filtered = approvals.filter((a) => {
    switch (activeTab) {
      case "level1": return a.level === 1;
      case "level2": return a.level === 2;
      case "approved": return a.status === "approved";
      case "rejected": return a.status === "rejected";
      case "pushed": return isReportPushed(a.reportId);
      default: return true;
    }
  });

  const handleApprove = () => {
    if (!modalApproval) return;

    updateApproval(modalApproval.id, {
      status: "approved",
      reviewer: currentUser.name,
      comment: comment || undefined,
      reviewedAt: Date.now(),
    });

    if (modalApproval.level === 1) {
      showToast("一级审批通过，已进入二级审批队列");
    } else if (modalApproval.level === 2) {
      showToast("✅ 两级审批均通过，已推送至切片软件");
    }

    setModalApproval(null);
    setComment("");
  };

  const handleReject = () => {
    if (!modalApproval) return;
    updateApproval(modalApproval.id, {
      status: "rejected",
      reviewer: currentUser.name,
      comment: comment || undefined,
      reviewedAt: Date.now(),
    });
    setModalApproval(null);
    setComment("");
  };

  const stats = [
    { label: "待审批", value: pendingCount, color: "text-brand-yellow", icon: Clock },
    { label: "已通过", value: approvedCount, color: "text-brand-green", icon: CheckCircle },
    { label: "已推送", value: pushedCount, color: "text-brand-cyan", icon: Send },
    { label: "已驳回", value: rejectedCount, color: "text-brand-red", icon: XCircle },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {toast && (
        <div className="fixed right-6 top-20 z-50 rounded-lg border border-brand-green/30 bg-brand-green/10 px-4 py-3 text-sm text-brand-green shadow-lg animate-slide-in-right">
          {toast}
        </div>
      )}

      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-brand-text">
          <Shield className="h-5 w-5 text-brand-cyan" />
          审批工作台
        </h2>
        <p className="mt-1 text-sm text-brand-text-muted">
          两级审批流程：一级工程师审批通过后方可进行二级首席科学家审批，两级通过后自动推送切片软件
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="rounded-xl border border-brand-border bg-brand-surface p-4"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs text-brand-text-muted">{s.label}</div>
                <div className={s.color}><Icon className="h-4 w-4 opacity-70" /></div>
              </div>
              <div className={`mt-2 text-2xl font-bold font-mono ${s.color}`}>{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="flex gap-1 rounded-lg bg-brand-surface p-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-brand-border text-brand-text"
                : "text-brand-text-muted hover:text-brand-text"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-brand-text-muted">暂无审批记录</div>
        )}
        {filtered.map((approval) => {
          const task = getTaskByReportId(approval.reportId);
          const report = reports.find((r) => r.id === approval.reportId);
          const sc = STATUS_CONFIG[approval.status];
          const StatusIcon = sc.icon;
          const pushed = isReportPushed(approval.reportId);
          const canApprove = approval.status === "pending" &&
            (approval.level === 1 || canApproveLevel2(approval.reportId));
          const locked = approval.status === "pending" &&
            approval.level === 2 && !canApproveLevel2(approval.reportId);

          return (
            <div
              key={approval.id}
              className={`card-hover rounded-xl border bg-brand-surface p-4 ${
                pushed ? "border-brand-cyan/30" : "border-brand-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded px-2 py-0.5 text-xs font-medium ${LEVEL_COLORS[approval.level]}`}
                  >
                    {LEVEL_LABELS[approval.level]}审批
                  </span>
                  <span className="text-sm font-mono text-brand-text-muted">
                    报告 {approval.reportId.slice(0, 8).toUpperCase()}
                  </span>
                  {task && (
                    <span className="text-sm text-brand-text">{task.name}</span>
                  )}
                  {pushed && (
                    <span className="flex items-center gap-1 rounded bg-brand-cyan/20 px-2 py-0.5 text-[10px] font-medium text-brand-cyan">
                      <Send className="h-3 w-3" />
                      已推送切片软件
                    </span>
                  )}
                  {locked && (
                    <span className="flex items-center gap-1 rounded bg-brand-text-muted/20 px-2 py-0.5 text-[10px] font-medium text-brand-text-muted">
                      等待一级
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium ${sc.className}`}>
                    <StatusIcon className="h-3 w-3" />
                    {sc.label}
                  </span>
                </div>
              </div>

              {task && report && (
                <div className="mt-3 flex gap-4 text-xs text-brand-text-muted">
                <span>材料: {task.materialType}</span>
                <span>激光: {task.laserParams.power}W / {task.laserParams.scanSpeed}mm/s</span>
                <span>孔隙率偏差: {(report.porosityDeviation * 100).toFixed(2)}%</span>
              </div>
              )}

              {approval.status === "pending" && canApprove && (
                <div className="mt-3 flex gap-2 border-t border-brand-border pt-3">
                  <button
                    onClick={() => { setModalApproval(approval); setComment(""); }}
                    className="flex items-center gap-1 rounded-md bg-brand-green/15 px-3 py-1.5 text-xs font-medium text-brand-green transition-colors hover:bg-brand-green/25"
                  >
                    <CheckCircle className="h-3.5 w-3.5" />
                    通过
                  </button>
                  <button
                    onClick={() => { setModalApproval(approval); setComment(""); }}
                    className="flex items-center gap-1 rounded-md bg-brand-red/15 px-3 py-1.5 text-xs font-medium text-brand-red transition-colors hover:bg-brand-red/25"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    驳回
                  </button>
                </div>
              )}

              {approval.status === "pending" && locked && (
                <div className="mt-3 border-t border-brand-border pt-3">
                  <p className="text-xs text-brand-text-muted">
                    ⚠ 一级审批通过后方可进行二级审批
                  </p>
                </div>
              )}

              {approval.status !== "pending" && approval.reviewer && (
                <div className="mt-3 border-t border-brand-border pt-3 text-xs text-brand-text-muted">
                  <div className="flex items-center gap-2">
                    <span>审批人: <span className="text-brand-text">{approval.reviewer}</span></span>
                    {approval.reviewedAt && (
                      <span>· {formatTime(approval.reviewedAt)}</span>
                    )}
                  </div>
                  {approval.comment && (
                    <p className="mt-1 text-brand-text italic">"{approval.comment}"</p>
                  )}
                </div>
              )}

              {pushed && approval.level === 2 && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-brand-cyan/10 px-3 py-2 text-xs text-brand-cyan">
                  <Layers className="h-4 w-4" />
                  <span>已自动推送至切片软件生成打印指令</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {modalApproval && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-lg rounded-xl border border-brand-border bg-brand-surface p-6 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-brand-text">审批详情</h3>
              <button onClick={() => setModalApproval(null)} className="text-brand-text-muted hover:text-brand-text">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <span className={`rounded px-2 py-0.5 text-xs font-medium ${LEVEL_COLORS[modalApproval.level]}`}>
                  {LEVEL_LABELS[modalApproval.level]}审批
                </span>
                <span className="font-mono text-brand-text-muted">
                  报告 {modalApproval.reportId.slice(0, 8).toUpperCase()}
                </span>
              </div>
              {(() => {
                const task = getTaskByReportId(modalApproval.reportId);
                const report = reports.find((r) => r.id === modalApproval.reportId);
                return (
                  <>
                    {task && (
                      <div className="rounded-md bg-brand-bg p-3">
                        <div className="flex items-center gap-2 text-brand-text">
                          <FileText className="h-4 w-4 text-brand-cyan" />
                          <span className="font-medium">{task.name}</span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-brand-text-muted">
                          <span>材料: {task.materialType}</span>
                          <span>激光功率: {task.laserParams.power}W</span>
                          <span>扫描速度: {task.laserParams.scanSpeed} mm/s</span>
                          <span>基板温度: {task.substrateParams.temperature}°C</span>
                        </div>
                      </div>
                    )}
                    {report && (
                      <div className="rounded-md bg-brand-bg p-3 text-xs text-brand-text-muted">
                        <div className="mb-1 font-medium text-brand-text">报告摘要</div>
                        <div className="grid grid-cols-2 gap-1">
                          <span>孔隙率偏差: {(report.porosityDeviation * 100).toFixed(2)}%</span>
                          <span>最大应力: {report.residualStress.maxStress.toFixed(1)} MPa</span>
                          <span>熔池宽度: {report.meltPoolMorphology.width.toFixed(3)} mm</span>
                          <span>最高温度: {report.temperatureField.maxTemp.toFixed(0)}°C</span>
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}

              {modalApproval.level === 2 && !canApproveLevel2(modalApproval.reportId) && (
                <div className="rounded-md bg-brand-orange/10 border border-brand-orange/30 p-3 text-xs text-brand-orange">
                  ⚠ 一级审批尚未通过，无法进行二级审批
                </div>
              )}
            </div>

            <div className="mt-4">
              <label className="text-xs text-brand-text-muted">审批意见</label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="请输入审批意见..."
                className="mt-1 w-full rounded-md border border-brand-border bg-brand-bg px-3 py-2 text-sm text-brand-text placeholder-brand-text-muted/50 outline-none focus:border-brand-cyan/50"
                rows={3}
              />
            </div>

            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={handleReject}
                className="flex items-center gap-1 rounded-md bg-brand-red/15 px-4 py-2 text-sm font-medium text-brand-red transition-colors hover:bg-brand-red/25"
              >
                <XCircle className="h-4 w-4" />
                驳回
              </button>
              <button
                onClick={handleApprove}
                disabled={modalApproval.level === 2 && !canApproveLevel2(modalApproval.reportId)}
                className={`flex items-center gap-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  modalApproval.level === 2 && !canApproveLevel2(modalApproval.reportId)
                    ? "cursor-not-allowed bg-brand-text-muted/20 text-brand-text-muted/60"
                    : "bg-brand-green/15 text-brand-green hover:bg-brand-green/25"
                }`}
              >
                <CheckCircle className="h-4 w-4" />
                通过
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
