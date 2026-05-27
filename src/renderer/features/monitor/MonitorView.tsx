import CpuCard from './CpuCard'
import MemoryCard from './MemoryCard'
import DiskCard from './DiskCard'
import NetworkCard from './NetworkCard'
import GpuCard from './GpuCard'

export default function MonitorView() {
  return (
    <div className="h-full p-4 overflow-auto">
      <div className="grid grid-cols-2 gap-4 auto-rows-auto">
        <CpuCard />
        <MemoryCard />
        <GpuCard />
        <DiskCard />
        <div className="col-span-2">
          <NetworkCard />
        </div>
      </div>
    </div>
  )
}
