export type TaskStatus = 'not_started' | 'developing' | 'func_testing' | 'testing' | 'planner_review' | 'test_done'
export type Priority = 'P0' | 'P1' | 'P2' | 'P3'
export type RoleType = 'planner' | 'ui' | 'numerical' | 'dev' | 'test'

export interface RoleSchedule {
  assignee: string
  startDate: string
  endDate: string
}

export interface Task {
  id: string
  name: string
  category: string
  classification: string
  priority: Priority
  status: TaskStatus
  roles: Record<RoleType, RoleSchedule>
  docLink: string
  needsUi?: boolean
  created_at?: string
}

export interface TabItem {
  id: string
  label: string
}

export const ROLE_LIST: { key: RoleType; label: string; color: string }[] = [
  { key: 'planner', label: '策划', color: 'var(--role-planner)' },
  { key: 'ui', label: 'UI', color: 'var(--role-ui)' },
  { key: 'numerical', label: '数值', color: 'var(--role-numerical)' },
  { key: 'dev', label: '研发', color: 'var(--role-dev)' },
  { key: 'test', label: '测试', color: 'var(--role-test)' },
]

export const PRIORITY_LIST: Priority[] = ['P0', 'P1', 'P2', 'P3']

export const PRIORITY_CONFIG: Record<Priority, { label: string; className: string }> = {
  P0: { label: 'P0', className: 'bg-destructive text-destructive-foreground' },
  P1: { label: 'P1', className: 'bg-status-blocked text-status-blocked-foreground' },
  P2: { label: 'P2', className: 'bg-status-progress text-status-progress-foreground' },
  P3: { label: 'P3', className: 'bg-status-pending text-status-pending-foreground' },
}

export const CLASSIFICATION_ORDER: string[] = [
  '章节更新',
  '链条-更新',
  '移植-商业化',
  '换皮-活动',
  '移植-活动',
  '创新活动',
  '优化',
  '其他',
]

const classificationIndex = (classification: string): number => {
  const i = CLASSIFICATION_ORDER.indexOf(classification)
  return i === -1 ? CLASSIFICATION_ORDER.length : i
}

export function compareTaskOrder(a: Task, b: Task): number {
  const ci = classificationIndex(a.classification) - classificationIndex(b.classification)
  if (ci !== 0) return ci
  // 同分类内：新建的在前 → created_at 降序
  return (b.created_at ?? '').localeCompare(a.created_at ?? '')
}

export const CLASSIFICATION_COLORS: Record<string, { bg: string; text: string }> = {
  '章节更新': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  '链条-更新': { bg: 'bg-teal-100', text: 'text-teal-700' },
  '移植-商业化': { bg: 'bg-violet-100', text: 'text-violet-700' },
  '换皮-活动': { bg: 'bg-amber-100', text: 'text-amber-700' },
  '移植-活动': { bg: 'bg-orange-100', text: 'text-orange-700' },
  '创新活动': { bg: 'bg-pink-100', text: 'text-pink-700' },
  '优化': { bg: 'bg-sky-100', text: 'text-sky-700' },
  '其他': { bg: 'bg-gray-100', text: 'text-gray-600' },
}

export const STATUS_LIST: TaskStatus[] = ['not_started', 'developing', 'func_testing', 'testing', 'planner_review', 'test_done']

export const STATUS_CONFIG: Record<TaskStatus, { label: string; className: string }> = {
  not_started: {
    label: '待开始',
    className: 'bg-status-pending text-status-pending-foreground',
  },
  developing: {
    label: '开发中',
    className: 'bg-status-progress text-status-progress-foreground',
  },
  func_testing: {
    label: '功能测试',
    className: 'bg-status-func-testing text-status-func-testing-foreground',
  },
  testing: {
    label: '测试中',
    className: 'bg-status-blocked text-status-blocked-foreground',
  },
  planner_review: {
    label: '策划验收',
    className: 'bg-status-planner-review text-status-planner-review-foreground',
  },
  test_done: {
    label: '测试结束',
    className: 'bg-status-completed text-status-completed-foreground',
  },
}

