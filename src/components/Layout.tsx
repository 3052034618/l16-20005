import { useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  FlaskConical,
  Activity,
  FileText,
  Lightbulb,
  CheckSquare,
  AlertTriangle,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Bell,
  Atom,
} from "lucide-react";
import { useStore } from "@/store";

const NAV_ITEMS = [
  { label: "仪表盘", icon: LayoutDashboard, path: "/" },
  { label: "模拟任务", icon: FlaskConical, path: "/simulation" },
  { label: "实时监控", icon: Activity, path: "/monitor" },
  { label: "报告中心", icon: FileText, path: "/reports" },
  { label: "工艺推荐", icon: Lightbulb, path: "/recommendation" },
  { label: "审批工作台", icon: CheckSquare, path: "/approval" },
  { label: "预警中心", icon: AlertTriangle, path: "/alerts" },
  { label: "数据看板", icon: BarChart3, path: "/dashboard" },
];

const PAGE_TITLES: Record<string, string> = {
  "/": "仪表盘",
  "/simulation": "模拟任务",
  "/simulation/new": "新建模拟任务",
  "/monitor": "实时监控",
  "/reports": "报告中心",
  "/recommendation": "工艺推荐",
  "/approval": "审批工作台",
  "/alerts": "预警中心",
  "/dashboard": "数据看板",
};

const ROLE_LABELS: Record<string, string> = {
  engineer: "工程师",
  reviewer: "审核员",
  scientist: "科学家",
  admin: "管理员",
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { alerts, currentUser } = useStore();

  const sidebarWidth = collapsed ? 64 : 240;
  const pendingAlertsCount = alerts.filter((a) => a.status === "pending").length;

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith("/simulation/") && path !== "/simulation/new") {
      return "任务详情";
    }
    if (path.startsWith("/reports/") && path !== "/reports") {
      return "报告详情";
    }
    return PAGE_TITLES[path] || "PBF-Sim";
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-brand-bg">
      <aside
        className="flex h-full flex-col border-r border-brand-border bg-brand-bg transition-all duration-300"
        style={{ width: sidebarWidth }}
      >
        <div className="flex h-14 items-center gap-2 border-b border-brand-border px-4">
          <Atom className="h-6 w-6 shrink-0 text-brand-cyan" />
          {!collapsed && (
            <span className="font-mono text-lg font-bold text-brand-cyan text-glow-cyan">
              PBF-Sim
            </span>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                  isActive
                    ? "border-l-2 border-brand-cyan bg-brand-cyan/10 text-brand-cyan"
                    : "text-brand-text-muted hover:bg-brand-surface hover:text-brand-text"
                }`
              }
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="text-sm">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-brand-border p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex w-full items-center justify-center rounded-lg py-2 text-brand-text-muted transition-colors hover:bg-brand-surface hover:text-brand-text"
          >
            {collapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          className="fixed top-0 right-0 z-10 flex h-14 items-center justify-between border-b border-brand-border bg-brand-surface px-6 transition-all duration-300"
          style={{ left: sidebarWidth }}
        >
          <h1 className="text-lg font-semibold text-brand-text">
            {getPageTitle()}
          </h1>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Bell className="h-5 w-5 text-brand-text-muted transition-colors hover:text-brand-text" />
              {pendingAlertsCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-bold text-white">
                  {pendingAlertsCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-brand-text">{currentUser.name}</span>
              {currentUser.role && (
                <span className="rounded bg-brand-cyan/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-cyan">
                  {ROLE_LABELS[currentUser.role] || currentUser.role}
                </span>
              )}
            </div>
          </div>
        </header>

        <main
          className="overflow-y-auto p-6"
          style={{
            marginLeft: 0,
            marginTop: 56,
            height: "calc(100vh - 3.5rem)",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
