import { v4 } from 'uuid';
import type {
  SimulationTask,
  Alert,
  Report,
  Approval,
  Recommendation,
  MaterialAlert,
  DailyStats,
  MonitoringData,
  TaskStatus,
  PowderParams,
  LaserParams,
  SubstrateParams,
} from '@/types';

const MATERIALS = ['Ti6Al4V', 'IN718', '316L SS', 'AlSi10Mg'] as const;

const TASK_STATUSES: TaskStatus[] = [
  'pending_validation',
  'parsing',
  'coupling_calculation',
  'melt_pool_analysis',
  'completed',
  'error_rollback',
];

const MATERIAL_POWDER_PARAMS: Record<string, PowderParams> = {
  'Ti6Al4V': { material: 'Ti6Al4V', particleSize: 30, layerThickness: 0.03, packingDensity: 0.62 },
  'IN718': { material: 'IN718', particleSize: 25, layerThickness: 0.04, packingDensity: 0.60 },
  '316L SS': { material: '316L SS', particleSize: 35, layerThickness: 0.05, packingDensity: 0.64 },
  'AlSi10Mg': { material: 'AlSi10Mg', particleSize: 28, layerThickness: 0.03, packingDensity: 0.58 },
};

const MATERIAL_LASER_PARAMS: Record<string, LaserParams> = {
  'Ti6Al4V': { power: 285, scanSpeed: 1200, hatchSpacing: 0.14, scanStrategy: 'stripe' },
  'IN718': { power: 250, scanSpeed: 1000, hatchSpacing: 0.12, scanStrategy: 'checkerboard' },
  '316L SS': { power: 200, scanSpeed: 800, hatchSpacing: 0.10, scanStrategy: 'stripe' },
  'AlSi10Mg': { power: 350, scanSpeed: 1400, hatchSpacing: 0.16, scanStrategy: 'island' },
};

const MATERIAL_SUBSTRATE_PARAMS: Record<string, SubstrateParams> = {
  'Ti6Al4V': { temperature: 200, preheatingEnabled: true },
  'IN718': { temperature: 250, preheatingEnabled: true },
  '316L SS': { temperature: 150, preheatingEnabled: false },
  'AlSi10Mg': { temperature: 180, preheatingEnabled: true },
};

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function generateInitialTasks(): SimulationTask[] {
  const tasks: SimulationTask[] = [];
  const statusDistribution: TaskStatus[] = [
    'pending_validation',
    'parsing',
    'coupling_calculation',
    'melt_pool_analysis',
    'completed',
    'completed',
    'completed',
    'error_rollback',
  ];

  const taskNames = [
    'Aero-Bracket', 'Turbine-Blade', 'Heat-Exchanger', 'Impeller',
    'Manifold', 'Flange', 'Fitting', 'Mount',
  ];

  for (let i = 0; i < 8; i++) {
    const material = MATERIALS[i % MATERIALS.length];
    const status = statusDistribution[i];
    const createdAt = Date.now() - (8 - i) * 3600000;

    const statusHistory: { status: TaskStatus; timestamp: number }[] = [];
    const statusIdx = TASK_STATUSES.indexOf(status);
    for (let j = 0; j <= statusIdx; j++) {
      statusHistory.push({
        status: TASK_STATUSES[j],
        timestamp: createdAt + j * 600000,
      });
    }

    tasks.push({
      id: v4(),
      name: `${material}-${taskNames[i]}-${String(1001 + i)}`,
      status,
      materialType: material,
      powderParams: {
        ...MATERIAL_POWDER_PARAMS[material],
        particleSize: MATERIAL_POWDER_PARAMS[material].particleSize + randomBetween(-2, 2),
      },
      laserParams: {
        ...MATERIAL_LASER_PARAMS[material],
        power: MATERIAL_LASER_PARAMS[material].power + randomBetween(-10, 10),
        scanSpeed: MATERIAL_LASER_PARAMS[material].scanSpeed + randomBetween(-50, 50),
      },
      substrateParams: MATERIAL_SUBSTRATE_PARAMS[material],
      statusHistory,
      createdAt,
      updatedAt: Date.now() - (8 - i) * 1800000,
      createdBy: i % 2 === 0 ? 'Dr. Zhang Wei' : 'Dr. Li Ming',
    });
  }

  return tasks;
}

