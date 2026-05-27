import { useState } from 'react'
import DigitalClock from './DigitalClock'
import AnalogClock from './AnalogClock'
import { cn } from '@/lib/cn'

export default function ClockView() {
  const [mode, setMode] = useState<'digital' | 'analog'>('digital')

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 relative">
      {/* Toggle */}
      <div className="absolute top-4 right-4 flex bg-surface rounded-lg p-0.5">
        <button
          onClick={() => setMode('digital')}
          className={cn(
            'px-3 py-1 text-xs rounded-md transition-colors',
            mode === 'digital' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text'
          )}
        >
          数字
        </button>
        <button
          onClick={() => setMode('analog')}
          className={cn(
            'px-3 py-1 text-xs rounded-md transition-colors',
            mode === 'analog' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text'
          )}
        >
          模拟
        </button>
      </div>

      {mode === 'digital' ? <DigitalClock /> : <AnalogClock />}
    </div>
  )
}
