import { AppDashboardShell } from './app-dashboard-shell';

export default function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppDashboardShell>{children}</AppDashboardShell>;
}
