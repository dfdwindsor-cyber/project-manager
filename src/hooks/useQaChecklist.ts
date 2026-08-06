import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/components/Toast'
import { useAuth } from '@/lib/auth'
import {
  QA_TESTERS,
  QA_ITEMS,
  QA_TOTAL_ROWS,
  qaRowId,
  lastResetBoundary,
  type QaRow,
  type QaTester,
} from '@/lib/qa'

const TESTER_SET: ReadonlySet<string> = new Set(QA_TESTERS)

interface QaMeta {
  id: string
  last_reset_at: string
}

/** 需要补齐的 18 条种子（首次 upsert 用） */
function buildSeedRows(): Omit<QaRow, 'updated_at'>[] {
  const rows: Omit<QaRow, 'updated_at'>[] = []
  for (const tester of QA_TESTERS) {
    for (let idx = 0; idx < QA_ITEMS.length; idx++) {
      rows.push({ id: qaRowId(tester, idx), tester, item_idx: idx, done: false })
    }
  }
  return rows
}

/** 排序：先按 tester 顺序（番茄/玲子/暖树），再按 item_idx */
function sortRows(rows: QaRow[]): QaRow[] {
  const testerOrder = new Map(QA_TESTERS.map((t, i) => [t, i]))
  return [...rows].sort((a, b) => {
    const ta = testerOrder.get(a.tester) ?? 99
    const tb = testerOrder.get(b.tester) ?? 99
    if (ta !== tb) return ta - tb
    return a.item_idx - b.item_idx
  })
}

