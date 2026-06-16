import { create } from "zustand";
import type {
  TaskStatus,
  SimulationTask,
  MonitoringData,
  Alert,
  Report,
  Approval,
  Recommendation,
  MaterialAlert,
  DailyStats,
  User,
} from "@/types";

interface StoreState {
  tasks: SimulationTask[];
  monitoringData: Map<string, MonitoringData[]>;
  alerts: Alert[];
  reports: Report[];
  approvals: Approval[];
  recommendations: Recommendation[];
  materialAlerts: MaterialAlert[];
  dailyStats: DailyStats[];
  currentUser: User;
  activeTaskId: string | null;
}

interface StoreActions {
  addTask: (task: SimulationTask) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  addMonitoringData: (taskId: string, data: MonitoringData) => void;
  addAlert: (alert: Alert) => void;
  updateAlert: (alertId: string, updates: Partial<Alert>) => void;
  addReport: (report: Report) => void;
  addApproval: (approval: Approval) => void;
  updateApproval: (approvalId: string, updates: Partial<Approval>) => void;
  addRecommendation: (rec: Recommendation) => void;
  updateMaterialAlert: (
    materialType: string,
    updates: Partial<MaterialAlert>
  ) => void;
  setActiveTaskId: (id: string | null) => void;
  getTaskById: (id: string) => SimulationTask | undefined;
  getReportByTaskId: (taskId: string) => Report | undefined;
  getAlertsByTaskId: (taskId: string) => Alert[];
  getPendingApprovals: () => Approval[];
  getMaterialAlert: (materialType: string) => MaterialAlert | undefined;
}

export const useStore = create<StoreState & StoreActions>()((set, get) => ({
  tasks: [],
  monitoringData: new Map(),
  alerts: [],
  reports: [],
  approvals: [],
  recommendations: [],
  materialAlerts: [],
  dailyStats: [],
  currentUser: { id: "", name: "", role: "engineer" },
  activeTaskId: null,

  addTask: (task) => set((state) => ({ tasks: [...state.tasks, task] })),

  updateTaskStatus: (taskId, status) =>
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status,
              statusHistory: [
                ...t.statusHistory,
                { status, timestamp: Date.now() },
              ],
              updatedAt: Date.now(),
            }
          : t
      ),
    })),

  addMonitoringData: (taskId, data) =>
    set((state) => {
      const next = new Map(state.monitoringData);
      const existing = next.get(taskId) ?? [];
      next.set(taskId, [...existing, data]);
      return { monitoringData: next };
    }),

  addAlert: (alert) => set((state) => ({ alerts: [...state.alerts, alert] })),

  updateAlert: (alertId, updates) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === alertId ? { ...a, ...updates } : a
      ),
    })),

  addReport: (report) =>
    set((state) => ({ reports: [...state.reports, report] })),

  addApproval: (approval) =>
    set((state) => ({ approvals: [...state.approvals, approval] })),

  updateApproval: (approvalId, updates) =>
    set((state) => ({
      approvals: state.approvals.map((a) =>
        a.id === approvalId ? { ...a, ...updates } : a
      ),
    })),

  addRecommendation: (rec) =>
    set((state) => ({ recommendations: [...state.recommendations, rec] })),

  updateMaterialAlert: (materialType, updates) =>
    set((state) => ({
      materialAlerts: state.materialAlerts.map((ma) =>
        ma.materialType === materialType ? { ...ma, ...updates } : ma
      ),
    })),

  setActiveTaskId: (id) => set({ activeTaskId: id }),

  getTaskById: (id) => get().tasks.find((t) => t.id === id),

  getReportByTaskId: (taskId) =>
    get().reports.find((r) => r.taskId === taskId),

  getAlertsByTaskId: (taskId) =>
    get().alerts.filter((a) => a.taskId === taskId),

  getPendingApprovals: () =>
    get().approvals.filter((a) => a.status === "pending"),

  getMaterialAlert: (materialType) =>
    get().materialAlerts.find((ma) => ma.materialType === materialType),
}));
