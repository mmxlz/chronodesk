import { useState } from 'react'
import DigitalClock from './DigitalClock'
import AnalogClock from './AnalogClock'
import WorldClocks from './WorldClocks'
import CountdownTimer from './CountdownTimer'
import { cn } from '@/lib/cn'

type Tab = 'digital' | 'analog' | 'world' | 'countdown'

const tabs: { key: Tab; label: string }[] = [
  { key: 'digital', label: '数字' },
  { key: 'analog', label: '模拟' },
  { key: 'world', label: '世界时钟' },
  { key: 'countdown', label: '倒计时' }
]

export default function ClockView() {
  const [mode, setMode] = useState<Tab>('digital')

  return (
    <div className="h-full flex flex-col items-center p-8 overflow-auto">
      {/* Tab bar */}
      <div className="flex bg-surface rounded-lg p-0.5 mb-8">
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

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-lg">
        {mode === 'digital' && <DigitalClock />}
        {mode === 'analog' && <AnalogClock />}
        {mode === 'world' && <WorldClocks />}
        {mode === 'countdown' && <CountdownTimer />}
      </div>
    </div>
  )
}
