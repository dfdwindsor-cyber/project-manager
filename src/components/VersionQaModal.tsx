import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { Avatar } from '@/components/Avatar'
import {
  QA_VERSIONS,
  QA_VERSION_ITEMS,
  VERSION_TESTER,
  qaVersionRowId,
  type QaVersion,
  type QaVersionRow,
} from '@/lib/qa'
import { X, PackageCheck, RotateCcw } from 'lucide-react'

interface VersionQaModalProps {
  isOpen: boolean
  onClose: () => void
  rows: QaVersionRow[]
  onToggle: (version: QaVersion, itemIdx: number, done: boolean) => void
  onReset: (version: QaVersion) => void
  isLoading: boolean
}

export function VersionQaModal({ isOpen, onClose, rows, onToggle, onReset, isLoading }: VersionQaModalProps) {
  const { currentUser } = useAuth()
  const [version, setVersion] = useState<QaVersion>(QA_VERSIONS[0])
  const [confirmReset, setConfirmReset] = useState(false)

  const byId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows])

  const tester = VERSION_TESTER[version]
  const canToggle = currentUser === tester

  const versionRows = useMemo(() => rows.filter((r) => r.version === version), [rows, version])
  const doneCount = versionRows.filter((r) => r.done).length
  const total = QA_VERSION_ITEMS.length
  const allDone = doneCount === total && versionRows.length === total

  if (!isOpen) return null

  const handleReset = () => {
    onReset(version)
    setConfirmReset(false)
  }

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
            <PackageCheck className="w-5 h-5 text-primary" />
            <div>
              <h3 className="text-base font-semibold">版本巡检</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                发版前按版本走一遍固定巡检；不会自动重置，需要手动重置。
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

        {/* Toolbar：版本选择 + 负责人 + 重置 */}
        <div className="px-5 py-3 flex flex-wrap items-center gap-3 border-b border-border bg-accent/20">
          <label className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">版本</span>
            <select
              value={version}
              onChange={(e) => {
                setVersion(e.target.value as QaVersion)
                setConfirmReset(false)
              }}
              className="h-8 px-2 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-default cursor-pointer"
            >
              {QA_VERSIONS.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">负责人</span>
            <div className="flex items-center gap-1">
              <Avatar name={tester} size="sm" />
              <span className="font-medium">{tester}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs ml-auto">
            <span
              className={cn(
                'inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium',
                allDone
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              )}
            >
              {doneCount}/{total} {allDone ? '已完成' : '进行中'}
            </span>
            {confirmReset ? (
              <>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[11px] px-2 py-1 rounded bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-default"
                >
                  确认重置
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmReset(false)}
                  className="text-[11px] px-2 py-1 rounded border border-input hover:bg-accent transition-default"
                >
                  取消
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmReset(true)}
                disabled={!canToggle}
                title={canToggle ? '重置本版本所有巡检项为未完成' : `仅 ${tester} 可重置`}
                className={cn(
                  'flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-input transition-default',
                  canToggle ? 'hover:bg-accent' : 'opacity-50 cursor-not-allowed'
                )}
              >
                <RotateCcw className="w-3 h-3" />
                重置
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-10 text-center text-sm text-muted-foreground">加载中…</div>
          ) : (
            <div className="p-3">
              <div className="grid grid-cols-[1fr_80px] gap-2 px-3 py-2 text-[11px] font-medium text-muted-foreground sticky top-0 bg-card z-10 border-b border-border">
                <span>检查事项</span>
                <span className="text-center">是否完成</span>
              </div>

              {QA_VERSION_ITEMS.map((item, idx) => {
                const row = byId.get(qaVersionRowId(version, idx))
                const done = row?.done ?? false
                return (
                  <div
                    key={`${version}-${idx}`}
                    className={cn(
                      'grid grid-cols-[1fr_80px] gap-2 items-start px-3 py-2.5 rounded transition-default',
                      done ? 'bg-emerald-50/60' : 'hover:bg-surface-hover',
                      idx === 0 ? 'pt-3 border-t border-border' : ''
                    )}
                  >
                    {/* Item：粗体标题 + 灰色细则 + 测试方法（可能多行） */}
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
                      <div className={cn('text-[11px] pl-4 mt-0.5', done && 'line-through')}>
                        {item.method.split('\n').map((line, i) => (
                          <div key={i} className="flex gap-1">
                            <span className="text-emerald-600 font-medium shrink-0">测试方法：</span>
                            <span className="text-muted-foreground">{line}</span>
                          </div>
                        ))}
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
                          onChange={(e) => onToggle(version, idx, e.target.checked)}
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
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-accent/20 text-[11px] text-muted-foreground leading-relaxed">
          仅版本对应的测试负责人可勾选与重置：pets → 暖树，taylor → 番茄，合合 → 玲子。
          {!canToggle && currentUser && (
            <span className="block mt-1 text-amber-600">
              当前身份「{currentUser}」不是 {version} 的负责人（应为 {tester}），无法操作。
            </span>
          )}
          {!currentUser && (
            <span className="block mt-1 text-amber-600">未设置「我是」，无法操作，请先在右上角选择自己的身份。</span>
          )}
        </div>
      </div>
    </div>
  )
}
