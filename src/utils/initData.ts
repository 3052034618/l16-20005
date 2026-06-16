import { useStore } from "@/store";
import {
  generateInitialTasks,
  generateInitialAlerts,
  generateInitialReports,
  generateInitialApprovals,
  generateInitialRecommendations,
  generateInitialMaterialAlerts,
  generateInitialDailyStats,
  generateInitialMonitoringData,
} from "@/utils/mockData";

export function initializeStore() {
  const tasks = generateInitialTasks();
  const recommendations = generateInitialRecommendations();
  const materialAlerts = generateInitialMaterialAlerts();
  const dailyStats = generateInitialDailyStats();

  const completedTasks = tasks.filter((t) => t.status === "completed");
  const activeTasks = tasks.filter(
    (t) =>
      t.status === "coupling_calculation" ||
      t.status === "melt_pool_analysis" ||
      t.status === "parsing"
  );

  const reports = generateInitialReports();
  reports.forEach((report, i) => {
    if (completedTasks[i]) {
      report.taskId = completedTasks[i].id;
    }
  });

  const validReports = reports.filter((r) => r.taskId);

  const approvals = generateInitialApprovals();
  if (validReports.length >= 2) {
    approvals[0].reportId = validReports[0].id;
    approvals[1].reportId = validReports[1].id;
    approvals[2].reportId = validReports[0].id;
    approvals[3].reportId = validReports[1].id;
  } else if (validReports.length >= 1) {
    approvals[0].reportId = validReports[0].id;
    approvals[1].reportId = validReports[0].id;
    approvals[2].reportId = validReports[0].id;
    approvals[3].reportId = validReports[0].id;
  }

  const alerts = generateInitialAlerts();
  const alertTargetTasks = [...activeTasks, ...completedTasks];
  alerts.forEach((alert, i) => {
    if (alertTargetTasks[i % alertTargetTasks.length]) {
      alert.taskId = alertTargetTasks[i % alertTargetTasks.length].id;
    }
  });

  const monitoringData = new Map<string, ReturnType<typeof generateInitialMonitoringData>>();
  tasks.forEach((task) => {
    if (task.status !== "pending_validation" && task.status !== "error_rollback") {
      monitoringData.set(task.id, generateInitialMonitoringData(task.id, 60));
    }
  });

  useStore.setState({
    tasks,
    alerts,
    reports,
    approvals,
    recommendations,
    materialAlerts,
    dailyStats,
    monitoringData,
    currentUser: {
      id: "user-001",
      name: "Dr. Zhang Wei",
      role: "scientist",
    },
  });
}
