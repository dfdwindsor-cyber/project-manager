import { createContext, useContext, useState, type ReactNode } from 'react'

export type UserRole = 'admin' | 'member'

/** 选择该姓名即拥有管理员权限，不再通过链接/token 区分身份 */
const ADMIN_NAME = '飞碟'

interface AuthContextValue {
  role: UserRole
  isAdmin: boolean
  /** 当前用户自选的身份（姓名），用于管理员判断、"策划本人可删自己任务"等，存本机 */
  currentUser: string | null
  setCurrentUser: (name: string | null) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<string | null>(
    () => localStorage.getItem('pm_current_user') || null
  )

  const setCurrentUser = (name: string | null) => {
    setCurrentUserState(name)
    if (name) localStorage.setItem('pm_current_user', name)
    else localStorage.removeItem('pm_current_user')
  }

  const isAdmin = currentUser === ADMIN_NAME

  return (
    <AuthContext.Provider value={{ role: isAdmin ? 'admin' : 'member', isAdmin, currentUser, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
