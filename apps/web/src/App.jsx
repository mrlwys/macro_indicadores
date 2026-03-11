import { useEffect, useState } from "react";
import DashboardGrupoMusso from "./components/DashboardGrupoMusso.jsx";
import { fetchLatestDashboard } from "./lib/api.js";

export default function App() {
  const [dashboardData, setDashboardData] = useState(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const snapshot = await fetchLatestDashboard();
        if (mounted) {
          setDashboardData(snapshot?.payload ?? null);
        }
      } catch {
        // Keep UI running with local sample fallback inside component.
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  return <DashboardGrupoMusso data={dashboardData} />;
}
