import { useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from '@phosphor-icons/react'

export function ThemeToggle() {
  const [theme, setTheme] = useKV<'light' | 'dark'>('theme-preference', 'dark')

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])

  const toggleTheme = () => {
    setTheme(current => current === 'dark' ? 'light' : 'dark')
  }

  return (
    <Button variant="outline" size="lg" onClick={toggleTheme}>
      {theme === 'dark' ? (
        <>
          <Sun size={20} className="mr-2" weight="duotone" />
          Light Mode
        </>
      ) : (
        <>
          <Moon size={20} className="mr-2" weight="duotone" />
          Dark Mode
        </>
      )}
    </Button>
  )
}
