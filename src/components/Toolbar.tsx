import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

interface ToolbarProps {
  onNewTask: () => void
}

export function Toolbar({ onNewTask }: ToolbarProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-border shrink-0">
      <span className="text-xs text-muted-foreground">点击列头可筛选 · 点击任务行可展开编辑工种排期</span>
      <Button size="sm" onClick={onNewTask} className="gap-1.5">
        <Plus className="w-3.5 h-3.5" />
        新建任务
      </Button>
    </div>
  )
}