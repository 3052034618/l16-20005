export type TaskStatus =
  | "pending_validation"
  | "parsing"
  | "coupling_calculation"
  | "melt_pool_analysis"
  | "completed"
  | "error_rollback";

export type PowderParams = {
  material: string;
  particleSize: number;
  layerThickness: number;
  packingDensity: number;
};

export type LaserParams = {
  power: number;
  scanSpeed: number;
  hatchSpacing: number;
  scanStrategy: string;
};

export type SubstrateParams = {
  temperature: number;
  preheatingEnabled: boolean;
};

export type StatusHistoryEntry = {
  status: TaskStatus;
  timestamp: number;
};

export type SimulationTask = {
  id: string;
  name: string;
  status: TaskStatus;
  materialType: string;
  powderParams: PowderParams;
  laserParams: LaserParams;
  substrateParams: SubstrateParams;
  statusHistory: StatusHistoryEntry[];
  createdAt: number;
  updatedAt: number;
  createdBy: string;
};

export type MonitoringData = {
  id: string;
  taskId: string;
  timestamp: number;
  temperature: number;
  coolingRate: number;
  thresholdExceeded: boolean;
};

export type AlertType = "temperature" | "cooling_rate" | "porosity";
export type AlertSeverity = "warning" | "critical";
export type AlertStatus = "pending" | "reviewing" | "adjusted" | "dismissed";
export type AdjustStrategy = "laser_power" | "scan_speed" | "manual";

export type Alert = {
  id: string;
  taskId: string;
  type: AlertType;
  severity: AlertSeverity;
  message: string;
  status: AlertStatus;
  reviewedBy?: string;
  adjustStrategy?: AdjustStrategy;
  createdAt: number;
  reviewedAt?: number;
};

export type MeltPoolMorphology = {
  width: number;
  depth: number;
  length: number;
};

export type TemperatureField = {
  maxTemp: number;
  avgTemp: number;
  gradient: number;
};

export type ResidualStress = {
  maxStress: number;
  distribution: string;
};

export type Report = {
  id: string;
  taskId: string;
  meltPoolMorphology: MeltPoolMorphology;
  temperatureField: TemperatureField;
  residualStress: ResidualStress;
  porosityDeviation: number;
  pdfUrl?: string;
  createdAt: number;
};

export type ApprovalLevel = 1 | 2;
export type ApprovalStatus = "pending" | "approved" | "rejected";

export type Approval = {
  id: string;
  reportId: string;
  level: ApprovalLevel;
  status: ApprovalStatus;
  reviewer?: string;
  comment?: string;
  reviewedAt?: number;
};

export type RecommendationParams = {
  laserPower: number;
  scanSpeed: number;
  hatchSpacing: number;
  substrateTemp: number;
};

export type ExpectedResults = {
  porosity: number;
  residualStress: number;
  meltPoolWidth: number;
};

export type Recommendation = {
  id: string;
  materialType: string;
  params: RecommendationParams;
  confidence: number;
  sourceTaskIds: string[];
  expectedResults: ExpectedResults;
  createdAt: number;
};

export type MaterialAlert = {
  id: string;
  materialType: string;
  consecutiveDeviations: number;
  isPaused: boolean;
  pausedAt?: number;
  notifiedScientist?: string;
};

export type DailyStats = {
  date: string;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  alertsCount: number;
  avgPorosityDeviation: number;
};

export type UserRole = "engineer" | "reviewer" | "scientist" | "admin";

export type User = {
  id: string;
  name: string;
  role: UserRole;
  avatar?: string;
};
