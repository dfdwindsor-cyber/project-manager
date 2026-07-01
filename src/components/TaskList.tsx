import { useState, useMemo, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { StatusDropdown } from '@/components/StatusDropdown'
import { RoleSchedulePanel } from '@/components/RoleSchedulePanel'
import { ColumnFilter } from '@/components/ColumnFilter'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Avatar } from '@/components/Avatar'
import { useAuth } from '@/lib/auth'
import { PRIORITY_CONFIG, ROLE_LIST, STATUS_CONFIG, CLASSIFICATION_COLORS, formatDateDisplay, calcTotalDuration } from '@/lib/data'
import type { Task, TaskStatus, RoleType, RoleSchedule } from '@/lib/data'
import { ChevronRight, Plus, Trash2, ExternalLink, MessageSquare } from 'lucide-react'

interface TaskListProps {
  tasks: Task[]
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onRoleChange: (taskId: string, role: RoleType, schedule: RoleSchedule) => void
  onRemarkChange?: (taskId: string, remark: string) => void
  onDelete?: (taskId: string) => void
  onEditTask?: (task: Task) => void
}

interface Filters {
  name: Set<string>
  classification: Set<string>
  priority: Set<string>
  status: Set<string>
  planner: Set<string>
  ui: Set<string>
  numerical: Set<string>
  dev: Set<string>
  test: Set<string>
}

function RoleCell({ schedule, color }: { schedule: RoleSchedule; color: string }) {
  const hasData = schedule.assignee || schedule.startDate || schedule.endDate
  if (!hasData) return <span className="text-muted-foreground">-</span>
  const start = formatDateDisplay(schedule.startDate)
  const end = formatDateDisplay(schedule.endDate)
  return (
    <div className="flex flex-col gap-0.5">
      {schedule.assignee && (
        <div className="flex items-center gap-1">
          <Avatar name={schedule.assignee} size="sm" />
          <span className="text-xs truncate">{schedule.assignee}</span>
        </div>
      )}
      {(start || end) && (
        <span className="text-[10px] leading-tight" style={{ color }}>
          {start || '?'} ~ {end || '?'}
        </span>
      )}
    </div>
  )
}

function RemarkField({ taskId, value, onChange }: { taskId: string; value: string; onChange: (taskId: string, remark: string) => void }) {
  const [local, setLocal] = useState(value)
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const v = e.target.value
    setLocal(v)
    if (timer) clearTimeout(timer)
    const t = setTimeout(() => {
      onChange(taskId, v)
    }, 600)
    setTimer(t)
  }

  useEffect(() => () => { if (timer) clearTimeout(timer) }, [timer])

  return (
    <div className="px-3 pb-2 pt-1 border-t border-border/50 bg-accent/20">
      <div className="flex items-start gap-1.5">
        <MessageSquare className="w-3 h-3 text-muted-foreground mt-1 shrink-0" />
        <textarea
          value={local}
          onChange={handleChange}
          placeholder="添加备注..."
          rows={1}
          className="flex-1 px-2 py-1 rounded border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-default resize-y min-h-[24px]"
        />
      </div>
    </div>
  )
}

