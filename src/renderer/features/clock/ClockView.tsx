import { useState } from 'react'
import DigitalClock from './DigitalClock'
import AnalogClock from './AnalogClock'
import WorldClocks from './WorldClocks'
import CountdownTimer from './CountdownTimer'
import { useThemeStore, ClockPosition } from '@/store/theme-store'
import { cn } from '@/lib/cn'

type Tab = 'digital' | 'analog' | 'world' | 'countdown'

const tabs: { key: Tab; label: string }[] = [
  { key: 'digital', label: '数字' },
  { key: 'analog', label: '模拟' },
  { key: 'world', label: '世界时钟' },
  { key: 'countdown', label: '倒计时' }
]

const positionMap: Record<ClockPosition, string> = {
  center: 'items-center justify-center',
  top: 'items-center justify-start pt-12',
  'top-left': 'items-start justify-start p-8',
  'top-right': 'items-start justify-end p-8',
  bottom: 'items-center justify-end pb-12',
  'bottom-left': 'items-end justify-start p-8',
  'bottom-right': 'items-end justify-end p-8'
}

export default function ClockView() {
  const [mode, setMode] = useState<Tab>('digital')
  const clockPosition = useThemeStore((s) => s.clockPosition)

  const isWidget = mode === 'world' || mode === 'countdown'

  return (
    <div className="h-full flex flex-col p-8 overflow-auto">
      {/* Tab bar */}
      <div className="flex justify-center mb-6">
        <div className="flex bg-surface rounded-lg p-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setMode(tab.key)}
              className={cn(
                'px-3 py-1 text-xs rounded-md transition-colors',
                mode === tab.key
                  ? 'bg-primary text-white'
                  : 'text-text-secondary hover:text-text'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div
        className={cn(
          'flex-1 flex flex-col w-full max-w-lg mx-auto',
          isWidget ? '' : positionMap[clockPosition]
        )}
      >
        {mode === 'digital' && <DigitalClock />}
        {mode === 'analog' && <AnalogClock />}
        {mode === 'world' && <WorldClocks />}
        {mode === 'countdown' && <CountdownTimer />}
      </div>
    </div>
  )
}
