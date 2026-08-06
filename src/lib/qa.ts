export const QA_TESTERS = ['番茄', '玲子', '暖树'] as const
export type QaTester = (typeof QA_TESTERS)[number]

export interface QaItem {
  /** 简称，用于列表左侧粗体展示 */
  title: string
  /** 具体检查内容，展示在标题下方 */
  detail: string
  /** 测试方法：由谁、按什么方式、达到什么效果 */
  method: string
}

export const QA_ITEMS: readonly QaItem[] = [
  {
    title: '每日登录',
    detail: '安卓、iOS：检查游客登录、三方登录',
    method: '版本负责人，每日登录，确保登录成功没有异常',
  },
  {
    title: '当日礼包',
    detail: '安卓、iOS：检查礼包界面、礼包购买',
    method: '版本负责人，当日礼包，确保新开礼包购买正常',
  },
  {
    title: '当日广告',
    detail: '安卓、iOS：检查广告状态、广告观看',
    method: '版本负责人，每日观看，确保成功返回奖励增加',
  },
  {
    title: '当日活动',
    detail: '安卓、iOS：检查当前三个版本，保证活动界面、功能流程正常',
    method: '活动负责人，开启前天，提前打穿确保没有问题',
  },
  {
    title: '线上排期',
    detail: '安卓、iOS：提前检查后三天的排期，保证活动、礼包开启正常',
    method: '版本负责人，按照排期，确保当日开启活动正确',
  },
  {
    title: '线上反馈',
    detail: '安卓、iOS：跟进运营群反馈的问题，谁的功能谁跟进到发版',
    method: '活动负责人，每日跟进，运营同学反馈线上问题',
  },
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

/* ---------- 版本巡检（发版前，一个版本一份检查表；与「测试专用」独立） ---------- */

export const QA_VERSIONS = ['pets', 'taylor', '合合'] as const
export type QaVersion = (typeof QA_VERSIONS)[number]

/** 每个版本对应的测试负责人 */
export const VERSION_TESTER: Record<QaVersion, QaTester> = {
  pets: '暖树',
  taylor: '番茄',
  合合: '玲子',
}

/**
 * 「超级测试」：除本版本对应负责人外，也可勾选/重置任何版本。
 * 飞碟：管理员；番茄：QA leader 角色，跨版本盖章。
 */
export const QA_VERSION_SUPERTESTERS: readonly string[] = ['飞碟', '番茄']

export function canOperateVersion(currentUser: string | null | undefined, version: QaVersion): boolean {
  if (!currentUser) return false
  if (currentUser === VERSION_TESTER[version]) return true
  return QA_VERSION_SUPERTESTERS.includes(currentUser)
}

export type QaVersionPhase = 'before' | 'after'

export interface QaVersionItem {
  phase: QaVersionPhase
  title: string
  detail: string
  /** 多条测试方法用 "\n" 分隔，模态渲染时会各占一行 */
  method: string
}

/** 版本上线前（发版前必检）；顺序 = DB item_idx 0..8，改前请确认不会打乱已有数据 */
export const QA_VERSION_ITEMS_BEFORE: readonly QaVersionItem[] = [
  { phase: 'before', title: '注册', detail: '安卓、iOS', method: '版本负责人，创建新号，确保基本功能没有问题' },
  { phase: 'before', title: '新手', detail: '安卓、iOS', method: '版本负责人，确保新手活动功能正常，没有不看' },
  { phase: 'before', title: '礼包', detail: '安卓、iOS', method: '礼包负责人，检查礼包，确保付费成功正常返回' },
  { phase: 'before', title: '广告', detail: '安卓、iOS', method: '版本负责人，观看成功，确保成功返回奖励增加' },
  {
    phase: 'before',
    title: '排期',
    detail: '安卓、iOS',
    method: '版本负责人，测试排期，确保所有活动礼包正常\n活动负责人，结合排期，确保不同时间活动正常',
  },
  { phase: 'before', title: '遗留', detail: '安卓、iOS', method: '跟进人确认，遗留问题，是否本次版本需要修改' },
  { phase: 'before', title: '代码', detail: '安卓、iOS', method: '活动负责人，与开发确认代码是否全合并到分支' },
  { phase: 'before', title: '崩溃', detail: '安卓、iOS', method: '让开发检查，后台崩溃，是否本次版本需要修改' },
  { phase: 'before', title: '剑心表格', detail: '数值配置', method: '确认剑心表格是否比对完成' },
]

/** 版本上线后（上线当日/次日线上验证）；顺序 = DB item_idx 9..13 */
export const QA_VERSION_ITEMS_AFTER: readonly QaVersionItem[] = [
  { phase: 'after', title: '登录', detail: '安卓、iOS', method: '版本负责人，确保 fb、google、iOS、微信登录成功' },
  { phase: 'after', title: 'GM', detail: '安卓、iOS', method: '版本负责人，确保界面 GM、LOG 日志开关关闭' },
  { phase: 'after', title: '礼包', detail: '安卓、iOS', method: '礼包负责人，检查礼包，确保付费成功正常返回' },
  { phase: 'after', title: '广告', detail: '安卓、iOS', method: '版本负责人，观看成功，确保成功返回奖励增加' },
  {
    phase: 'after',
    title: '排期',
    detail: '安卓、iOS',
    method: '活动负责人，检查活动，确保界面内容功能正常\n与剑心确认中台是否准备好',
  },
]

/** 汇总数组：DB 用其 index 作为 item_idx（before 段占 0..8，after 段占 9..13） */
export const QA_VERSION_ITEMS: readonly QaVersionItem[] = [
  ...QA_VERSION_ITEMS_BEFORE,
  ...QA_VERSION_ITEMS_AFTER,
]

/** before 段大小，用于计算 after 段 item_idx 起点 = QA_VERSION_ITEMS_BEFORE.length */
export const QA_VERSION_AFTER_OFFSET = QA_VERSION_ITEMS_BEFORE.length

export const QA_VERSION_PHASE_LABEL: Record<QaVersionPhase, string> = {
  before: '版本上线前',
  after: '版本上线后',
}

export const QA_VERSION_PHASE_COLOR: Record<QaVersionPhase, string> = {
  before: 'hsl(200, 90%, 45%)', // sky-500：发版前准备
  after: 'hsl(160, 65%, 40%)',  // emerald-600：上线后验证
}

export const QA_VERSION_TOTAL_ROWS = QA_VERSIONS.length * QA_VERSION_ITEMS.length

export interface QaVersionRow {
  id: string
  version: QaVersion
  item_idx: number
  done: boolean
  updated_at: string
}

export function qaVersionRowId(version: string, itemIdx: number): string {
  return `${version}::${itemIdx}`
}
