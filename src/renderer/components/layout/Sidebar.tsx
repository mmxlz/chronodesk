import { cn } from '@/lib/cn'
import { useSettingsStore, ViewId } from '@/store/settings-store'
import {
  FiClock,
  FiCpu,
  FiCoffee,
  FiFileText,
  FiSettings
} from 'react-icons/fi'

interface NavItem {
  id: ViewId
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { id: 'clock', label: '时钟', icon: <FiClock size={20} /> },
  { id: 'monitor', label: '监测', icon: <FiCpu size={20} /> },
  { id: 'pomodoro', label: '番茄钟', icon: <FiCoffee size={20} /> },
  { id: 'notes', label: '便签', icon: <FiFileText size={20} /> },
  { id: 'settings', label: '设置', icon: <FiSettings size={20} /> }
]

export default function Sidebar() {
  const { selectedView, setSelectedView } = useSettingsStore()

  return (
    <div className="w-16 h-full flex flex-col items-center py-4 gap-1 border-r border-border bg-surface">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => setSelectedView(item.id)}
          className={cn(
            'w-11 h-11 flex flex-col items-center justify-center rounded-lg transition-all gap-0.5',
            selectedView === item.id
              ? 'bg-primary text-white'
              : 'text-text-secondary hover:bg-surface-hover hover:text-text'
          )}
          title={item.label}
        >
          {item.icon}
          <span className="text-[9px] leading-none">{item.label}</span>
        </button>
      ))}
    </div>
  )
}
