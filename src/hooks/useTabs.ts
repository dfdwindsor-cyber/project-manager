import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/Toast'
import type { TabItem } from '@/lib/data'

export interface TabData extends TabItem {
  archived: boolean
}

interface DbTab {
  id: string
  label: string
  sort_order: number
}

function fromDb(row: DbTab): TabData {
  return { id: row.id, label: row.label, archived: row.sort_order === -1 }
}

export function useTabs() {
  const [tabs, setTabs] = useState<TabData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTabs = async () => {
      const { data, error } = await supabase
        .from('tabs')
        .select('id, label, sort_order')
        .order('sort_order', { ascending: true })
      if (error) {
        console.error('Failed to fetch tabs:', error)
        toast('加载版本失败', 'error')
      } else {
        setTabs((data ?? []).map(fromDb))
      }
      setIsLoading(false)
    }
    fetchTabs()
  }, [])

  useEffect(() => {
    const channel = supabase
      .channel('tabs-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'tabs' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as DbTab
            setTabs((prev) => {
              if (prev.some((t) => t.id === row.id)) return prev
              return [fromDb(row), ...prev]
            })
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string }
            setTabs((prev) => prev.filter((t) => t.id !== old.id))
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as DbTab
            setTabs((prev) =>
              prev.map((t) => (t.id === row.id ? fromDb(row) : t))
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const addTab = useCallback(async (label: string) => {
    const id = `tab_${Date.now()}`
    setTabs((prev) => [{ id, label, archived: false }, ...prev])
    const { error } = await supabase
      .from('tabs')
      .insert({ id, label, sort_order: 0 })
    if (error) {
      console.error('Failed to add tab:', error)
      setTabs((prev) => prev.filter((t) => t.id !== id))
      toast('创建版本失败', 'error')
    } else {
      toast(`版本「${label}」已创建`)
    }
    return id
  }, [])

  const archiveTab = useCallback(async (tabId: string) => {
    setTabs((prev) => {
      const active = prev.filter(t => !t.archived)
      if (active.length <= 1) {
        toast('至少保留一个活跃版本', 'error')
        return prev
      }
      return prev.map(t => t.id === tabId ? { ...t, archived: true } : t)
    })
    const tab = tabs.find(t => t.id === tabId)
    const { error } = await supabase.from('tabs').update({ sort_order: -1 }).eq('id', tabId)
    if (error) {
      console.error('Failed to archive tab:', error)
      setTabs((prev) => prev.map(t => t.id === tabId ? { ...t, archived: false } : t))
      toast('归档失败', 'error')
    } else if (tab) {
      toast(`「${tab.label}」已移至历史版本`)
    }
  }, [tabs])

  const restoreTab = useCallback(async (tabId: string) => {
    setTabs((prev) => prev.map(t => t.id === tabId ? { ...t, archived: false } : t))
    const tab = tabs.find(t => t.id === tabId)
    const { error } = await supabase.from('tabs').update({ sort_order: 0 }).eq('id', tabId)
    if (error) {
      console.error('Failed to restore tab:', error)
      setTabs((prev) => prev.map(t => t.id === tabId ? { ...t, archived: true } : t))
      toast('恢复失败', 'error')
    } else if (tab) {
      toast(`「${tab.label}」已恢复`)
    }
  }, [tabs])

  const renameTab = useCallback(async (tabId: string, newLabel: string) => {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) return
    const oldLabel = tab.label

    setTabs((prev) => prev.map(t => t.id === tabId ? { ...t, label: newLabel } : t))
    const { error } = await supabase.from('tabs').update({ label: newLabel }).eq('id', tabId)
    if (error) {
      console.error('Failed to rename tab:', error)
      setTabs((prev) => prev.map(t => t.id === tabId ? { ...t, label: oldLabel } : t))
      toast('重命名失败', 'error')
    }
  }, [tabs])

  const activeTabs = tabs.filter(t => !t.archived)
  const archivedTabs = tabs.filter(t => t.archived)

  return { tabs: activeTabs, archivedTabs, addTab, archiveTab, restoreTab, renameTab, isLoading }
}
