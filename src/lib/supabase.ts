import { createClient } from '@supabase/supabase-js'
import type { Task, RoleType, RoleSchedule } from '@/lib/data'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/* ---------- DB row <-> 前端 Task 映射 ---------- */

export interface DbTaskRow {
  id: string
  name: string
  category: string
  classification: string
  priority: string
  status: string
  roles: Record<RoleType, RoleSchedule> & {
    _needsUi?: boolean
    _remark?: string
    _needsOps?: boolean
    _opsSchedule?: RoleSchedule
  }
  doc_link: string
  created_at: string
}

const emptyRole = (): RoleSchedule => ({ assignee: '', startDate: '', endDate: '' })

/**
 * 将 Task 的排期与元数据打包为写入数据库的 roles JSONB。
 * needsUi / remark / needsOps / opsSchedule 都以 `_` 前缀的元键存放在 roles 内，
 * 任何写入 roles 的地方都必须经过这里，否则会丢失其它元键。
 */
export function packRoles(task: Pick<Task, 'roles' | 'needsUi' | 'remark' | 'needsOps' | 'opsSchedule'>) {
  return {
    ...task.roles,
    _needsUi: task.needsUi ?? false,
    _remark: task.remark ?? '',
    _needsOps: task.needsOps ?? false,
    _opsSchedule: task.opsSchedule ?? emptyRole(),
  }
}

export function fromDbTask(row: DbTaskRow): Task {
  const roles = row.roles ?? {}
  const { _needsUi, _remark, _needsOps, _opsSchedule, ...roleSchedules } = roles as Record<string, unknown>
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    classification: row.classification,
    priority: row.priority as Task['priority'],
    status: row.status as Task['status'],
    roles: {
      planner: (roleSchedules.planner as RoleSchedule) ?? emptyRole(),
      ui: (roleSchedules.ui as RoleSchedule) ?? emptyRole(),
      numerical: (roleSchedules.numerical as RoleSchedule) ?? emptyRole(),
      dev: (roleSchedules.dev as RoleSchedule) ?? emptyRole(),
      test: (roleSchedules.test as RoleSchedule) ?? emptyRole(),
    },
    docLink: row.doc_link,
    needsUi: Boolean(_needsUi),
    needsOps: Boolean(_needsOps),
    opsSchedule: (_opsSchedule as RoleSchedule) ?? emptyRole(),
    remark: typeof _remark === 'string' ? _remark : '',
    created_at: row.created_at,
  }
}

export function toDbTask(task: Omit<Task, 'id'> & { id?: string }) {
  return {
    ...(task.id ? { id: task.id } : {}),
    name: task.name,
    category: task.category,
    classification: task.classification,
    priority: task.priority,
    status: task.status,
    roles: packRoles(task),
    doc_link: task.docLink,
  }
}
