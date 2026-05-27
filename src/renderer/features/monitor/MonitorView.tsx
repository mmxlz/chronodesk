import CpuCard from './CpuCard'
import MemoryCard from './MemoryCard'
import DiskCard from './DiskCard'
import NetworkCard from './NetworkCard'

export default function MonitorView() {
  return (
    <div className="h-full p-4 grid grid-cols-2 gap-4 auto-rows-fr">
      <CpuCard />
      <MemoryCard />
      <DiskCard />
      <NetworkCard />
    </div>
  )
}
