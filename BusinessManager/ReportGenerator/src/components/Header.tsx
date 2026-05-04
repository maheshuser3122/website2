import React from 'react'
import { FiMenu, FiX } from 'react-icons/fi'

interface HeaderProps {
  onMenuClick: () => void
}

function Header({ onMenuClick }: HeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onMenuClick}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <FiMenu className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Report Generator</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Production v1.0.0</span>
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
            RG
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
