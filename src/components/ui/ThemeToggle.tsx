// components/ThemeToggle.tsx
import  useThemes  from "../../hooks/useThemes"
import { Sun, Moon } from "lucide-react"

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemes()

  return (
    <button onClick={toggleTheme} className="p-2 rounded-md border bg-background shadow-md">
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  )
}
