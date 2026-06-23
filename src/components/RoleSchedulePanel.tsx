import { cn } from '@/lib/utils'
import { Avatar } from '@/components/Avatar'
import { ROLE_LIST, ROLE_MEMBERS, calcDuration, toISODate, fromISODate, formatDateDisplay } from '@/lib/data'
import type { RoleType, RoleSchedule } from '@/lib/data'
import { Calendar, User, Clock } from 'lucide-react'

interface RoleSchedulePanelProps {
  roles: Record<RoleType, RoleSchedule>
  onChange: (role: RoleType, schedule: RoleSchedule) => void
}

export function RoleSchedulePanel({ roles, onChange }: RoleSchedulePanelProps) {
  const handleAssignee = (roleKey: RoleType, value: string) => {
    onChange(roleKey, { ...roles[roleKey], assignee: value })
  }

  const handleDate = (roleKey: RoleType, field: 'startDate' | 'endDate', isoValue: string) => {
    onChange(roleKey, { ...roles[roleKey], [field]: isoValue ? fromISODate(isoValue) : '' })
  }

  const showDates = (roleKey: RoleType) => roleKey !== 'planner'

  return (
    <div className="border-t border-border bg-accent/30 px-4 py-3 animate-fade-in">
      <div className="grid grid-cols-5 gap-3">
        {ROLE_LIST.map((role) => {
          const schedule = roles[role.key]
          const dur = showDates(role.key) ? calcDuration(schedule.startDate, schedule.endDate) : '-'
          const isoStart = toISODate(schedule.startDate)
          const isoEnd = toISODate(schedule.endDate)

          return (
            <div
              key={role.key}
              className="rounded-lg border border-border bg-card p-3 space-y-2.5"
            >
              {/* Role header */}
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: role.color }}
                />
                <span className="text-xs font-semibold">{role.label}</span>
                {showDates(role.key) && dur !== '-' && (
                  <span className={cn(
                    'ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded',
                    'bg-accent text-accent-foreground'
                  )}>
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
                  <input
                    type="text"
                    list={`members-${role.key}`}
                    value={schedule.assignee}
                    onChange={(e) => handleAssignee(role.key, e.target.value)}
                    placeholder="选择或输入负责人"
                    className="flex-1 h-7 px-2 rounded border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-default"
                  />
                  <datalist id={`members-${role.key}`}>
                    {ROLE_MEMBERS[role.key].map((name) => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Date fields - hidden for planner */}
              {showDates(role.key) && (
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
                        onChange={(e) => handleDate(role.key, 'startDate', e.target.value)}
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
                        onChange={(e) => handleDate(role.key, 'endDate', e.target.value)}
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
        })}
      </div>
    </div>
  )
}