export function generateInitialAlerts(): Alert[] {
  const now = Date.now();
  return [
    {
      id: v4(),
      taskId: '',
      type: 'temperature',
      message: '熔池温度超过阈值上限，峰值温度达 2350°C',
      severity: 'critical',
      status: 'pending',
      createdAt: now - 120000,
    },
    {
      id: v4(),
      taskId: '',
      type: 'cooling_rate',
      message: '冷却速率异常偏低，当前 6.2×10⁵ °C/s',
      severity: 'warning',
      status: 'pending',
      createdAt: now - 90000,
    },
    {
      id: v4(),
      taskId: '',
      type: 'porosity',
      message: '检测到局部气孔率上升至 0.8%',
      severity: 'warning',
      status: 'reviewing',
      createdAt: now - 300000,
    },
    {
      id: v4(),
      taskId: '',
      type: 'temperature',
      message: '温度场梯度异常，热影响区扩大',
      severity: 'warning',
      status: 'adjusted',
      adjustStrategy: 'laser_power',
      reviewedBy: 'Dr. Zhang Wei',
      reviewedAt: now - 200000,
      createdAt: now - 600000,
    },
    {
      id: v4(),
      taskId: '',
      type: 'cooling_rate',
      message: '冷却速率超标，当前 1.5×10⁶ °C/s',
      severity: 'critical',
      status: 'dismissed',
      reviewedBy: 'Prof. Wang Jun',
      reviewedAt: now - 500000,
      createdAt: now - 900000,
    },
  ];
}

export function generateInitialReports(): Report[] {
  return [
    {
      id: v4(),
      taskId: '',
      meltPoolMorphology: {
        width: randomBetween(0.12, 0.18),
        depth: randomBetween(0.08, 0.14),
        length: randomBetween(0.25, 0.35),
      },
      temperatureField: {
        maxTemp: randomBetween(2600, 3000),
        avgTemp: randomBetween(1800, 2200),
        gradient: randomBetween(1.2e6, 1.8e6),
      },
      residualStress: {
        maxStress: randomBetween(450, 650),
        distribution: 'bimodal',
      },
      porosityDeviation: randomBetween(0.01, 0.05),
      createdAt: Date.now() - 7200000,
    },
    {
      id: v4(),
      taskId: '',
      meltPoolMorphology: {
        width: randomBetween(0.10, 0.15),
        depth: randomBetween(0.06, 0.10),
        length: randomBetween(0.20, 0.30),
      },
      temperatureField: {
        maxTemp: randomBetween(2400, 2800),
        avgTemp: randomBetween(1700, 2100),
        gradient: randomBetween(1.0e6, 1.6e6),
      },
      residualStress: {
        maxStress: randomBetween(500, 700),
        distribution: 'gradient',
      },
      porosityDeviation: randomBetween(0.02, 0.06),
      createdAt: Date.now() - 5400000,
    },
    {
      id: v4(),
      taskId: '',
      meltPoolMorphology: {
        width: randomBetween(0.14, 0.20),
        depth: randomBetween(0.10, 0.16),
        length: randomBetween(0.30, 0.40),
      },
      temperatureField: {
        maxTemp: randomBetween(2200, 2600),
        avgTemp: randomBetween(1600, 2000),
        gradient: randomBetween(8e5, 1.4e6),
      },
      residualStress: {
        maxStress: randomBetween(350, 550),
        distribution: 'uniform',
      },
      porosityDeviation: randomBetween(0.01, 0.03),
      createdAt: Date.now() - 3600000,
    },
  ];
}

export function generateInitialApprovals(): Approval[] {
  const now = Date.now();
  return [
    {
      id: v4(),
      reportId: '',
      level: 1,
      status: 'approved',
      reviewer: 'Dr. Zhang Wei',
      comment: '参数合理，批准执行',
      reviewedAt: now - 7200000,
    },
    {
      id: v4(),
      reportId: '',
      level: 1,
      status: 'pending',
    },
    {
      id: v4(),
      reportId: '',
      level: 2,
      status: 'approved',
      reviewer: 'Prof. Wang Jun',
      comment: '二级审核通过，可进入生产阶段',
      reviewedAt: now - 5400000,
    },
    {
      id: v4(),
      reportId: '',
      level: 2,
      status: 'pending',
    },
  ];
}

