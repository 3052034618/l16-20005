import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import SimulationList from "@/pages/SimulationList";
import SimulationNew from "@/pages/SimulationNew";
import SimulationDetail from "@/pages/SimulationDetail";
import Monitor from "@/pages/Monitor";
import Reports from "@/pages/Reports";
import ReportDetail from "@/pages/ReportDetail";
import Recommendation from "@/pages/Recommendation";
import Approval from "@/pages/Approval";
import Alerts from "@/pages/Alerts";
import DataDashboard from "@/pages/DataDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/simulation" element={<SimulationList />} />
          <Route path="/simulation/new" element={<SimulationNew />} />
          <Route path="/simulation/:id" element={<SimulationDetail />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/:id" element={<ReportDetail />} />
          <Route path="/recommendation" element={<Recommendation />} />
          <Route path="/approval" element={<Approval />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/dashboard" element={<DataDashboard />} />
        </Route>
      </Routes>
    </Router>
  );
}
