import { Sidebar } from "@/components/shared/Sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main style={{ minWidth: 0 }}>{children}</main>
    </div>
  )
}
