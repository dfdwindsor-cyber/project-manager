import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { STATUS_CONFIG, STATUS_LIST, type TaskStatus } from '@/lib/data'
import { ChevronDown, Circle, Loader2, FlaskConical, CheckCircle2, ClipboardCheck, UserCheck, Database, Calculator } from 'lucide-react'

const STATUS_ICONS: Record<TaskStatus, React.ReactNode> = {
  not_started: <Circle className="w-3.5 h-3.5" />,
  data_ready: <Database className="w-3.5 h-3.5" />,
  developing: <Loader2 className="w-3.5 h-3.5" />,
  numerical_done: <Calculator className="w-3.5 h-3.5" />,
  func_testing: <ClipboardCheck className="w-3.5 h-3.5" />,
  testing: <FlaskConical className="w-3.5 h-3.5" />,
  planner_review: <UserCheck className="w-3.5 h-3.5" />,
  test_done: <CheckCircle2 className="w-3.5 h-3.5" />,
}

const STATUS_DOT_CLASSES: Record<TaskStatus, string> = {
  not_started: 'bg-status-pending/20 text-status-pending',
  data_ready: 'bg-indigo-100 text-indigo-700',
  developing: 'bg-status-progress/20 text-status-progress',
  numerical_done: 'bg-cyan-100 text-cyan-700',
  func_testing: 'bg-status-func-testing/20 text-status-func-testing',
  testing: 'bg-status-blocked/20 text-status-blocked',
  planner_review: 'bg-status-planner-review/20 text-status-planner-review',
  test_done: 'bg-status-completed/20 text-status-completed',
}

interface StatusDropdownProps {
  status: TaskStatus
  onChange: (newStatus: TaskStatus) => void
}

export function StatusDropdown({ status, onChange }: StatusDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const config = STATUS_CONFIG[status]

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-default',
          'hover:opacity-85 cursor-pointer shadow-sm',
          config.className
        )}
      >
        {STATUS_ICONS[status]}
        {config.label}
        <ChevronDown className={cn(
          'w-3 h-3 opacity-70 transition-default',
          isOpen && 'rotate-180'
        )} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 z-50 min-w-[140px] bg-card rounded-xl border border-border shadow-elevated animate-fade-in py-1.5">
          {STATUS_LIST.map((s) => {
            const c = STATUS_CONFIG[s]
            const isActive = s === status
            return (
              <button
                key={s}
                type="button"
                onClick={() => {
                  onChange(s)
                  setIsOpen(false)
                }}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-xs transition-default rounded-lg mx-0',
                  'hover:bg-surface-hover',
                  isActive && 'bg-accent font-semibold'
                )}
              >
                <span className={cn(
                  'flex items-center justify-center w-5 h-5 rounded-full',
                  STATUS_DOT_CLASSES[s]
                )}>
                  {STATUS_ICONS[s]}
                </span>
                <span className="font-medium">{c.label}</span>
                {isActive && (
                  <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-primary" />
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
