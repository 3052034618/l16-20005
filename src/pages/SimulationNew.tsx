import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 } from 'uuid';
import { useStore } from '@/store';
import { MockSimulationEngine } from '@/utils/mockEngine';
import type { PowderParams, LaserParams, SubstrateParams, SimulationTask } from '@/types';
import { ChevronLeft, ChevronRight, FlaskConical } from 'lucide-react';

const MATERIALS = ['Ti6Al4V', 'IN718', '316L SS', 'AlSi10Mg'];
const SCAN_STRATEGIES = ['条纹扫描', '棋盘扫描', '螺旋扫描'];

const inputCls = 'w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2 text-brand-text focus:border-brand-cyan focus:outline-none transition-colors';
const labelCls = 'mb-1.5 block text-sm font-medium text-brand-text-muted';
const selectCls = `${inputCls} appearance-none`;

export default function SimulationNew() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  const [name, setName] = useState('');
  const [powder, setPowder] = useState<PowderParams>({
    material: 'Ti6Al4V', particleSize: 30, layerThickness: 30, packingDensity: 60,
  });
  const [laser, setLaser] = useState<LaserParams>({
    power: 250, scanSpeed: 1000, hatchSpacing: 100, scanStrategy: '条纹扫描',
  });
  const [substrate, setSubstrate] = useState<SubstrateParams>({
    temperature: 200, preheatingEnabled: true,
  });

  const steps = ['粉末材料', '激光参数', '基板参数'];

  const handleSubmit = () => {
    const now = Date.now();
    const task: SimulationTask = {
      id: v4(),
      name: name || `${powder.material} 模拟`,
      status: 'pending_validation',
      materialType: powder.material,
      powderParams: powder,
      laserParams: laser,
      substrateParams: substrate,
      statusHistory: [{ status: 'pending_validation', timestamp: now }],
      createdAt: now,
      updatedAt: now,
      createdBy: useStore.getState().currentUser.name || '工程师',
    };

    useStore.getState().addTask(task);

    const engine = new MockSimulationEngine(useStore);
    engine.startSimulation(task.id);

    navigate('/simulation');
  };

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6">
      <div className="flex items-center justify-center gap-0">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                  i <= step
                    ? 'bg-brand-cyan text-brand-bg'
                    : 'border border-brand-border text-brand-text-muted'
                }`}
              >
                {i + 1}
              </div>
              <span className={`mt-1.5 text-xs ${i <= step ? 'text-brand-cyan' : 'text-brand-text-muted'}`}>
                {s}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`mx-3 h-0.5 w-16 transition-colors ${i < step ? 'bg-brand-cyan' : 'bg-brand-border'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-brand-border bg-brand-surface p-6">
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelCls}>任务名称</label>
              <input
                className={inputCls}
                placeholder="可选，默认为材料名+模拟"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>材料名称</label>
              <select className={selectCls} value={powder.material} onChange={(e) => setPowder({ ...powder, material: e.target.value })}>
                {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>粒径 (μm)</label>
                <input type="number" className={inputCls} value={powder.particleSize} onChange={(e) => setPowder({ ...powder, particleSize: +e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>层厚 (μm)</label>
                <input type="number" className={inputCls} value={powder.layerThickness} onChange={(e) => setPowder({ ...powder, layerThickness: +e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>堆积密度 (%)</label>
                <input type="number" className={inputCls} value={powder.packingDensity} onChange={(e) => setPowder({ ...powder, packingDensity: +e.target.value })} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>激光功率 (W)</label>
                <input type="number" className={inputCls} value={laser.power} onChange={(e) => setLaser({ ...laser, power: +e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>扫描速度 (mm/s)</label>
                <input type="number" className={inputCls} value={laser.scanSpeed} onChange={(e) => setLaser({ ...laser, scanSpeed: +e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}> hatch间距 (μm)</label>
                <input type="number" className={inputCls} value={laser.hatchSpacing} onChange={(e) => setLaser({ ...laser, hatchSpacing: +e.target.value })} />
              </div>
              <div>
                <label className={labelCls}>扫描策略</label>
                <select className={selectCls} value={laser.scanStrategy} onChange={(e) => setLaser({ ...laser, scanStrategy: e.target.value })}>
                  {SCAN_STRATEGIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <div>
              <label className={labelCls}>基板温度 (°C)</label>
              <input type="number" className={inputCls} value={substrate.temperature} onChange={(e) => setSubstrate({ ...substrate, temperature: +e.target.value })} />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="preheating"
                checked={substrate.preheatingEnabled}
                onChange={(e) => setSubstrate({ ...substrate, preheatingEnabled: e.target.checked })}
                className="h-4 w-4 accent-brand-cyan"
              />
              <label htmlFor="preheating" className="text-sm text-brand-text">启用预热</label>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={() => step > 0 && setStep(step - 1)}
          disabled={step === 0}
          className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            step === 0
              ? 'cursor-not-allowed text-brand-text-muted/40'
              : 'text-brand-text-muted hover:bg-brand-surface hover:text-brand-text'
          }`}
        >
          <ChevronLeft className="h-4 w-4" />
          上一步
        </button>

        {step < 2 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="flex items-center gap-1 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-brand-bg transition-colors hover:bg-brand-cyan-dim"
          >
            下一步
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-brand-bg transition-colors hover:bg-brand-cyan-dim"
          >
            <FlaskConical className="h-4 w-4" />
            提交任务
          </button>
        )}
      </div>
    </div>
  );
}
