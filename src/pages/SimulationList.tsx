import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Eye, Play, FlaskConical } from 'lucide-react';
import { v4 } from 'uuid';
import { useStore } from '@/store';
import { MockSimulationEngine } from '@/utils/mockEngine';
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

type FilterKey = 'all' | 'pending' | 'running' | 'completed' | 'error';

const filterTabs: { key: FilterKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待校验' },
  { key: 'running', label: '计算中' },
  { key: 'completed', label: '已完成' },
  { key: 'error', label: '异常' },
];

const statusFilterMap: Record<FilterKey, TaskStatus[]> = {
  all: [],
  pending: ['pending_validation'],
  running: ['parsing', 'coupling_calculation', 'melt_pool_analysis'],
  completed: ['completed'],
  error: ['error_rollback'],
};

export default function SimulationList() {
  const navigate = useNavigate();
  const { tasks } = useStore();
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');

  const filtered = activeFilter === 'all'
    ? tasks
    : tasks.filter((t) => statusFilterMap[activeFilter].includes(t.status));

  const handleStart = (taskId: string) => {
    const engine = new MockSimulationEngine(useStore);
    useStore.getState().updateTaskStatus(taskId, 'parsing');
    engine.startSimulation(taskId);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-brand-text">模拟任务</h2>
        <button
          onClick={() => navigate('/simulation/new')}
          className="flex items-center gap-2 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-brand-bg transition-colors hover:bg-brand-cyan-dim"
        >
          <Plus className="h-4 w-4" />
          新建任务
        </button>
      </div>

      <div className="flex gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveFilter(tab.key)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeFilter === tab.key
                ? 'bg-brand-cyan/10 text-brand-cyan border border-brand-cyan/30'
                : 'text-brand-text-muted hover:text-brand-text hover:bg-brand-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-text-muted">
          <FlaskConical className="mb-3 h-12 w-12 opacity-30" />
          <p className="text-sm">暂无匹配的模拟任务</p>
        </div>
      ) : (
        <div className="rounded-xl border border-brand-border bg-brand-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-border text-brand-text-muted">
                <th className="px-4 py-3 text-left font-medium">任务名称</th>
                <th className="px-4 py-3 text-left font-medium">材料</th>
                <th className="px-4 py-3 text-left font-medium">状态</th>
                <th className="px-4 py-3 text-left font-medium">激光功率(W)</th>
                <th className="px-4 py-3 text-left font-medium">扫描速度(mm/s)</th>
                <th className="px-4 py-3 text-left font-medium">创建时间</th>
                <th className="px-4 py-3 text-left font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((task) => (
                <tr
                  key={task.id}
                  className="border-b border-brand-border/50 transition-colors hover:bg-brand-bg/50"
                >
                  <td className="px-4 py-3 font-medium text-brand-text">{task.name}</td>
                  <td className="px-4 py-3 text-brand-text-muted">{task.materialType}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium text-white ${statusColors[task.status]}`}>
                      {statusLabels[task.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-brand-text-muted">{task.laserParams.power}</td>
                  <td className="px-4 py-3 font-mono text-brand-text-muted">{task.laserParams.scanSpeed}</td>
                  <td className="px-4 py-3 text-brand-text-muted">
                    {new Date(task.createdAt).toLocaleString('zh-CN')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/simulation/${task.id}`}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs text-brand-cyan transition-colors hover:bg-brand-cyan/10"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        详情
                      </Link>
                      {task.status === 'pending_validation' && (
                        <button
                          onClick={() => handleStart(task.id)}
                          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-brand-green transition-colors hover:bg-brand-green/10"
                        >
                          <Play className="h-3.5 w-3.5" />
                          启动
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
