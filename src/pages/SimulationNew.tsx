import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 } from 'uuid';
import { useStore } from '@/store';
import { MockSimulationEngine } from '@/utils/mockEngine';
import type { PowderParams, LaserParams, SubstrateParams, SimulationTask } from '@/types';
import { ChevronLeft, ChevronRight, FlaskConical, AlertCircle, Upload, CheckCircle, XCircle } from 'lucide-react';

const MATERIALS = ['Ti6Al4V', 'IN718', '316L SS', 'AlSi10Mg'];
const SCAN_STRATEGIES = ['条纹扫描', '棋盘扫描', '螺旋扫描'];

const inputCls = 'w-full bg-brand-bg border border-brand-border rounded-lg px-4 py-2 text-brand-text focus:border-brand-cyan focus:outline-none transition-colors';
const inputErrorCls = 'w-full bg-brand-bg border border-brand-red/60 rounded-lg px-4 py-2 text-brand-text focus:border-brand-red focus:outline-none transition-colors';
const labelCls = 'mb-1.5 block text-sm font-medium text-brand-text-muted';
const selectCls = `${inputCls} appearance-none`;
const selectErrorCls = `${inputErrorCls} appearance-none`;

const VALID_RANGES = {
  particleSize: { min: 5, max: 150, unit: 'μm' },
  layerThickness: { min: 10, max: 100, unit: 'μm' },
  packingDensity: { min: 30, max: 80, unit: '%' },
  power: { min: 50, max: 500, unit: 'W' },
  scanSpeed: { min: 100, max: 3000, unit: 'mm/s' },
  hatchSpacing: { min: 50, max: 300, unit: 'μm' },
  temperature: { min: 20, max: 500, unit: '°C' },
};

interface ValidationErrors {
  name?: string;
  particleSize?: string;
  layerThickness?: string;
  packingDensity?: string;
  power?: string;
  scanSpeed?: string;
  hatchSpacing?: string;
  temperature?: string;
  scanPathFile?: string;
  powderFile?: string;
}

