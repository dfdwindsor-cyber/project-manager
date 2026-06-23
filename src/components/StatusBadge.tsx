import { cn } from '@/lib/utils'
import { STATUS_CONFIG, type TaskStatus } from '@/lib/data'

interface StatusBadgeProps {
  status: TaskStatus
  onClick?: () => void
}

export function StatusBadge({ status, onClick }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status]

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-default',
        'hover:opacity-80 cursor-pointer',
        config.className
      )}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {config.label}
    </button>
  )
}