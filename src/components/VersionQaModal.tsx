import { useState, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import { Avatar } from '@/components/Avatar'
import {
  QA_VERSIONS,
  QA_VERSION_ITEMS,
  QA_VERSION_ITEMS_BEFORE,
  QA_VERSION_ITEMS_AFTER,
  QA_VERSION_AFTER_OFFSET,
  QA_VERSION_PHASE_LABEL,
  QA_VERSION_PHASE_COLOR,
  VERSION_TESTER,
  QA_VERSION_SUPERTESTERS,
  canOperateVersion,
  qaVersionRowId,
  type QaVersion,
  type QaVersionItem,
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
  const canToggle = canOperateVersion(currentUser, version)
  const isSuperTester = !!currentUser && QA_VERSION_SUPERTESTERS.includes(currentUser)

  const versionRows = useMemo(() => rows.filter((r) => r.version === version), [rows, version])
  const doneCount = versionRows.filter((r) => r.done).length
  const total = QA_VERSION_ITEMS.length
  const allDone = doneCount === total && versionRows.length === total

  // 分段进度：上线前 / 上线后
  const beforeDone = versionRows.filter((r) => r.item_idx < QA_VERSION_AFTER_OFFSET && r.done).length
  const afterDone = versionRows.filter((r) => r.item_idx >= QA_VERSION_AFTER_OFFSET && r.done).length
  const beforeTotal = QA_VERSION_ITEMS_BEFORE.length
  const afterTotal = QA_VERSION_ITEMS_AFTER.length

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
                'inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium',
                allDone
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              )}
              title={`上线前 ${beforeDone}/${beforeTotal} · 上线后 ${afterDone}/${afterTotal}`}
            >
              {doneCount}/{total} {allDone ? '已完成' : '进行中'}
              <span className="text-muted-foreground/80 font-normal ml-1">
                （前 {beforeDone}/{beforeTotal} · 后 {afterDone}/{afterTotal}）
              </span>
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
                title={canToggle ? '重置本版本所有巡检项为未完成' : `仅 ${tester} / 飞碟 / 番茄 可重置`}
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

              <PhaseSection
                title={QA_VERSION_PHASE_LABEL.before}
                color={QA_VERSION_PHASE_COLOR.before}
                done={beforeDone}
                total={beforeTotal}
                items={QA_VERSION_ITEMS_BEFORE}
                startFlatIdx={0}
                version={version}
                byId={byId}
                canToggle={canToggle}
                tester={tester}
                onToggle={onToggle}
              />

              <PhaseSection
                title={QA_VERSION_PHASE_LABEL.after}
                color={QA_VERSION_PHASE_COLOR.after}
                done={afterDone}
                total={afterTotal}
                items={QA_VERSION_ITEMS_AFTER}
                startFlatIdx={QA_VERSION_AFTER_OFFSET}
                version={version}
                byId={byId}
                canToggle={canToggle}
                tester={tester}
                onToggle={onToggle}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-accent/20 text-[11px] text-muted-foreground leading-relaxed">
          版本负责人：pets → 暖树，taylor → 番茄，合合 → 玲子。
          飞碟 与 番茄 拥有全版本勾选与重置权限。
          {isSuperTester && currentUser !== tester && (
            <span className="block mt-1 text-primary/80">
              你（{currentUser}）以超级测试身份对 {version} 操作，请谨慎。
            </span>
          )}
          {!canToggle && currentUser && (
            <span className="block mt-1 text-amber-600">
              当前身份「{currentUser}」不是 {version} 的负责人（应为 {tester}），也不在飞碟/番茄权限内，无法操作。
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

interface PhaseSectionProps {
  title: string
  color: string
  done: number
  total: number
  items: readonly QaVersionItem[]
  /** 该段第一项在 QA_VERSION_ITEMS 中的 flat index（= 该段的 DB item_idx 起点） */
  startFlatIdx: number
  version: QaVersion
  byId: Map<string, QaVersionRow>
  canToggle: boolean
  tester: string
  onToggle: (version: QaVersion, itemIdx: number, done: boolean) => void
}

function PhaseSection({ title, color, done, total, items, startFlatIdx, version, byId, canToggle, tester, onToggle }: PhaseSectionProps) {
  const allDone = done === total
  return (
    <>
      {/* 段头：色条 + 标题 + 进度 */}
      <div className="flex items-center gap-2 mt-4 mb-1 px-3 py-1.5 rounded-md" style={{ backgroundColor: `${color}12` }}>
        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold" style={{ color }}>
          {title}
        </span>
        <span
          className={cn(
            'ml-auto inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium',
            allDone ? 'bg-emerald-100 text-emerald-700' : 'bg-white/70 text-muted-foreground'
          )}
        >
          {done}/{total}
        </span>
      </div>

      {items.map((item, localIdx) => {
        const flatIdx = startFlatIdx + localIdx
        const row = byId.get(qaVersionRowId(version, flatIdx))
        const done = row?.done ?? false
        return (
          <div
            key={`${version}-${flatIdx}`}
            className={cn(
              'grid grid-cols-[1fr_80px] gap-2 items-start px-3 py-2.5 rounded transition-default',
              done ? 'bg-emerald-50/60' : 'hover:bg-surface-hover'
            )}
          >
            <div className="text-xs leading-snug">
              <div>
                <span className="text-muted-foreground mr-1">{localIdx + 1}.</span>
                <span className={cn('font-medium', done && 'text-muted-foreground line-through')}>
                  {item.title}
                </span>
              </div>
              {item.detail && (
                <div className={cn('text-[11px] text-muted-foreground pl-4 mt-0.5', done && 'line-through')}>
                  {item.detail}
                </div>
              )}
              <div className={cn('text-[11px] pl-4 mt-0.5', done && 'line-through')}>
                {item.method.split('\n').map((line, i) => (
                  <div key={i} className="flex gap-1">
                    <span className="text-emerald-600 font-medium shrink-0">测试方法：</span>
                    <span className="text-muted-foreground">{line}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center pt-0.5">
              <label
                className={cn(
                  'inline-flex items-center gap-1.5',
                  canToggle ? 'cursor-pointer' : 'cursor-not-allowed'
                )}
                title={canToggle ? undefined : `仅 ${tester} / 飞碟 / 番茄 可勾选`}
              >
                <input
                  type="checkbox"
                  checked={done}
                  disabled={!canToggle}
                  onChange={(e) => onToggle(version, flatIdx, e.target.checked)}
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
    </>
  )
}
