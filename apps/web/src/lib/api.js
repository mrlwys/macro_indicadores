const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export async function fetchLatestDashboard() {
  const response = await fetch(`${API_BASE_URL}/dashboard/latest`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dashboard data (${response.status})`);
  }

  return response.json();
}
