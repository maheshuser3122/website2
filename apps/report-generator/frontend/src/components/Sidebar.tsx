import React from 'react'
import { FiX, FiUpload, FiSettings, FiHelpCircle, FiBook } from 'react-icons/fi'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const menuItems = [
    { icon: FiUpload, label: 'Upload Data', section: 'upload' },
    { icon: FiBook, label: 'Report Templates', section: 'templates' },
    { icon: FiSettings, label: 'Settings', section: 'settings' },
    { icon: FiHelpCircle, label: 'Help & Documentation', section: 'help' },
  ]

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold">Menu</h2>
          <button onClick={onToggle} className="lg:hidden p-2 hover:bg-gray-800 rounded">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <nav className="p-4 space-y-2">
          {menuItems.map((item) => (
            <a
              key={item.section}
              href={`#${item.section}`}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors group"
            >
              <item.icon className="w-5 h-5 group-hover:text-blue-400" />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800 bg-gray-800">
          <p className="text-sm text-gray-400">
            © 2024 Report Generator v1.0.0
          </p>
          <p className="text-xs text-gray-500 mt-1">Production Grade</p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
