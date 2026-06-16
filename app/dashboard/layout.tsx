import type { Metadata } from 'next'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'

export const metadata: Metadata = {
  title: 'ISPLens - ABSA',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="dashboard-layout">
      {/* Fixed Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="dashboard-main">
        <Topbar />
        <main style={{ padding: '28px 32px' }}>{children}</main>
      </div>
    </div>
  )
}
