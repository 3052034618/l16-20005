import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, FileText } from 'lucide-react';
import { useStore } from '@/store';
import type { TaskStatus } from '@/types';

const statusLabels: Record<TaskStatus, string> = {
  pending_validation: '待校验', parsing: '参数解析', coupling_calculation: '耦合计算',
  melt_pool_analysis: '熔池分析', completed: '已完成', error_rollback: '异常回退'
};
const statusColors: Record<TaskStatus, string> = {
  pending_validation: 'bg-brand-text-muted', parsing: 'bg-brand-purple',
  coupling_calculation: 'bg-brand-cyan', melt_pool_analysis: 'bg-brand-yellow',
  completed: 'bg-brand-green', error_rollback: 'bg-brand-red'
};

const paramItem = (label: string, value: string | number) => (
  <div className="flex flex-col gap-1 rounded-lg border border-brand-border bg-brand-bg p-3">
    <span className="text-xs text-brand-text-muted">{label}</span>
    <span className="font-mono text-sm text-brand-text">{value}</span>
  </div>
);

export default function SimulationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getTaskById, getAlertsByTaskId, getReportByTaskId } = useStore();

  const task = id ? getTaskById(id) : undefined;

  if (!task) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-brand-text-muted">
        <AlertTriangle className="mb-3 h-12 w-12 text-brand-orange" />
        <p className="text-lg font-medium">任务未找到</p>
        <p className="mt-1 text-sm">指定的模拟任务不存在或已被删除</p>
        <button
          onClick={() => navigate('/simulation')}
          className="mt-4 flex items-center gap-1 rounded-lg bg-brand-cyan/10 px-4 py-2 text-sm text-brand-cyan transition-colors hover:bg-brand-cyan/20"
        >
          <ArrowLeft className="h-4 w-4" />
          返回列表
        </button>
      </div>
    );
  }

  const alerts = getAlertsByTaskId(task.id);
  const report = getReportByTaskId(task.id);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/simulation')}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand-border text-brand-text-muted transition-colors hover:bg-brand-surface hover:text-brand-text"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <h2 className="text-xl font-bold text-brand-text">{task.name}</h2>
        <span className={`rounded-full px-3 py-1 text-xs font-medium text-white ${statusColors[task.status]}`}>
          {statusLabels[task.status]}
        </span>
      </div>

      <div className="flex gap-6">
        <div className="flex flex-[3] flex-col gap-4">
          <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
            <h3 className="mb-3 text-sm font-semibold text-brand-cyan">粉末参数</h3>
            <div className="grid grid-cols-2 gap-3">
              {paramItem('材料', task.powderParams.material)}
              {paramItem('粒径 (μm)', task.powderParams.particleSize)}
              {paramItem('层厚 (μm)', task.powderParams.layerThickness)}
              {paramItem('堆积密度 (%)', task.powderParams.packingDensity)}
            </div>
          </div>

          <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
            <h3 className="mb-3 text-sm font-semibold text-brand-cyan">激光参数</h3>
            <div className="grid grid-cols-2 gap-3">
              {paramItem('功率 (W)', task.laserParams.power)}
              {paramItem('扫描速度 (mm/s)', task.laserParams.scanSpeed)}
              {paramItem('Hatch间距 (μm)', task.laserParams.hatchSpacing)}
              {paramItem('扫描策略', task.laserParams.scanStrategy)}
            </div>
          </div>

          <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
            <h3 className="mb-3 text-sm font-semibold text-brand-cyan">基板参数</h3>
            <div className="grid grid-cols-2 gap-3">
              {paramItem('温度 (°C)', task.substrateParams.temperature)}
              {paramItem('预热', task.substrateParams.preheatingEnabled ? '已启用' : '未启用')}
            </div>
          </div>
        </div>

        <div className="flex flex-[2] flex-col gap-4">
          <div className="rounded-xl border border-brand-border bg-brand-surface p-5">
            <h3 className="mb-4 text-sm font-semibold text-brand-cyan">状态时间线</h3>
            <div className="relative flex flex-col gap-0">
              {task.statusHistory.map((entry, i) => {
                const isActive = i === task.statusHistory.length - 1;
                return (
                  <div key={i} className="flex items-start gap-3 pb-4 last:pb-0">
                    <div className="flex flex-col items-center">
                      <div
                        className={`h-3 w-3 rounded-full ${statusColors[entry.status]} ${
                          isActive ? 'glow-cyan animate-pulse-glow' : ''
                        }`}
                      />
                      {i < task.statusHistory.length - 1 && (
                        <div className="mt-1 h-full w-px bg-brand-border" />
                      )}
                    </div>
                    <div className="flex flex-col pt-[-2px]">
                      <span className={`text-sm font-medium ${isActive ? 'text-brand-text' : 'text-brand-text-muted'}`}>
                        {statusLabels[entry.status]}
                      </span>
                      <span className="text-xs text-brand-text-muted">
                        {new Date(entry.timestamp).toLocaleString('zh-CN')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {alerts.length > 0 && (
            <div className="flex flex-col gap-2">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`rounded-xl border p-4 ${
                    alert.severity === 'critical'
                      ? 'border-brand-red/40 bg-brand-red/5'
                      : 'border-brand-orange/40 bg-brand-orange/5'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className={`h-4 w-4 ${alert.severity === 'critical' ? 'text-brand-red' : 'text-brand-orange'}`} />
                    <span className="text-sm font-medium text-brand-text">{alert.message}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {report && (
            <Link
              to={`/reports/${report.id}`}
              className="flex items-center gap-2 rounded-xl border border-brand-cyan/30 bg-brand-cyan/5 p-4 text-brand-cyan transition-colors hover:bg-brand-cyan/10"
            >
              <FileText className="h-5 w-5" />
              <span className="text-sm font-medium">查看报告</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
