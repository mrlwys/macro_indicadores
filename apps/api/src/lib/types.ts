export type {
  DashboardAction,
  DashboardAlert,
  DashboardBlockCoverage,
  DashboardData,
  DashboardMeta,
  DashboardRevenueMonth,
  DashboardSnapshot,
} from "./dashboardSchema.js";

export type AccessLevel = "admin" | "user";

export type UserPublic = {
  id: string;
  full_name: string;
  username: string;
  access_level: AccessLevel;
  is_active: boolean;
  created_at: string;
};

export type AuthUser = {
  id: string;
  username: string;
  accessLevel: AccessLevel;
};
