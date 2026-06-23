import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, X } from 'lucide-react'

interface ColumnFilterProps {
  label: string
  options: string[]
  selected: Set<string>
  onChange: (selected: Set<string>) => void
  colorDot?: string
}

export function ColumnFilter({ label, options, selected, onChange, colorDot }: ColumnFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const isFiltered = selected.size > 0
  const toggleOption = (opt: string) => {
    const next = new Set(selected)
    if (next.has(opt)) next.delete(opt)
    else next.add(opt)
    onChange(next)
  }

  const clearAll = () => {
    onChange(new Set())
  }

  return (
    <div ref={ref} className="relative inline-flex items-center">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap',
          isFiltered ? 'text-primary' : 'text-muted-foreground'
        )}
      >
        {colorDot && (
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colorDot }} />
        )}
        {label}
        {isFiltered && (
          <span className="bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold">
            {selected.size}
          </span>
        )}
        <ChevronDown className={cn('w-3 h-3 transition-default', isOpen && 'rotate-180')} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] max-h-[280px] bg-card rounded-lg border border-border shadow-elevated animate-fade-in flex flex-col">
          {/* Header */}
          {isFiltered && (
            <button
              type="button"
              onClick={clearAll}
              className="flex items-center gap-1 px-3 py-1.5 text-[10px] text-destructive hover:bg-surface-hover border-b border-border"
            >
              <X className="w-3 h-3" />
              清除筛选
            </button>
          )}
          {/* Options */}
          <div className="overflow-auto py-1">
            {options.map((opt) => {
              const checked = selected.has(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggleOption(opt)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-default hover:bg-surface-hover text-left',
                    checked && 'bg-accent'
                  )}
                >
                  <div className={cn(
                    'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0',
                    checked ? 'bg-primary border-primary' : 'border-input'
                  )}>
                    {checked && <span className="text-primary-foreground text-[8px] font-bold">✓</span>}
                  </div>
                  <span className="truncate">{opt || '(空)'}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}