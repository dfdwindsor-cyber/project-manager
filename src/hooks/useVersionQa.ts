import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/Toast'
import { useAuth } from '@/lib/auth'
import {
  QA_VERSIONS,
  QA_VERSION_ITEMS,
  QA_VERSION_TOTAL_ROWS,
  VERSION_TESTER,
  canOperateVersion,
  qaVersionRowId,
  type QaVersion,
  type QaVersionRow,
} from '@/lib/qa'

function buildSeedRows(): Omit<QaVersionRow, 'updated_at'>[] {
  const rows: Omit<QaVersionRow, 'updated_at'>[] = []
  for (const version of QA_VERSIONS) {
    for (let idx = 0; idx < QA_VERSION_ITEMS.length; idx++) {
      rows.push({ id: qaVersionRowId(version, idx), version, item_idx: idx, done: false })
    }
  }
  return rows
}

function sortRows(rows: QaVersionRow[]): QaVersionRow[] {
  const versionOrder = new Map<string, number>(QA_VERSIONS.map((v, i) => [v, i]))
  return [...rows].sort((a, b) => {
    const va = versionOrder.get(a.version) ?? 99
    const vb = versionOrder.get(b.version) ?? 99
    if (va !== vb) return va - vb
    return a.item_idx - b.item_idx
  })
}

export function useVersionQa() {
  const [rows, setRows] = useState<QaVersionRow[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { currentUser } = useAuth()
  const seedingRef = useRef(false)

  const seedIfNeeded = useCallback(async (existing: QaVersionRow[]) => {
    if (existing.length >= QA_VERSION_TOTAL_ROWS) return existing
    if (seedingRef.current) return existing
    seedingRef.current = true
    try {
      const now = new Date().toISOString()
      const seeds = buildSeedRows().map((r) => ({ ...r, updated_at: now }))
      const { data, error } = await supabase
        .from('qa_version_checklist')
        .upsert(seeds, { onConflict: 'id' })
        .select('*')
      if (error) {
        console.error('QA version seed failed:', error)
        toast('初始化版本巡检清单失败', 'error')
        return existing
      }
      return (data ?? []) as QaVersionRow[]
    } finally {
      seedingRef.current = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      const { data, error } = await supabase.from('qa_version_checklist').select('*')
      if (error) {
        console.error('QA version fetch failed:', error)
        toast('加载版本巡检清单失败', 'error')
        if (!cancelled) setIsLoading(false)
        return
      }
      let list = (data ?? []) as QaVersionRow[]
      list = await seedIfNeeded(list)
      if (!cancelled) {
        setRows(sortRows(list))
        setIsLoading(false)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [seedIfNeeded])

  useEffect(() => {
    const channel = supabase
      .channel('qa-version-checklist')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'qa_version_checklist' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as QaVersionRow
            setRows((prev) => {
              if (prev.some((r) => r.id === row.id)) return prev
              return sortRows([...prev, row])
            })
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as QaVersionRow
            setRows((prev) => prev.map((r) => (r.id === row.id ? row : r)))
          } else if (payload.eventType === 'DELETE') {
            const old = payload.old as { id: string }
            setRows((prev) => prev.filter((r) => r.id !== old.id))
          }
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const toggle = useCallback(
    async (version: QaVersion, itemIdx: number, done: boolean) => {
      if (!canOperateVersion(currentUser, version)) {
        const expected = VERSION_TESTER[version]
        toast(`仅 ${expected} / 飞碟 / 番茄 可勾选 ${version} 的巡检项`, 'error')
        return
      }
      const id = qaVersionRowId(version, itemIdx)
      const nowIso = new Date().toISOString()
      let prevRow: QaVersionRow | undefined
      setRows((prev) => {
        prevRow = prev.find((r) => r.id === id)
        return prev.map((r) => (r.id === id ? { ...r, done, updated_at: nowIso } : r))
      })
      const { error } = await supabase
        .from('qa_version_checklist')
        .update({ done, updated_at: nowIso })
        .eq('id', id)
      if (error) {
        console.error('QA version toggle failed:', error)
        if (prevRow) {
          const rollback = prevRow
          setRows((prev) => prev.map((r) => (r.id === id ? rollback : r)))
        }
        toast('更新失败', 'error')
      }
    },
    [currentUser]
  )

  const resetVersion = useCallback(
    async (version: QaVersion) => {
      if (!canOperateVersion(currentUser, version)) {
        const expected = VERSION_TESTER[version]
        toast(`仅 ${expected} / 飞碟 / 番茄 可重置 ${version} 的巡检`, 'error')
        return
      }
      const nowIso = new Date().toISOString()
      const prev = rows
      setRows((cur) =>
        cur.map((r) => (r.version === version ? { ...r, done: false, updated_at: nowIso } : r))
      )
      const { error } = await supabase
        .from('qa_version_checklist')
        .update({ done: false, updated_at: nowIso })
        .eq('version', version)
      if (error) {
        console.error('QA version reset failed:', error)
        setRows(prev)
        toast('重置失败', 'error')
      } else {
        toast(`${version} 巡检已重置`)
      }
    },
    [currentUser, rows]
  )

  const versionsWithUnchecked = useMemo(() => {
    const set = new Set<QaVersion>()
    for (const v of QA_VERSIONS) {
      const myRows = rows.filter((r) => r.version === v)
      if (myRows.length < QA_VERSION_ITEMS.length) {
        set.add(v)
      } else if (myRows.some((r) => !r.done)) {
        set.add(v)
      }
    }
    return set
  }, [rows])

  return { rows, versionsWithUnchecked, toggle, resetVersion, isLoading }
}
