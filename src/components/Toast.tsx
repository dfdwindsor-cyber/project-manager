import { useState } from 'react'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

let addToastFn: ((message: string, type?: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = 'success') {
  addToastFn?.(message, type)
}

const TOAST_ICONS: Record<ToastType, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
}

const TOAST_STYLES: Record<ToastType, string> = {
  success: 'border-status-completed/30 bg-card',
  error: 'border-destructive/30 bg-card',
  info: 'border-status-progress/30 bg-card',
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  addToastFn = (message: string, type: ToastType = 'success') => {
    const id = Date.now().toString()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }

  const remove = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => {
        const Icon = TOAST_ICONS[t.type]
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-center gap-2.5 px-4 py-3 rounded-lg border shadow-elevated animate-slide-in min-w-[240px] max-w-[360px]',
              TOAST_STYLES[t.type]
            )}
          >
            <Icon className={cn(
              'w-4 h-4 shrink-0',
              t.type === 'success' && 'text-status-completed',
              t.type === 'error' && 'text-destructive',
              t.type === 'info' && 'text-status-progress',
            )} />
            <span className="text-sm flex-1">{t.message}</span>
            <button
              type="button"
              onClick={() => remove(t.id)}
              className="text-muted-foreground hover:text-foreground transition-default p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}