export function generateInitialRecommendations(): Recommendation[] {
  const now = Date.now();
  return [
    {
      id: v4(),
      materialType: 'Ti6Al4V',
      params: { laserPower: 280, scanSpeed: 1200, hatchSpacing: 0.14, substrateTemp: 200 },
      confidence: 0.92,
      sourceTaskIds: [],
      expectedResults: { porosity: 0.02, residualStress: 380, meltPoolWidth: 0.15 },
      createdAt: now - 86400000,
    },
    {
      id: v4(),
      materialType: 'IN718',
      params: { laserPower: 250, scanSpeed: 1000, hatchSpacing: 0.12, substrateTemp: 250 },
      confidence: 0.88,
      sourceTaskIds: [],
      expectedResults: { porosity: 0.03, residualStress: 420, meltPoolWidth: 0.12 },
      createdAt: now - 72000000,
    },
    {
      id: v4(),
      materialType: '316L SS',
      params: { laserPower: 200, scanSpeed: 800, hatchSpacing: 0.10, substrateTemp: 150 },
      confidence: 0.95,
      sourceTaskIds: [],
      expectedResults: { porosity: 0.01, residualStress: 300, meltPoolWidth: 0.17 },
      createdAt: now - 50000000,
    },
    {
      id: v4(),
      materialType: 'AlSi10Mg',
      params: { laserPower: 350, scanSpeed: 1400, hatchSpacing: 0.16, substrateTemp: 180 },
      confidence: 0.85,
      sourceTaskIds: [],
      expectedResults: { porosity: 0.04, residualStress: 280, meltPoolWidth: 0.16 },
      createdAt: now - 36000000,
    },
  ];
}

export function generateInitialMaterialAlerts(): MaterialAlert[] {
  return [
    {
      id: v4(),
      materialType: 'Ti6Al4V',
      consecutiveDeviations: 3,
      isPaused: true,
      pausedAt: Date.now() - 600000,
      notifiedScientist: 'Prof. Chen Hua',
    },
    {
      id: v4(),
      materialType: 'IN718',
      consecutiveDeviations: 1,
      isPaused: false,
    },
  ];
}

export function generateInitialDailyStats(): DailyStats[] {
  const stats: DailyStats[] = [];
  const now = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];

    const totalTasks = Math.floor(randomBetween(8, 16));
    const completionRate = randomBetween(0.55, 0.95);
    const completedTasks = Math.floor(totalTasks * completionRate);

    stats.push({
      date: dateStr,
      totalTasks,
      completedTasks,
      completionRate,
      alertsCount: Math.floor(randomBetween(1, 8)),
      avgPorosityDeviation: randomBetween(0.01, 0.08),
    });
  }

  return stats;
}

export function generateInitialMonitoringData(taskId: string, count: number): MonitoringData[] {
  const data: MonitoringData[] = [];
  const now = Date.now();
  const interval = 500;
  const baseTemp = 1800;
  const tempAmplitude = 400;
  const baseCoolingRate = 1e6;
  const coolingRateAmplitude = 3e5;

  for (let i = 0; i < count; i++) {
    const t = (i * interval) / 1000;
    const noise = () => (Math.random() - 0.5) * 2;

    const temperature = baseTemp + tempAmplitude * Math.sin(2 * Math.PI * 0.1 * t) + noise() * 30;
    const coolingRate = baseCoolingRate + coolingRateAmplitude * Math.sin(2 * Math.PI * 0.08 * t) + noise() * 2e4;
    const thresholdExceeded = temperature > 2200 || coolingRate > 1.2e6;

    data.push({
      id: v4(),
      taskId,
      timestamp: now - (count - i) * interval,
      temperature,
      coolingRate,
      thresholdExceeded,
    });
  }

  return data;
}