export const ASSIGNEE_COLORS: Record<string, string> = {
  '克兰': 'hsl(152, 55%, 48%)',
  '婉仪': 'hsl(212, 72%, 56%)',
  '九梨': 'hsl(25, 90%, 56%)',
  '子轩': 'hsl(280, 55%, 55%)',
  '思远': 'hsl(340, 60%, 55%)',
  '摇光': 'hsl(190, 60%, 45%)',
  '京墨': 'hsl(30, 70%, 50%)',
  '稻壳': 'hsl(100, 45%, 45%)',
  '陶侃': 'hsl(260, 50%, 55%)',
  '宋云': 'hsl(320, 55%, 50%)',
  '乌梅': 'hsl(350, 50%, 45%)',
  '剑心': 'hsl(170, 50%, 42%)',
  '沐月': 'hsl(220, 55%, 50%)',
  '飞碟': 'hsl(45, 65%, 48%)',
  '玲子': 'hsl(200, 60%, 50%)',
  '番茄': 'hsl(10, 70%, 50%)',
  '暖树': 'hsl(80, 50%, 45%)',
  '乐佩': 'hsl(290, 55%, 55%)',
  '回文': 'hsl(130, 50%, 42%)',
  '桐乐': 'hsl(15, 65%, 52%)',
  '小矛': 'hsl(240, 50%, 55%)',
  '柳二龙': 'hsl(160, 55%, 45%)',
}

/** 每个工种对应的可选人员列表 */
export const ROLE_MEMBERS: Record<RoleType, string[]> = {
  planner: ['克兰', '九梨', '婉仪', '回文', '摇光', '飞碟', '柳二龙', '沐月'],
  ui: ['乌梅', '乐佩'],
  numerical: ['剑心'],
  dev: ['陶侃', '京墨', '稻壳', '宋云'],
  test: ['番茄', '玲子', '暖树'],
}

function emptyRole(): RoleSchedule {
  return { assignee: '', startDate: '', endDate: '' }
}

export function createEmptyRoles(): Record<RoleType, RoleSchedule> {
  return { planner: emptyRole(), ui: emptyRole(), numerical: emptyRole(), dev: emptyRole(), test: emptyRole() }
}

export function calcDuration(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '-'
  const s = parseFlexDate(startDate)
  const e = parseFlexDate(endDate)
  if (!s || !e) return '-'
  const diff = e.getTime() - s.getTime()
  if (diff < 0) return '-'
  const days = Math.round(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return '当天'
  return `${days}天`
}

export function calcTotalDuration(roles: Record<RoleType, RoleSchedule>): string {
  let earliest: Date | null = null
  let latest: Date | null = null
  for (const role of Object.values(roles)) {
    if (role.startDate) {
      const d = parseFlexDate(role.startDate)
      if (d && (!earliest || d < earliest)) earliest = d
    }
    if (role.endDate) {
      const d = parseFlexDate(role.endDate)
      if (d && (!latest || d > latest)) latest = d
    }
  }
  if (!earliest || !latest) return '-'
  const diff = latest.getTime() - earliest.getTime()
  if (diff < 0) return '-'
  const days = Math.round(diff / (1000 * 60 * 60 * 24))
  if (days === 0) return '当天'
  return `${days}天`
}

function parseFlexDate(input: string): Date | null {
  const trimmed = input.trim().replace(/[./]/g, '-')
  // ISO format "2026-04-16"
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (isoMatch) {
    return new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]))
  }
  // "4-16" or "4-7" -> assume 2026
  const shortMatch = trimmed.match(/^(\d{1,2})-(\d{1,2})$/)
  if (shortMatch) {
    return new Date(2026, parseInt(shortMatch[1]) - 1, parseInt(shortMatch[2]))
  }
  // "2026-4-16"
  const fullMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (fullMatch) {
    return new Date(parseInt(fullMatch[1]), parseInt(fullMatch[2]) - 1, parseInt(fullMatch[3]))
  }
  return null
}

/** 将任意短日期格式（如 "4-16"）转为 ISO "2026-04-16" 供 date input 使用 */
export function toISODate(input: string): string {
  if (!input) return ''
  const d = parseFlexDate(input)
  if (!d) return ''
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 将 ISO "2026-04-16" 转为显示用短格式 "4-16" */
export function fromISODate(iso: string): string {
  if (!iso) return ''
  const parts = iso.split('-')
  if (parts.length !== 3) return iso
  const m = parseInt(parts[1])
  const d = parseInt(parts[2])
  return `${m}-${d}`
}

/** 将 ISO "2026-04-16" 转为显示文本 "4月16日" */
export function formatDateDisplay(input: string): string {
  if (!input) return ''
  const d = parseFlexDate(input)
  if (!d) return input
  return `${d.getMonth() + 1}月${d.getDate()}日`
}