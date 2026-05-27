import { useState, useEffect } from 'react'
import { FiMinus, FiSquare, FiX, FiMaximize2 } from 'react-icons/fi'

export default function TopBar() {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.api.isMaximized().then(setIsMaximized)
  }, [])

  return (
    <div
      className="h-8 flex items-center justify-between select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex items-center px-3 gap-2">
        <div className="w-3 h-3 rounded-full bg-accent" />
        <span className="text-xs font-medium text-text-secondary">ChronoDesk</span>
      </div>

      <div
        className="flex h-full"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => window.api.minimize()}
          className="w-11 h-full flex items-center justify-center hover:bg-surface-hover transition-colors"
        >
          <FiMinus size={14} />
        </button>
        <button
          onClick={() => {
            window.api.maximize()
            window.api.isMaximized().then(setIsMaximized)
          }}
          className="w-11 h-full flex items-center justify-center hover:bg-surface-hover transition-colors"
        >
          {isMaximized ? <FiMaximize2 size={12} /> : <FiSquare size={12} />}
        </button>
        <button
          onClick={() => window.api.close()}
          className="w-11 h-full flex items-center justify-center hover:bg-error hover:text-white transition-colors"
        >
          <FiX size={14} />
        </button>
      </div>
    </div>
  )
}
