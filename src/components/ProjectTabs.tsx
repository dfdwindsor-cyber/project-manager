import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth'
import type { TabItem } from '@/lib/data'
import { Plus, X, Pencil } from 'lucide-react'

interface ProjectTabsProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabId: string) => void
  onAddTab: (label: string) => void
  onRemoveTab: (tabId: string) => void
  onRenameTab: (tabId: string, newLabel: string) => void
}

export function ProjectTabs({ tabs, activeTab, onTabChange, onAddTab, onRemoveTab, onRenameTab }: ProjectTabsProps) {
  const { isAdmin } = useAuth()
  const [isAdding, setIsAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const editRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus()
      editRef.current.select()
    }
  }, [editingId])

  const handleAdd = () => {
    const label = newLabel.trim()
    if (!label) return
    onAddTab(label)
    setNewLabel('')
    setIsAdding(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAdd()
    } else if (e.key === 'Escape') {
      setIsAdding(false)
      setNewLabel('')
    }
  }

  const startRename = (tab: TabItem) => {
    setEditingId(tab.id)
    setEditLabel(tab.label)
  }

  const commitRename = () => {
    if (editingId && editLabel.trim()) {
      onRenameTab(editingId, editLabel.trim())
    }
    setEditingId(null)
    setEditLabel('')
  }

  const handleRenameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      commitRename()
    } else if (e.key === 'Escape') {
      setEditingId(null)
      setEditLabel('')
    }
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab
        const isEditing = editingId === tab.id

        if (isEditing) {
          return (
            <input
              key={tab.id}
              ref={editRef}
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onKeyDown={handleRenameKeyDown}
              onBlur={commitRename}
              className="h-7 w-32 px-2 text-sm rounded-md border border-ring bg-card focus:outline-none"
            />
          )
        }

        return (
          <div key={tab.id} className="relative group/tab flex items-center">
            <button
              type="button"
              onClick={() => onTabChange(tab.id)}
              onDoubleClick={() => isAdmin && startRename(tab)}
              className={cn(
                'relative px-3 py-1.5 rounded-md text-sm whitespace-nowrap transition-default',
                isActive
                  ? 'bg-tab-active text-tab-active-foreground font-medium shadow-subtle'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              {tab.label}
            </button>
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    startRename(tab)
                  }}
                  className={cn(
                    'absolute -top-1 -right-5 w-4 h-4 rounded-full flex items-center justify-center transition-default',
                    'opacity-0 group-hover/tab:opacity-100',
                    'bg-muted hover:bg-primary hover:text-primary-foreground',
                    'text-muted-foreground text-[10px]'
                  )}
                >
                  <Pencil className="w-2.5 h-2.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveTab(tab.id)
                  }}
                  className={cn(
                    'absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center transition-default',
                    'opacity-0 group-hover/tab:opacity-100',
                    'bg-muted hover:bg-destructive hover:text-destructive-foreground',
                    'text-muted-foreground text-[10px]'
                  )}
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </>
            )}
          </div>
        )
      })}

      {/* Add tab - admin only */}
      {isAdmin && (
        isAdding ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleAdd}
              placeholder="版本名称..."
              className="h-7 w-32 px-2 text-sm rounded-md border border-ring bg-card focus:outline-none"
              autoFocus
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1 px-2 py-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-default text-sm"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )
      )}
    </div>
  )
}
