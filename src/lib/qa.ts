export const QA_TESTERS = ['番茄', '玲子', '暖树'] as const
export type QaTester = (typeof QA_TESTERS)[number]

export interface QaItem {
  /** 简称，用于列表左侧粗体展示 */
  title: string
  /** 具体检查内容，展示在标题下方 */
  detail: string
}

export const QA_ITEMS: readonly QaItem[] = [
  { title: '每日登录', detail: '安卓、iOS：检查游客登录、三方登录' },
  { title: '当日礼包', detail: '安卓、iOS：检查礼包界面、礼包购买' },
  { title: '当日广告', detail: '安卓、iOS：检查广告状态、广告观看' },
  { title: '当日活动', detail: '安卓、iOS：检查当前三个版本，保证活动界面、功能流程正常' },
  { title: '线上排期', detail: '安卓、iOS：提前检查后三天的排期，保证活动、礼包开启正常' },
  { title: '线上反馈', detail: '安卓、iOS：跟进运营群反馈的问题，谁的功能谁跟进到发版' },
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