export function TaskList({ tasks, onStatusChange, onRoleChange, onRemarkChange, onDelete, onEditTask }: TaskListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const { isAdmin } = useAuth()
  const [filters, setFilters] = useState<Filters>({
    name: new Set(),
    classification: new Set(),
    priority: new Set(),
    status: new Set(),
    planner: new Set(),
    ui: new Set(),
    numerical: new Set(),
    dev: new Set(),
    test: new Set(),
  })

  // Collect unique values for each filterable column
  const filterOptions = useMemo(() => {
    const roleAssignees = (key: RoleType) => {
      const names = tasks.map((t) => t.roles[key].assignee).filter(Boolean)
      return [...new Set(names)].sort()
    }
    return {
      name: [...new Set(tasks.map((t) => t.name))],
      classification: [...new Set(tasks.map((t) => t.classification))].sort(),
      priority: [...new Set(tasks.map((t) => t.priority))].sort(),
      status: [...new Set(tasks.map((t) => STATUS_CONFIG[t.status].label))].sort(),
      planner: roleAssignees('planner'),
      ui: roleAssignees('ui'),
      numerical: roleAssignees('numerical'),
      dev: roleAssignees('dev'),
      test: roleAssignees('test'),
    }
  }, [tasks])

  // Apply filters
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filters.name.size > 0 && !filters.name.has(t.name)) return false
      if (filters.classification.size > 0 && !filters.classification.has(t.classification)) return false
      if (filters.priority.size > 0 && !filters.priority.has(t.priority)) return false
      if (filters.status.size > 0 && !filters.status.has(STATUS_CONFIG[t.status].label)) return false
      if (filters.planner.size > 0 && !filters.planner.has(t.roles.planner.assignee)) return false
      if (filters.ui.size > 0 && !filters.ui.has(t.roles.ui.assignee)) return false
      if (filters.numerical.size > 0 && !filters.numerical.has(t.roles.numerical.assignee)) return false
      if (filters.dev.size > 0 && !filters.dev.has(t.roles.dev.assignee)) return false
      if (filters.test.size > 0 && !filters.test.has(t.roles.test.assignee)) return false
      return true
    })
  }, [tasks, filters])

  const updateFilter = (key: keyof Filters, selected: Set<string>) => {
    setFilters((prev) => ({ ...prev, [key]: selected }))
  }

  const toggle = (id: string) => setExpandedId((prev) => (prev === id ? null : id))

  const gridCols = 'grid-cols-[minmax(180px,2fr)_60px_80px_110px_repeat(5,minmax(100px,1fr))_60px_minmax(80px,1fr)_60px]'

  return (
    <div className="flex-1 overflow-auto">
      {/* Table header */}
      <div className={cn('sticky top-0 z-20 grid gap-1 px-3 py-2 bg-surface border-b border-border items-center', gridCols)}>
        <ColumnFilter label="任务名称" options={filterOptions.name} selected={filters.name} onChange={(s) => updateFilter('name', s)} />
        <ColumnFilter label="优先级" options={filterOptions.priority} selected={filters.priority} onChange={(s) => updateFilter('priority', s)} />
        <ColumnFilter label="状态" options={filterOptions.status} selected={filters.status} onChange={(s) => updateFilter('status', s)} />
        <ColumnFilter label="分类" options={filterOptions.classification} selected={filters.classification} onChange={(s) => updateFilter('classification', s)} />
        {ROLE_LIST.map((r) => (
          <ColumnFilter
            key={r.key}
            label={r.label}
            options={filterOptions[r.key]}
            selected={filters[r.key]}
            onChange={(s) => updateFilter(r.key, s)}
            colorDot={r.color}
          />
        ))}
        <span className="text-xs font-medium text-muted-foreground">总工期</span>
        <span className="text-xs font-medium text-muted-foreground">文档</span>
        <span className="text-xs font-medium text-muted-foreground">操作</span>
      </div>

      {/* Task rows */}
      <div className="divide-y divide-border">
        {filteredTasks.map((task, index) => {
          const isExpanded = expandedId === task.id
          const pConfig = PRIORITY_CONFIG[task.priority]
          const totalDur = calcTotalDuration(task.roles)

          return (
            <div key={task.id} className="animate-fade-in" style={{ animationDelay: `${index * 12}ms` }}>
              {/* Main row */}
              <div
                className={cn(
                  'grid gap-1 px-3 py-2.5 items-center',
                  gridCols,
                  'hover:bg-surface-hover transition-default group',
                  isExpanded && 'bg-surface-hover'
                )}
              >
                {/* Task name */}
                <div
                  className="flex items-center gap-1.5 min-w-0 cursor-pointer"
                  onClick={() => toggle(task.id)}
                  onDoubleClick={(e) => { e.stopPropagation(); onEditTask?.(task) }}
                >
                  <ChevronRight className={cn(
                    'w-3 h-3 text-muted-foreground shrink-0 transition-default',
                    isExpanded && 'rotate-90'
                  )} />
                  <span className={cn(
                    'text-sm truncate font-medium',
                    task.needsUi && 'text-emerald-600'
                  )}>{task.name}</span>
                </div>

                {/* Priority */}
                <span className={cn(
                  'inline-flex items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-semibold w-fit',
                  pConfig.className
                )}>
                  {pConfig.label}
                </span>

                {/* Status */}
                <div onClick={(e) => e.stopPropagation()}>
                  <StatusDropdown
                    status={task.status}
                    onChange={(s) => onStatusChange(task.id, s)}
                  />
                </div>

                {/* Classification */}
                <span className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium truncate w-fit',
                  CLASSIFICATION_COLORS[task.classification]?.bg ?? 'bg-gray-100',
                  CLASSIFICATION_COLORS[task.classification]?.text ?? 'text-gray-600',
                )}>
                  {task.classification}
                </span>

                {/* 4 Role columns */}
                {ROLE_LIST.map((r) => (
                  <div key={r.key} className="min-w-0">
                    <RoleCell schedule={task.roles[r.key]} color={r.color} />
                  </div>
                ))}

                {/* Total duration */}
                <span className={cn(
                  'text-xs font-medium',
                  totalDur === '-' ? 'text-muted-foreground' : 'text-foreground'
                )}>
                  {totalDur}
                </span>

                {/* Doc link */}
                <div className="min-w-0">
                  {task.docLink ? (
                    /^https?:\/\//.test(task.docLink) ? (
                      <a
                        href={task.docLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-0.5 text-primary hover:text-primary/80 transition-default"
                        title={task.docLink}
                      >
                        <ExternalLink className="w-3 h-3 shrink-0" />
                        <span className="text-[10px] truncate">链接</span>
                      </a>
                    ) : (
                      <span className="text-[10px] text-muted-foreground truncate block" title={task.docLink}>
                        {task.docLink}
                      </span>
                    )
                  ) : (
                    <span className="text-muted-foreground text-xs">-</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggle(task.id)}
                    className="text-[10px] text-primary hover:underline"
                  >
                    {isExpanded ? '收起' : '编辑'}
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget({ id: task.id, name: task.name }) }}
                      className="p-1 text-muted-foreground hover:text-destructive transition-default rounded hover:bg-destructive/10"
                      title="删除"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {/* 备注行（始终可见） */}
              {onRemarkChange && (
                <RemarkField
                  key={task.id}
                  taskId={task.id}
                  value={task.remark ?? ''}
                  onChange={onRemarkChange}
                />
              )}

              {/* Expanded edit panel */}
              {isExpanded && (
                <RoleSchedulePanel
                  roles={task.roles}
                  onChange={(role, schedule) => onRoleChange(task.id, role, schedule)}
                />
              )}
            </div>
          )
        })}
      </div>

      {/* Empty state */}
      {filteredTasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center mb-4">
            <Plus className="w-8 h-8" />
          </div>
          <p className="text-sm">
            {tasks.length === 0 ? '暂无任务，点击「新建任务」添加' : '没有匹配筛选条件的任务'}
          </p>
        </div>
      )}

      {/* Footer count */}
      {tasks.length > 0 && (
        <div className="sticky bottom-0 bg-surface border-t border-border px-4 py-2 text-xs text-muted-foreground">
          共 {tasks.length} 条任务
          {filteredTasks.length !== tasks.length && `，筛选显示 ${filteredTasks.length} 条`}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="确认删除"
        message={`确定要删除任务「${deleteTarget?.name ?? ''}」吗？此操作不可撤销。`}
        onConfirm={() => {
          if (deleteTarget && onDelete) {
            onDelete(deleteTarget.id)
          }
          setDeleteTarget(null)
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}