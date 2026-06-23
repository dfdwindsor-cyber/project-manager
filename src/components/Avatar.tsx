import { cn } from '@/lib/utils'
import { ASSIGNEE_COLORS } from '@/lib/data'

interface AvatarProps {
  name: string
  size?: 'sm' | 'md'
}

export function Avatar({ name, size = 'md' }: AvatarProps) {
  const initial = name.charAt(0)
  const bg = ASSIGNEE_COLORS[name] || 'hsl(var(--muted-foreground))'
  const sizeClass = size === 'sm' ? 'w-6 h-6 text-[10px]' : 'w-7 h-7 text-xs'

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-medium shrink-0',
        sizeClass
      )}
      style={{ backgroundColor: bg, color: 'white' }}
      title={name}
    >
      {initial}
    </div>
  )
}