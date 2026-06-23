import { useState, useEffect, useCallback } from 'react'
import { supabase, fromDbTask, toDbTask } from '@/lib/supabase'
import type { DbTaskRow } from '@/lib/supabase'
import { toast } from '@/components/Toast'
import { STATUS_CONFIG } from '@/lib/data'
import type { Task, TaskStatus, RoleType, RoleSchedule } from '@/lib/data'

export function useTasks(activeTab: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // 加载当前 tab 的任务
  useEffect(() => {
    if (!activeTab) {
      setTasks([])
      setIsLoading(false)
      return
    }

    let cancelled = false
    setIsLoading(true)

    const fetchTasks = async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('category', activeTab)
        .order('created_at', { ascending: true })
      if (!cancelled) {
        if (error) {
          console.error('Failed to fetch tasks:', error)
          toast('加载任务失败', 'error')
        } else {
          setTasks((data ?? []).map((row) => fromDbTask(row as DbTaskRow)))
        }
        setIsLoading(false)
      }
    }
    fetchTasks()

    return () => { cancelled = true }
  }, [activeTab])

  // Realtime 订阅（按 activeTab 过滤）
  useEffect(() => {
    if (!activeTab) return

    const channel = supabase
      .channel(`tasks-${activeTab}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `category=eq.${activeTab}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const task = fromDbTask(payload.new as DbTaskRow)
            setTasks((prev) => {
              if (prev.some((t) => t.id === task.id)) return prev
              return [...prev, task]
            })
          } else if (payload.eventType === 'UPDATE') {
            const task = fromDbTask(payload.new as DbTaskRow)
            setTasks((prev) =>
              prev.map((t) => (t.id === task.id ? task : t))
            )
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string }
            setTasks((prev) => prev.filter((t) => t.id !== old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeTab])

  const addTask = useCallback(async (taskData: Omit<Task, 'id'>) => {
    const id = Date.now().toString()
    const newTask: Task = { ...taskData, id }
    // 乐观更新
    setTasks((prev) => [newTask, ...prev])
    const { error } = await supabase.from('tasks').insert(toDbTask(newTask))
    if (error) {
      console.error('Failed to add task:', error)
      setTasks((prev) => prev.filter((t) => t.id !== id))
      toast('创建任务失败', 'error')
    } else {
      toast('任务创建成功')
    }
  }, [])

  const updateStatus = useCallback(async (taskId: string, newStatus: TaskStatus) => {
    // 乐观更新
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    )
    const { error } = await supabase
      .from('tasks')
      .update({ status: newStatus })
      .eq('id', taskId)
    if (error) {
      console.error('Failed to update status:', error)
      toast('更新状态失败', 'error')
    } else {
      toast(`状态已更新为「${STATUS_CONFIG[newStatus].label}」`)
    }
  }, [])

  const updateRole = useCallback(async (taskId: string, roleType: RoleType, schedule: RoleSchedule) => {
    setTasks((prev) => {
      return prev.map((t) => {
        if (t.id !== taskId) return t
        const newRoles = { ...t.roles, [roleType]: schedule }
        // 异步更新数据库
        supabase
          .from('tasks')
          .update({ roles: newRoles })
          .eq('id', taskId)
          .then(({ error }) => {
            if (error) console.error('Failed to update role:', error)
          })
        return { ...t, roles: newRoles }
      })
    })
  }, [])

  const updateTask = useCallback(async (taskId: string, updates: Partial<Pick<Task, 'name' | 'priority' | 'classification' | 'status' | 'docLink'>>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...updates } : t))
    )
    const dbUpdates: Record<string, unknown> = {}
    if (updates.name !== undefined) dbUpdates.name = updates.name
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority
    if (updates.classification !== undefined) dbUpdates.classification = updates.classification
    if (updates.status !== undefined) dbUpdates.status = updates.status
    if (updates.docLink !== undefined) dbUpdates.doc_link = updates.docLink

    const { error } = await supabase
      .from('tasks')
      .update(dbUpdates)
      .eq('id', taskId)
    if (error) {
      console.error('Failed to update task:', error)
      toast('更新任务失败', 'error')
    } else {
      toast('任务已更新')
    }
  }, [])

  const deleteTask = useCallback(async (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId))
    const { error } = await supabase.from('tasks').delete().eq('id', taskId)
    if (error) {
      console.error('Failed to delete task:', error)
      toast('删除任务失败', 'error')
    } else {
      toast('任务已删除')
    }
  }, [])

  return { tasks, addTask, updateStatus, updateRole, updateTask, deleteTask, isLoading }
}
