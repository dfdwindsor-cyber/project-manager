import { useState, useEffect, useCallback } from 'react'
import { ProjectTabs } from '@/components/ProjectTabs'
import { Toolbar } from '@/components/Toolbar'
import { TaskList } from '@/components/TaskList'
import { NewTaskModal } from '@/components/NewTaskModal'
import { EditTaskModal } from '@/components/EditTaskModal'
import { HistorySidebar } from '@/components/HistorySidebar'
import { ToastContainer, toast } from '@/components/Toast'
import { AuthProvider, useAuth } from '@/lib/auth'
import { useTabs } from '@/hooks/useTabs'
import { useTasks } from '@/hooks/useTasks'
import type { Task } from '@/lib/data'
import { Shield, ShieldCheck, Share2, Loader2 } from 'lucide-react'

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

function AppContent() {
  const { isAdmin, isLoading: authLoading, adminToken } = useAuth()
  const { tabs, archivedTabs, addTab, archiveTab, restoreTab, renameTab, isLoading: tabsLoading } = useTabs()
  const [activeTab, setActiveTab] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showSharePanel, setShowSharePanel] = useState(false)

  // 初始化 activeTab
  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].id)
    }
    // tab 被归档时自动切换到第一个活跃 tab
    if (activeTab && tabs.length > 0 && !tabs.some((t) => t.id === activeTab) && !archivedTabs.some((t) => t.id === activeTab)) {
      setActiveTab(tabs[0].id)
    }
  }, [tabs, archivedTabs, activeTab])

  const { tasks, addTask, updateStatus, updateRole, updateTask, deleteTask, isLoading: tasksLoading } = useTasks(activeTab)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const handleAddTab = useCallback(async (label: string) => {
    const newId = await addTab(label)
    setActiveTab(newId)
  }, [addTab])

  const handleArchiveTab = useCallback(async (tabId: string) => {
    await archiveTab(tabId)
    // 如果归档的是当前激活的 tab，切到第一个活跃 tab
    if (tabId === activeTab && tabs.length > 1) {
      const next = tabs.find(t => t.id !== tabId)
      if (next) setActiveTab(next.id)
    }
  }, [archiveTab, activeTab, tabs])

  const handleRestoreTab = useCallback(async (tabId: string) => {
    await restoreTab(tabId)
    setActiveTab(tabId)
  }, [restoreTab])

  const handleRenameTab = useCallback(async (tabId: string, newLabel: string) => {
    await renameTab(tabId, newLabel)
  }, [renameTab])

  const handleOpenArchived = useCallback((tabId: string) => {
    setActiveTab(tabId)
  }, [])

  const handleNewTask = useCallback(async (taskData: Omit<Task, 'id'>) => {
    await addTask(taskData)
    setIsModalOpen(false)
  }, [addTask])

  const handleCopyLink = useCallback((type: 'admin' | 'member') => {
    const origin = window.location.origin
    let link: string
    if (type === 'admin' && adminToken) {
      link = `${origin}/?role=admin&token=${adminToken}`
    } else {
      link = `${origin}/?role=member`
    }
    navigator.clipboard.writeText(link).then(() => {
      toast(type === 'admin' ? '管理员链接已复制' : '成员链接已复制')
    })
  }, [adminToken])

  const isViewingArchived = archivedTabs.some(t => t.id === activeTab)

  if (authLoading || tabsLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">加载中...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Project header */}
      <header className="border-b border-border bg-card shrink-0">
        <div className="flex items-center justify-between px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">T</span>
            </div>
            <h1 className="text-base font-semibold">taylor</h1>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md ${
                isAdmin
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground bg-accent'
              }`}
            >
              {isAdmin ? <ShieldCheck className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
              {isAdmin ? '管理员' : '成员'}
            </span>
            {isAdmin && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowSharePanel(!showSharePanel)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-default"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  分享
                </button>
                {showSharePanel && (
                  <div className="absolute right-0 top-full mt-1 z-50 w-56 bg-card rounded-lg border border-border shadow-elevated p-3 space-y-2 animate-fade-in">
                    <p className="text-xs text-muted-foreground font-medium">复制邀请链接</p>
                    <button
                      type="button"
                      onClick={() => { handleCopyLink('admin'); setShowSharePanel(false) }}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded-md hover:bg-surface-hover transition-default"
                    >
                      <ShieldCheck className="w-3 h-3 inline mr-1.5 text-primary" />
                      管理员链接
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleCopyLink('member'); setShowSharePanel(false) }}
                      className="w-full text-left px-2.5 py-1.5 text-xs rounded-md hover:bg-surface-hover transition-default"
                    >
                      <Shield className="w-3 h-3 inline mr-1.5 text-muted-foreground" />
                      成员链接
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-2">
          <ProjectTabs
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            onAddTab={handleAddTab}
            onRemoveTab={handleArchiveTab}
            onRenameTab={handleRenameTab}
          />
        </div>
      </header>

      {/* Main content area with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* History sidebar */}
        <HistorySidebar
          archivedTabs={archivedTabs}
          activeTab={activeTab}
          onOpenArchived={handleOpenArchived}
          onRestore={handleRestoreTab}
        />

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Archived banner */}
          {isViewingArchived && (
            <div className="px-4 py-2 bg-amber-50 border-b border-amber-200 flex items-center gap-2 shrink-0">
              <span className="text-xs text-amber-700 font-medium">
                正在查看历史版本「{archivedTabs.find(t => t.id === activeTab)?.label}」
              </span>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => handleRestoreTab(activeTab)}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  恢复为活跃版本
                </button>
              )}
            </div>
          )}

          {/* Toolbar */}
          <Toolbar onNewTask={() => setIsModalOpen(true)} />

          {/* Task list */}
          {tasksLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-3 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">加载任务...</span>
              </div>
            </div>
          ) : (
            <TaskList
              tasks={tasks}
              onStatusChange={updateStatus}
              onRoleChange={updateRole}
              onDelete={deleteTask}
              onEditTask={setEditingTask}
            />
          )}
        </div>
      </div>

      {/* New task modal */}
      <NewTaskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleNewTask}
        category={activeTab}
      />

      {/* Edit task modal */}
      <EditTaskModal
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSubmit={updateTask}
      />

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  )
}

export default App
