import React from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)
  const isInIframe = window.self !== window.top

  return (
    <div className={`flex h-screen ${isInIframe ? 'bg-gray-50' : 'bg-gray-50'}`}>
      {!isInIframe && <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 overflow-auto">
          <div className={`${isInIframe ? 'container mx-auto w-full h-full p-0' : 'container mx-auto max-w-7xl p-6'}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout
