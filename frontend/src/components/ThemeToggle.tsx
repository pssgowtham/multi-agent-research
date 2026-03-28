import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'))
  }, [])

  const toggle = () => {
    document.documentElement.classList.toggle('dark')
    setIsDark(prev => !prev)
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border hover:bg-accent transition-colors"
    >
      {isDark ? '☀️ Light mode' : '🌙 Dark mode'}
    </button>
  )
}