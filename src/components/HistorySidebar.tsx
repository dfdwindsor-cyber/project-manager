import { useState } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import type { TabItem } from '@/lib/data'
import { Archive, RotateCcw, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react'

interface HistorySidebarProps {
  archivedTabs: TabItem[]
  activeTab: string
  onOpenArchived: (tabId: string) => void
  onRestore: (tabId: string) => void
}

export function HistorySidebar({ archivedTabs, activeTab, onOpenArchived, onRestore }: HistorySidebarProps) {
  const { isAdmin } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  if (collapsed) {
    return (
      <aside className="w-9 shrink-0 border-r border-border bg-sidebar flex flex-col items-center h-full py-3 transition-[width] duration-200">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="展开历史版本"
          className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-default"
        >
          <ChevronRight className="w-4 h-4" />
          <Archive className="w-4 h-4" />
        </button>
      </aside>
    )
  }

  return (
    <aside className="w-52 shrink-0 border-r border-border bg-sidebar flex flex-col h-full overflow-hidden transition-[width] duration-200">
      <div className="px-3 pt-4 pb-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <Archive className="w-3.5 h-3.5 shrink-0" />
          历史版本
          <button
            type="button"
            onClick={() => setCollapsed(true)}
            title="收起历史版本"
            className="ml-auto p-1 rounded hover:bg-surface-hover hover:text-foreground transition-default"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {archivedTabs.length === 0 ? (
          <p className="text-xs text-muted-foreground px-2 pt-2">暂无历史版本</p>
        ) : (
          <div className="space-y-0.5">
            {archivedTabs.map((tab) => {
              const isActive = tab.id === activeTab
              return (
                <div
                  key={tab.id}
                  className={cn(
                    'group flex items-center gap-2 px-2.5 py-2 rounded-md text-sm cursor-pointer transition-default',
                    isActive
                      ? 'bg-accent text-foreground font-medium'
                      : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
                  )}
                  onClick={() => onOpenArchived(tab.id)}
                >
                  <FolderOpen className="w-3.5 h-3.5 shrink-0 opacity-60" />
                  <span className="truncate flex-1">{tab.label}</span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRestore(tab.id)
                      }}
                      title="恢复到活跃版本"
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-primary/10 hover:text-primary transition-default"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </aside>
  )
}
