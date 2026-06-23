import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { createEmptyRoles, PRIORITY_LIST } from '@/lib/data'
import type { Task, TaskStatus, Priority } from '@/lib/data'

interface NewTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (task: Omit<Task, 'id'>) => void
  category: string
}

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'not_started', label: '待开始' },
  { value: 'developing', label: '开发中' },
  { value: 'func_testing', label: '功能测试' },
  { value: 'testing', label: '测试中' },
  { value: 'planner_review', label: '策划验收' },
  { value: 'test_done', label: '测试结束' },
]

const CLASSIFICATIONS = [
  '章节更新', '链条-更新', '移植-商业化', '换皮-活动',
  '移植-活动', '创新活动', '优化', '其他',
]

const inputClass = 'w-full h-9 px-3 rounded-md border border-input bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-default'

export function NewTaskModal({ isOpen, onClose, onSubmit, category }: NewTaskModalProps) {
  const [name, setName] = useState('')
  const [status, setStatus] = useState<TaskStatus>('not_started')
  const [priority, setPriority] = useState<Priority>('P1')
  const [classification, setClassification] = useState(CLASSIFICATIONS[0])
  const [docLink, setDocLink] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSubmit({
      name: name.trim(),
      status,
      priority,
      classification,
      category,
      roles: createEmptyRoles(),
      docLink: docLink.trim(),
    })
    setName('')
    setStatus('not_started')
    setPriority('P1')
    setClassification(CLASSIFICATIONS[0])
    setDocLink('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/20 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative bg-card rounded-lg shadow-modal w-full max-w-md mx-4 animate-scale-in">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-base font-semibold">新建任务</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-default p-1 rounded-md hover:bg-accent"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">任务名称</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入任务名称..."
              className={inputClass}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">优先级</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value as Priority)} className={inputClass}>
                {PRIORITY_LIST.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-foreground">状态</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className={inputClass}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">分类</label>
            <select value={classification} onChange={(e) => setClassification(e.target.value)} className={inputClass}>
              {CLASSIFICATIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <p className="text-xs text-muted-foreground">
            创建后展开任务行可填写各工种（策划 / UI / 数值 / 研发 / 测试）的排期
          </p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground">文档链接</label>
            <input
              type="url"
              value={docLink}
              onChange={(e) => setDocLink(e.target.value)}
              placeholder="粘贴文档链接..."
              className={inputClass}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" size="sm" disabled={!name.trim()}>
              创建任务
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}