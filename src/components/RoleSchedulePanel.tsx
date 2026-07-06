import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/Avatar'
import { ROLE_LIST, ROLE_MEMBERS, OPS_ROLE, calcDuration, toISODate, fromISODate, formatDateDisplay } from '@/lib/data'
import type { RoleType, RoleSchedule } from '@/lib/data'
import { Calendar, User, Clock } from 'lucide-react'

/**
 * 负责人输入框：兼容中文输入法。
 * 组字过程中（onCompositionStart~End）只更新本地显示，不向上提交，
 * 避免把拼音也写入；组字结束 / 失焦 / 直接选词时才提交最终值。
 * 用本地 state 承接输入，隔离实时订阅回声对光标与内容的干扰。
 */
function AssigneeInput({
  value,
  members,
  listId,
  onCommit,
}: {
  value: string
  members: string[]
  listId: string
  onCommit: (value: string) => void
}) {
  const [local, setLocal] = useState(value)
  const composingRef = useRef(false)

  // 外部值变化时同步到本地（组字中不打断输入法）
  useEffect(() => {
    if (!composingRef.current) setLocal(value)
  }, [value])

  const commit = (v: string) => {
    if (v !== value) onCommit(v)
  }

  return (
    <>
      <input
        type="text"
        list={listId}
        value={local}
        onChange={(e) => {
          const v = e.target.value
          setLocal(v)
          if (!composingRef.current) commit(v)
        }}
        onCompositionStart={() => { composingRef.current = true }}
        onCompositionEnd={(e) => {
          composingRef.current = false
          commit((e.target as HTMLInputElement).value)
        }}
        onBlur={() => commit(local)}
        placeholder="选择或输入负责人"
        className="flex-1 h-7 px-2 rounded border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-default"
      />
      <datalist id={listId}>
        {members.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </>
  )
}

interface RoleSchedulePanelProps {
  roles: Record<RoleType, RoleSchedule>
  onChange: (role: RoleType, schedule: RoleSchedule) => void
  needsOps?: boolean
  opsSchedule?: RoleSchedule
  onOpsChange?: (schedule: RoleSchedule) => void
}

interface ScheduleCardProps {
  label: string
  color: string
  schedule: RoleSchedule
  members: string[]
  listId: string
  showDates: boolean
  onAssignee: (value: string) => void
  onDate: (field: 'startDate' | 'endDate', isoValue: string) => void
}

function ScheduleCard({ label, color, schedule, members, listId, showDates, onAssignee, onDate }: ScheduleCardProps) {
  const dur = showDates ? calcDuration(schedule.startDate, schedule.endDate) : '-'
  const isoStart = toISODate(schedule.startDate)
  const isoEnd = toISODate(schedule.endDate)

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2.5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
        <span className="text-xs font-semibold">{label}</span>
        {showDates && dur !== '-' && (
          <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent text-accent-foreground">
            {dur}
          </span>
        )}
      </div>

      {/* Assignee */}
      <div className="space-y-1">
        <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <User className="w-2.5 h-2.5" />
          负责人
        </label>
        <div className="flex items-center gap-1.5">
          {schedule.assignee && <Avatar name={schedule.assignee} size="sm" />}
          <AssigneeInput
            value={schedule.assignee}
            members={members}
            listId={listId}
            onCommit={onAssignee}
          />
        </div>
      </div>

      {/* Date fields */}
      {showDates && (
        <>
          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Calendar className="w-2.5 h-2.5" />
              开始时间
            </label>
            <div className="relative">
              <input
                type="date"
                value={isoStart}
                onChange={(e) => onDate('startDate', e.target.value)}
                className="w-full h-7 px-2 rounded border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-default cursor-pointer appearance-none"
              />
              {schedule.startDate && (
                <span className="absolute right-7 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                  {formatDateDisplay(schedule.startDate)}
                </span>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-2.5 h-2.5" />
              结束时间
            </label>
            <div className="relative">
              <input
                type="date"
                value={isoEnd}
                onChange={(e) => onDate('endDate', e.target.value)}
                className="w-full h-7 px-2 rounded border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-default cursor-pointer appearance-none"
              />
              {schedule.endDate && (
                <span className="absolute right-7 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
                  {formatDateDisplay(schedule.endDate)}
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function RoleSchedulePanel({ roles, onChange, needsOps, opsSchedule, onOpsChange }: RoleSchedulePanelProps) {
  const showOps = Boolean(needsOps && onOpsChange && opsSchedule)

  const handleOpsAssignee = (value: string) => onOpsChange?.({ ...(opsSchedule as RoleSchedule), assignee: value })
  const handleOpsDate = (field: 'startDate' | 'endDate', isoValue: string) =>
    onOpsChange?.({ ...(opsSchedule as RoleSchedule), [field]: isoValue ? fromISODate(isoValue) : '' })

  return (
    <div className="border-t border-border bg-accent/30 px-4 py-3 animate-fade-in">
      <div className={cn('grid gap-3', showOps ? 'grid-cols-6' : 'grid-cols-5')}>
        {ROLE_LIST.map((role) => (
          <ScheduleCard
            key={role.key}
            label={role.label}
            color={role.color}
            schedule={roles[role.key]}
            members={ROLE_MEMBERS[role.key]}
            listId={`members-${role.key}`}
            showDates={role.key !== 'planner'}
            onAssignee={(value) => onChange(role.key, { ...roles[role.key], assignee: value })}
            onDate={(field, iso) => onChange(role.key, { ...roles[role.key], [field]: iso ? fromISODate(iso) : '' })}
          />
        ))}

        {showOps && (
          <ScheduleCard
            label={OPS_ROLE.label}
            color={OPS_ROLE.color}
            schedule={opsSchedule as RoleSchedule}
            members={[]}
            listId="members-ops"
            showDates
            onAssignee={handleOpsAssignee}
            onDate={handleOpsDate}
          />
        )}
      </div>
    </div>
  )
}
