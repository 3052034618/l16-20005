import { v4 } from 'uuid';
import type {
  Alert,
  Report,
  Recommendation,
  MonitoringData,
  AdjustStrategy,
  TaskStatus,
} from '@/types';
import { useStore as useZustandStore } from '@/store';

type StoreHook = typeof useZustandStore;

const STATE_PIPELINE: TaskStatus[] = [
  'pending_validation',
  'parsing',
  'coupling_calculation',
  'melt_pool_analysis',
  'completed',
];

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export class MockSimulationEngine {
  private storeHook: StoreHook;
  private simulationIntervals: Map<string, NodeJS.Timeout> = new Map();
  private monitoringIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(storeHook: StoreHook) {
    this.storeHook = storeHook;
  }

  startSimulation(taskId: string): void {
    if (this.simulationIntervals.has(taskId)) return;

    const store = this.storeHook.getState();
    const task = store.getTaskById(taskId);
    if (!task || task.status === 'completed' || task.status === 'error_rollback') return;

    let currentIndex = STATE_PIPELINE.indexOf(task.status);

    const advanceState = () => {
      const currentTask = this.storeHook.getState().getTaskById(taskId);
      if (!currentTask) {
        this.stopSimulation(taskId);
        return;
      }

      if (currentIndex >= STATE_PIPELINE.length - 1) {
        this.storeHook.getState().updateTaskStatus(taskId, 'completed');
        this.stopSimulation(taskId);
        this.stopMonitoring(taskId);
        this.generateReport(taskId);
        this.generateApprovals(taskId);
        return;
      }

      const nextIndex = currentIndex + 1;
      const nextStatus = STATE_PIPELINE[nextIndex];

      this.storeHook.getState().updateTaskStatus(taskId, nextStatus);
      currentIndex = nextIndex;

      if (nextStatus === 'coupling_calculation') {
        this.startMonitoring(taskId);
      } else {
        this.stopMonitoring(taskId);
      }

      if (nextStatus === 'melt_pool_analysis') {
        this.maybeGenerateAlert(taskId, currentTask.materialType);
      }
    };

    const delay = 3000 + Math.random() * 2000;
    const intervalId = setInterval(advanceState, delay);
    this.simulationIntervals.set(taskId, intervalId);
  }

  stopSimulation(taskId: string): void {
    const intervalId = this.simulationIntervals.get(taskId);
    if (intervalId) {
      clearInterval(intervalId);
      this.simulationIntervals.delete(taskId);
    }
  }

  startMonitoring(taskId: string): void {
    if (this.monitoringIntervals.has(taskId)) return;

    const intervalId = setInterval(() => {
      const store = this.storeHook.getState();
      const task = store.getTaskById(taskId);
      if (!task || task.status !== 'coupling_calculation') {
        this.stopMonitoring(taskId);
        return;
      }

      const now = Date.now();
      const t = now / 1000;
      const noise = () => (Math.random() - 0.5) * 2;

      const temperature = 1800 + 400 * Math.sin(2 * Math.PI * 0.1 * t) + noise() * 30;
      const coolingRate = 1e6 + 3e5 * Math.sin(2 * Math.PI * 0.08 * t) + noise() * 2e4;
      const thresholdExceeded = temperature > 2200 || coolingRate > 1.2e6;

      const dataPoint: MonitoringData = {
        id: v4(),
        taskId,
        timestamp: now,
        temperature,
        coolingRate,
        thresholdExceeded,
      };

      store.addMonitoringData(taskId, dataPoint);
    }, 500);

    this.monitoringIntervals.set(taskId, intervalId);
  }

  stopMonitoring(taskId: string): void {
    const intervalId = this.monitoringIntervals.get(taskId);
    if (intervalId) {
      clearInterval(intervalId);
      this.monitoringIntervals.delete(taskId);
    }
  }

  reviewAlert(alertId: string, strategy: AdjustStrategy): void {
    const store = this.storeHook.getState();
    const alert = store.alerts.find((a: Alert) => a.id === alertId);
    if (!alert) return;

    this.storeHook.getState().updateAlert(alertId, {
      status: 'adjusted',
      adjustStrategy: strategy,
      reviewedBy: store.currentUser.name,
      reviewedAt: Date.now(),
    });

    if (strategy === 'laser_power' || strategy === 'scan_speed') {
      const task = store.getTaskById(alert.taskId);
      if (!task) return;

      const updatedTask = this.storeHook.getState().getTaskById(alert.taskId);
      if (!updatedTask) return;

      if (strategy === 'laser_power') {
        const factor = alert.severity === 'critical' ? 0.9 : 0.95;
        this.storeHook.setState((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === alert.taskId
              ? {
                  ...t,
                  laserParams: { ...t.laserParams, power: t.laserParams.power * factor },
                  updatedAt: Date.now(),
                }
              : t
          ),
        }));
      } else {
        const factor = alert.severity === 'critical' ? 0.9 : 0.95;
        this.storeHook.setState((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === alert.taskId
              ? {
                  ...t,
                  laserParams: { ...t.laserParams, scanSpeed: t.laserParams.scanSpeed * factor },
                  updatedAt: Date.now(),
                }
              : t
          ),
        }));
      }

      this.stopSimulation(alert.taskId);
      this.stopMonitoring(alert.taskId);
      this.storeHook.getState().updateTaskStatus(alert.taskId, 'pending_validation');
      this.startSimulation(alert.taskId);
    }
  }

  generateReport(taskId: string): Report {
    const store = this.storeHook.getState();
    const task = store.getTaskById(taskId);
    const material = task?.materialType ?? 'Ti6Al4V';

    const report: Report = {
      id: v4(),
      taskId,
      meltPoolMorphology: {
        width: randomBetween(0.10, 0.20),
        depth: randomBetween(0.06, 0.16),
        length: randomBetween(0.20, 0.40),
      },
      temperatureField: {
        maxTemp: randomBetween(2200, 3000),
        avgTemp: randomBetween(1600, 2200),
        gradient: randomBetween(8e5, 1.8e6),
      },
      residualStress: {
        maxStress: randomBetween(350, 700),
        distribution: ['bimodal', 'gradient', 'uniform'][Math.floor(Math.random() * 3)],
      },
      porosityDeviation: randomBetween(0.01, 0.06),
      createdAt: Date.now(),
    };

    this.storeHook.getState().addReport(report);

    return report;
  }

  generateRecommendation(materialType: string): Recommendation {
    const recommendation: Recommendation = {
      id: v4(),
      materialType,
      params: {
        laserPower: randomBetween(200, 350),
        scanSpeed: randomBetween(800, 1400),
        hatchSpacing: randomBetween(0.10, 0.16),
        substrateTemp: randomBetween(150, 250),
      },
      confidence: randomBetween(0.75, 0.95),
      sourceTaskIds: [],
      expectedResults: {
        porosity: randomBetween(0.01, 0.05),
        residualStress: randomBetween(280, 500),
        meltPoolWidth: randomBetween(0.10, 0.20),
      },
      createdAt: Date.now(),
    };

    this.storeHook.getState().addRecommendation(recommendation);

    return recommendation;
  }

  private maybeGenerateAlert(taskId: string, material: string): void {
    if (Math.random() > 0.6) return;

    const alertTypes: Alert['type'][] = ['temperature', 'cooling_rate', 'porosity'];
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const isCritical = Math.random() > 0.5;

    const alert: Alert = {
      id: v4(),
      taskId,
      type: alertType,
      severity: isCritical ? 'critical' : 'warning',
      message: this.generateAlertMessage(alertType, material, isCritical),
      status: 'pending',
      createdAt: Date.now(),
    };

    this.storeHook.getState().addAlert(alert);
  }

  private generateAlertMessage(type: Alert['type'], material: string, isCritical: boolean): string {
    const severityText = isCritical ? '严重' : '轻微';
    const messages: Record<string, string> = {
      temperature: `${material} 熔池温度${severityText}超标，需调整激光功率`,
      cooling_rate: `${material} 冷却速率${severityText}异常，需调整扫描速度`,
      porosity: `${material} 局部气孔率${severityText}偏高，需优化工艺参数`,
    };
    return messages[type];
  }

  private generateApprovals(taskId: string): void {
    const store = this.storeHook.getState();
    const report = store.getReportByTaskId(taskId);
    if (!report) return;

    store.addApproval({
      id: v4(),
      reportId: report.id,
      level: 1,
      status: 'pending',
    });
    store.addApproval({
      id: v4(),
      reportId: report.id,
      level: 2,
      status: 'pending',
    });
  }
}
