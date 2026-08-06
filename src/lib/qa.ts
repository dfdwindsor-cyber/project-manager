export const QA_TESTERS = ['番茄', '玲子', '暖树'] as const
export type QaTester = (typeof QA_TESTERS)[number]

export const QA_ITEMS: readonly string[] = [
  '登录线上安装，ios账号',
  '检查当日礼包',
  '广告检查',
  '当日活动检查',
  '最近三天线上活动检查',
  '线上反馈',
]

export const QA_TOTAL_ROWS = QA_TESTERS.length * QA_ITEMS.length

export interface QaRow {
  id: string
  tester: QaTester
  item_idx: number
  done: boolean
  updated_at: string
}

export function qaRowId(tester: string, itemIdx: number): string {
  return `${tester}::${itemIdx}`
}

/** 最近一次「应重置」的时刻：今日 10:00 若已过，否则昨日 10:00。本地时区。 */
export function lastResetBoundary(now: Date = new Date()): Date {
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 10, 0, 0, 0)
  if (b > now) b.setDate(b.getDate() - 1)
  return b
}

export function formatResetTime(iso: string): string {
  const d = new Date(iso)
  const mm = d.getMonth() + 1
  const dd = d.getDate()
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}月${dd}日 ${hh}:${mi}`
}
