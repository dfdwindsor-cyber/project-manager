import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { Avatar } from '@/components/Avatar'
import { QA_TESTERS, QA_ITEMS, qaRowId, formatResetTime, type QaRow, type QaTester } from '@/lib/qa'
import { X, ClipboardCheck } from 'lucide-react'

interface QaChecklistModalProps {
  isOpen: boolean
  onClose: () => void
  rows: QaRow[]
  onToggle: (tester: QaTester, itemIdx: number, done: boolean) => void
  lastResetAt: string | null
  isLoading: boolean
}

export function QaChecklistModal({ isOpen, onClose, rows, onToggle, lastResetAt, isLoading }: QaChecklistModalProps) {
  const { currentUser } = useAuth()
  if (!isOpen) return null

  const byId = new Map(rows.map((r) => [r.id, r]))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative bg-card rounded-lg shadow-modal w-full max-w-2xl mx-4 animate-scale-in max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-5 pb-3 border-b border-border">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-base font-semibold">测试专用 · 每日巡检</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {lastResetAt ? `上次重置：${formatResetTime(lastResetAt)}` : '尚未记录重置时间'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-default"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">加载中…</div>
          ) : (
            <div className="p-3">
              {/* Column header */}
              <div className="grid grid-cols-[110px_1fr_80px] gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground sticky top-0 bg-card z-10 border-b border-border">
                <span>测试负责人</span>
                <span>每日检查事项</span>
                <span className="text-center">是否完成</span>
              </div>

              {QA_TESTERS.map((tester) => {
                const canToggle = currentUser === tester
                return (
                  <div key={tester} className="mt-2">
                    {QA_ITEMS.map((item, idx) => {
                      const row = byId.get(qaRowId(tester, idx))
                      const done = row?.done ?? false
                      const showAvatar = idx === 0
                      return (
                        <div
                          key={`${tester}-${idx}`}
                          className={cn(
                            'grid grid-cols-[110px_1fr_80px] gap-2 items-start px-3 py-2.5 rounded transition-default',
                            done ? 'bg-emerald-50/60' : 'hover:bg-surface-hover',
                            idx === 0 ? 'pt-3 border-t border-border' : ''
                          )}
                        >
                          {/* Tester */}
                          <div className="flex items-center gap-1.5 min-w-0 pt-0.5">
                            {showAvatar ? (
                              <>
                                <Avatar name={tester} size="sm" />
                                <span className="text-xs font-medium truncate">{tester}</span>
                              </>
                            ) : (
                              <span className="text-xs text-muted-foreground/60 pl-7">·</span>
                            )}
                          </div>
                          {/* Item：粗体标题 + 灰色细则 */}
                          <div className="text-xs leading-snug">
                            <div>
                              <span className="text-muted-foreground mr-1">{idx + 1}.</span>
                              <span className={cn('font-medium', done && 'text-muted-foreground line-through')}>
                                {item.title}
                              </span>
                            </div>
                            <div className={cn('text-[11px] text-muted-foreground pl-4 mt-0.5', done && 'line-through')}>
                              {item.detail}
                            </div>
                          </div>
                          {/* Checkbox */}
                          <div className="flex justify-center pt-0.5">
                            <label
                              className={cn(
                                'inline-flex items-center gap-1.5',
                                canToggle ? 'cursor-pointer' : 'cursor-not-allowed'
                              )}
                              title={canToggle ? undefined : `仅 ${tester} 可勾选`}
                            >
                              <input
                                type="checkbox"
                                checked={done}
                                disabled={!canToggle}
                                onChange={(e) => onToggle(tester, idx, e.target.checked)}
                                className="w-4 h-4 accent-emerald-500 cursor-[inherit] disabled:opacity-40"
                              />
                              <span
                                className={cn(
                                  'text-[11px] font-medium',
                                  done ? 'text-emerald-600' : 'text-muted-foreground'
                                )}
                              >
                                {done ? '已完成' : '未完成'}
                              </span>
                            </label>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-accent/20 text-[11px] text-muted-foreground leading-relaxed">
          每天上午 10:00 自动重置状态；只要还有未完成项，右上角入口会显示红点提醒。
          {currentUser && !QA_TESTERS.includes(currentUser as QaTester) && (
            <span className="block mt-1 text-amber-600">当前身份「{currentUser}」不在测试组，无法勾选。</span>
          )}
          {!currentUser && (
            <span className="block mt-1 text-amber-600">未设置「我是」，无法勾选，请先在右上角选择自己的身份。</span>
          )}
        </div>
      </div>
    </div>
  )
}
