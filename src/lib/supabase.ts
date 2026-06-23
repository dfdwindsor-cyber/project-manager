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
  roles: Record<RoleType, RoleSchedule>
  doc_link: string
  created_at: string
}

const emptyRole = (): RoleSchedule => ({ assignee: '', startDate: '', endDate: '' })

export function fromDbTask(row: DbTaskRow): Task {
  const roles = row.roles ?? {}
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    classification: row.classification,
    priority: row.priority as Task['priority'],
    status: row.status as Task['status'],
    roles: {
      planner: roles.planner ?? emptyRole(),
      ui: roles.ui ?? emptyRole(),
      numerical: roles.numerical ?? emptyRole(),
      dev: roles.dev ?? emptyRole(),
      test: roles.test ?? emptyRole(),
    },
    docLink: row.doc_link,
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
    roles: task.roles,
    doc_link: task.docLink,
  }
}