export default function SimulationNew() {
  const navigate = useNavigate();
  const { getMaterialAlert } = useStore();
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<ValidationErrors>({});

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

  const [powderFile, setPowderFile] = useState<File | null>(null);
  const [scanPathFile, setScanPathFile] = useState<File | null>(null);

  const materialAlert = getMaterialAlert(powder.material);
  const isMaterialPaused = materialAlert?.isPaused ?? false;

  const steps = ['粉末材料', '激光路径', '基板参数'];

  const validateField = (field: keyof typeof VALID_RANGES, value: number): string | undefined => {
    const range = VALID_RANGES[field];
    if (!range) return undefined;
    if (isNaN(value) || value === 0) return '请输入有效数值';
    if (value < range.min) return `数值过低，最小为 ${range.min} ${range.unit}`;
    if (value > range.max) return `数值过高，最大为 ${range.max} ${range.unit}`;
    return undefined;
  };

  const validateStep = (stepIndex: number): boolean => {
    const newErrors: ValidationErrors = {};

    if (stepIndex === 0) {
      const psErr = validateField('particleSize', powder.particleSize);
      if (psErr) newErrors.particleSize = psErr;

      const ltErr = validateField('layerThickness', powder.layerThickness);
      if (ltErr) newErrors.layerThickness = ltErr;

      const pdErr = validateField('packingDensity', powder.packingDensity);
      if (pdErr) newErrors.packingDensity = pdErr;

      if (!powderFile) newErrors.powderFile = '请上传粉末材料参数文件';
    }

    if (stepIndex === 1) {
      const pwErr = validateField('power', laser.power);
      if (pwErr) newErrors.power = pwErr;

      const ssErr = validateField('scanSpeed', laser.scanSpeed);
      if (ssErr) newErrors.scanSpeed = ssErr;

      const hsErr = validateField('hatchSpacing', laser.hatchSpacing);
      if (hsErr) newErrors.hatchSpacing = hsErr;

      if (!scanPathFile) newErrors.scanPathFile = '请上传激光扫描路径文件';
    }

    if (stepIndex === 2) {
      const tempErr = validateField('temperature', substrate.temperature);
      if (tempErr) newErrors.temperature = tempErr;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep(step + 1);
  };

  const handlePrev = () => {
    setErrors({});
    if (step > 0) setStep(step - 1);
  };

  const handleSubmit = () => {
    if (!validateStep(2)) return;
    if (isMaterialPaused) return;

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (f: File | null) => void, errorKey: keyof ValidationErrors) => {
    const file = e.target.files?.[0] || null;
    setter(file);
    if (file && errors[errorKey]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[errorKey];
        return next;
      });
    }
  };

  const UploadZone = ({
    label, file, onFile, errorKey, accept,
  }: {
    label: string;
    file: File | null;
    onFile: (f: File | null) => void;
    errorKey: keyof ValidationErrors;
    accept: string;
  }) => {
    const hasError = !!errors[errorKey];
    return (
      <div>
        <label className={labelCls}>{label}</label>
        <label
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-brand-border bg-brand-bg px-4 py-6 transition-colors hover:border-brand-cyan/50 ${
            hasError ? 'border-brand-red/60 border-solid' : ''
          }`}
        >
          {file ? (
            <div className="flex items-center gap-2 text-brand-green">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">{file.name}</span>
            </div>
          ) : (
            <>
              <Upload className={`h-6 w-6 ${hasError ? 'text-brand-red' : 'text-brand-text-muted'}`} />
              <span className={`text-xs ${hasError ? 'text-brand-red' : 'text-brand-text-muted'}`}>
                点击或拖拽上传文件
              </span>
            </>
          )}
          <input
            type="file"
            accept={accept}
            className="hidden"
            onChange={(e) => handleFileUpload(e, onFile, errorKey)}
          />
        </label>
        {errors[errorKey] && (
          <p className="mt-1 flex items-center gap-1 text-xs text-brand-red">
            <AlertCircle className="h-3 w-3" />
            {errors[errorKey]}
          </p>
        )}
      </div>
    );
  };

  const FieldError = ({ error }: { error?: string }) =>
    error ? (
      <p className="mt-1 flex items-center gap-1 text-xs text-brand-red">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    ) : null;

  return (
    <div className="mx-auto max-w-2xl flex flex-col gap-6">
      {isMaterialPaused && (
        <div className="flex items-center gap-3 rounded-xl border border-brand-red/40 bg-brand-red/10 px-5 py-4">
          <XCircle className="h-5 w-5 text-brand-red flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-brand-red">材料已暂停</h3>
            <p className="mt-0.5 text-xs text-brand-red/80">
              材料 {powder.material} 因连续三次孔隙率偏差超20%已被暂停，暂无法创建新任务。
              请联系首席科学家解除暂停后再试。
            </p>
          </div>
        </div>
      )}

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
              <label className={labelCls}>任务名称 <span className="text-brand-text-muted">(可选)</span></label>
              <input
                className={inputCls}
                placeholder="可选，默认为材料名+模拟"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className={labelCls}>材料名称</label>
              <select
                className={selectCls}
                value={powder.material}
                onChange={(e) => setPowder({ ...powder, material: e.target.value })}
              >
                {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              {isMaterialPaused && (
                <p className="mt-1 flex items-center gap-1 text-xs text-brand-red">
                  <AlertCircle className="h-3 w-3" />
                  该材料当前已暂停，无法创建新任务
                </p>
              )}
            </div>

            <UploadZone
              label="粉末材料参数文件"
              file={powderFile}
              onFile={setPowderFile}
              errorKey="powderFile"
              accept=".json,.csv,.txt"
            />

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelCls}>粒径 (μm)</label>
                <input
                  type="number"
                  className={errors.particleSize ? inputErrorCls : inputCls}
                  value={powder.particleSize}
                  onChange={(e) => {
                    const val = +e.target.value;
                    setPowder({ ...powder, particleSize: val });
                    if (errors.particleSize) {
                      const newErr = validateField('particleSize', val);
                      if (!newErr) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.particleSize;
                          return next;
                        });
                      }
                    }
                  }}
                />
                <FieldError error={errors.particleSize} />
              </div>
              <div>
                <label className={labelCls}>层厚 (μm)</label>
                <input
                  type="number"
                  className={errors.layerThickness ? inputErrorCls : inputCls}
                  value={powder.layerThickness}
                  onChange={(e) => {
                    const val = +e.target.value;
                    setPowder({ ...powder, layerThickness: val });
                    if (errors.layerThickness) {
                      const newErr = validateField('layerThickness', val);
                      if (!newErr) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.layerThickness;
                          return next;
                        });
                      }
                    }
                  }}
                />
                <FieldError error={errors.layerThickness} />
              </div>
              <div>
                <label className={labelCls}>堆积密度 (%)</label>
                <input
                  type="number"
                  className={errors.packingDensity ? inputErrorCls : inputCls}
                  value={powder.packingDensity}
                  onChange={(e) => {
                    const val = +e.target.value;
                    setPowder({ ...powder, packingDensity: val });
                    if (errors.packingDensity) {
                      const newErr = validateField('packingDensity', val);
                      if (!newErr) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.packingDensity;
                          return next;
                        });
                      }
                    }
                  }}
                />
                <FieldError error={errors.packingDensity} />
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <UploadZone
              label="激光扫描路径文件"
              file={scanPathFile}
              onFile={setScanPathFile}
              errorKey="scanPathFile"
              accept=".svg,.gcode,.cli"
            />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>激光功率 (W)</label>
                <input
                  type="number"
                  className={errors.power ? inputErrorCls : inputCls}
                  value={laser.power}
                  onChange={(e) => {
                    const val = +e.target.value;
                    setLaser({ ...laser, power: val });
                    if (errors.power) {
                      const newErr = validateField('power', val);
                      if (!newErr) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.power;
                          return next;
                        });
                      }
                    }
                  }}
                />
                <FieldError error={errors.power} />
              </div>
              <div>
                <label className={labelCls}>扫描速度 (mm/s)</label>
                <input
                  type="number"
                  className={errors.scanSpeed ? inputErrorCls : inputCls}
                  value={laser.scanSpeed}
                  onChange={(e) => {
                    const val = +e.target.value;
                    setLaser({ ...laser, scanSpeed: val });
                    if (errors.scanSpeed) {
                      const newErr = validateField('scanSpeed', val);
                      if (!newErr) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.scanSpeed;
                          return next;
                        });
                      }
                    }
                  }}
                />
                <FieldError error={errors.scanSpeed} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}> hatch间距 (μm)</label>
                <input
                  type="number"
                  className={errors.hatchSpacing ? inputErrorCls : inputCls}
                  value={laser.hatchSpacing}
                  onChange={(e) => {
                    const val = +e.target.value;
                    setLaser({ ...laser, hatchSpacing: val });
                    if (errors.hatchSpacing) {
                      const newErr = validateField('hatchSpacing', val);
                      if (!newErr) {
                        setErrors((prev) => {
                          const next = { ...prev };
                          delete next.hatchSpacing;
                          return next;
                        });
                      }
                    }
                  }}
                />
                <FieldError error={errors.hatchSpacing} />
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
              <input
                type="number"
                className={errors.temperature ? inputErrorCls : inputCls}
                value={substrate.temperature}
                onChange={(e) => {
                  const val = +e.target.value;
                  setSubstrate({ ...substrate, temperature: val });
                  if (errors.temperature) {
                    const newErr = validateField('temperature', val);
                    if (!newErr) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.temperature;
                        return next;
                      });
                    }
                  }
                }}
              />
              <FieldError error={errors.temperature} />
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

            <div className="mt-4 rounded-lg border border-brand-border/60 bg-brand-bg/50 p-4">
              <h4 className="mb-2 text-xs font-semibold text-brand-cyan">参数校验摘要</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-brand-green" />
                  粉末材料: {powder.material}
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-brand-green" />
                  激光功率: {laser.power}W
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-brand-green" />
                  扫描速度: {laser.scanSpeed} mm/s
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle className="h-3.5 w-3.5 text-brand-green" />
                  基板温度: {substrate.temperature}°C
                </div>
              </div>
              <p className="mt-3 text-[11px] text-brand-text-muted">
                * 提交后系统将自动校验数据完整性并进入参数解析阶段
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={handlePrev}
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
            onClick={handleNext}
            className="flex items-center gap-1 rounded-lg bg-brand-cyan px-4 py-2 text-sm font-medium text-brand-bg transition-colors hover:bg-brand-cyan-dim"
          >
            下一步
            <ChevronRight className="h-4 w-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isMaterialPaused}
            className={`flex items-center gap-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              isMaterialPaused
                ? 'cursor-not-allowed bg-brand-text-muted/30 text-brand-text-muted'
                : 'bg-brand-cyan text-brand-bg hover:bg-brand-cyan-dim'
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            {isMaterialPaused ? '材料已暂停' : '提交任务'}
          </button>
        )}
      </div>
    </div>
  );
}