export function useQaChecklist() {
  const [rows, setRows] = useState<QaRow[]>([])
  const [lastResetAt, setLastResetAt] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { currentUser } = useAuth()
  const runningResetRef = useRef(false)

  const seedIfNeeded = useCallback(async (existing: QaRow[]) => {
    if (existing.length >= QA_TOTAL_ROWS) return existing
    const now = new Date().toISOString()
    const seeds = buildSeedRows().map((r) => ({ ...r, updated_at: now }))
    const { data, error } = await supabase
      .from('qa_checklist')
      .upsert(seeds, { onConflict: 'id' })
      .select('*')
    if (error) {
      console.error('QA seed failed:', error)
      toast('初始化测试专用清单失败', 'error')
      return existing
    }
    return (data ?? []) as QaRow[]
  }, [])

  const runResetIfDue = useCallback(async () => {
    if (runningResetRef.current) return
    runningResetRef.current = true
    try {
      const { data: metaRow, error: metaErr } = await supabase
        .from('qa_meta')
        .select('id, last_reset_at')
        .eq('id', 'singleton')
        .maybeSingle()
      if (metaErr) {
        console.error('QA meta fetch failed:', metaErr)
        return
      }
      let meta = metaRow as QaMeta | null
      const boundary = lastResetBoundary()
      const nowIso = new Date().toISOString()

      if (!meta) {
        const { data: inserted, error: insErr } = await supabase
          .from('qa_meta')
          .insert({ id: 'singleton', last_reset_at: nowIso })
          .select('*')
          .maybeSingle()
        if (insErr) {
          console.error('QA meta init failed:', insErr)
          return
        }
        meta = inserted as QaMeta
      }

      if (new Date(meta.last_reset_at) < boundary) {
        const { error: updErr } = await supabase
          .from('qa_checklist')
          .update({ done: false, updated_at: nowIso })
          .eq('done', true)
        if (updErr) {
          console.error('QA reset (rows) failed:', updErr)
          return
        }
        const { error: metaUpdErr } = await supabase
          .from('qa_meta')
          .update({ last_reset_at: nowIso })
          .eq('id', 'singleton')
        if (metaUpdErr) {
          console.error('QA reset (meta) failed:', metaUpdErr)
          return
        }
        setLastResetAt(nowIso)
      } else {
        setLastResetAt(meta.last_reset_at)
      }
    } finally {
      runningResetRef.current = false
    }
  }, [])

  // 初始 fetch + seed + 重置判断
  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      const { data, error } = await supabase
        .from('qa_checklist')
        .select('*')
      if (error) {
        console.error('QA fetch failed:', error)
        toast('加载测试专用清单失败', 'error')
        if (!cancelled) setIsLoading(false)
        return
      }
      let list = (data ?? []) as QaRow[]
      list = await seedIfNeeded(list)
      await runResetIfDue()
      if (!cancelled) {
        setRows(sortRows(list))
        setIsLoading(false)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [seedIfNeeded, runResetIfDue])

  // 定时 + 页面可见性触发的重置检查
  useEffect(() => {
    const interval = window.setInterval(() => {
      runResetIfDue()
    }, 60_000)
    const onVis = () => {
      if (document.visibilityState === 'visible') runResetIfDue()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [runResetIfDue])

  // Realtime：qa_checklist 行变更
  useEffect(() => {
    const channel = supabase
      .channel('qa-checklist')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'qa_checklist' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const row = payload.new as QaRow
            setRows((prev) => {
              if (prev.some((r) => r.id === row.id)) return prev
              return sortRows([...prev, row])
            })
          } else if (payload.eventType === 'UPDATE') {
            const row = payload.new as QaRow
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

  // Realtime：qa_meta（其他客户端触发过重置后同步 lastResetAt）
  useEffect(() => {
    const channel = supabase
      .channel('qa-meta')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'qa_meta' },
        (payload) => {
          const row = (payload.new ?? payload.old) as QaMeta | null
          if (row?.last_reset_at) setLastResetAt(row.last_reset_at)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const toggle = useCallback(
    async (tester: QaTester, itemIdx: number, done: boolean) => {
      if (currentUser !== tester) {
        toast(`仅 ${tester} 可勾选`, 'error')
        return
      }
      const id = qaRowId(tester, itemIdx)
      const nowIso = new Date().toISOString()
      let prevRow: QaRow | undefined
      setRows((prev) => {
        prevRow = prev.find((r) => r.id === id)
        return prev.map((r) => (r.id === id ? { ...r, done, updated_at: nowIso } : r))
      })
      const { error } = await supabase
        .from('qa_checklist')
        .update({ done, updated_at: nowIso })
        .eq('id', id)
      if (error) {
        console.error('QA toggle failed:', error)
        if (prevRow) {
          const rollback = prevRow
          setRows((prev) => prev.map((r) => (r.id === id ? rollback : r)))
        }
        toast('更新失败', 'error')
      }
    },
    [currentUser]
  )

  // 红点按人识别：
  //   - 当前身份是 3 位测试之一 → 仅看本人对应的 6 项是否有未完成（本人全部 done → 不显示红点）
  //   - 其它身份（含未设置）→ 无红点（红点是个人待办提醒，非本人无对应事项）
  //   - 数据未就绪（表未建/正在加载）→ 若本人是测试则视为未完成兜底显示；非测试仍不显示
  const hasUnchecked = useMemo(() => {
    if (!currentUser || !TESTER_SET.has(currentUser)) return false
    const myRows = rows.filter((r) => r.tester === currentUser)
    if (myRows.length < QA_ITEMS.length) return true
    return myRows.some((r) => !r.done)
  }, [rows, currentUser])

  // 未完成计数（同样按当前身份），便于按钮 tooltip / 徽标使用
  const uncheckedCount = useMemo(() => {
    if (!currentUser || !TESTER_SET.has(currentUser)) return 0
    const myRows = rows.filter((r) => r.tester === currentUser)
    const missing = Math.max(0, QA_ITEMS.length - myRows.length)
    return missing + myRows.filter((r) => !r.done).length
  }, [rows, currentUser])

  // 保留一个全局标志：管理员/其他角色若需要，可从这里读到「组内是否还有未完成」
  const anyUnchecked = useMemo(
    () => rows.length < QA_TOTAL_ROWS || rows.some((r) => !r.done),
    [rows]
  )

  return { rows, hasUnchecked, uncheckedCount, anyUnchecked, toggle, lastResetAt, isLoading }
}
