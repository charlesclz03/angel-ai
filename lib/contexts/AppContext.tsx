'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react'

type Theme = 'light' | 'dark'
type Language = 'en' | 'es' | 'fr' | 'de'

interface AppContextType {
  theme: Theme
  toggleTheme: () => void
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string, variables?: Record<string, string | number>) => string
}

// Simple fallback translations dictionary
const translations: Record<Language, Record<string, string>> = {
  en: {
    'common.welcome': 'Welcome',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
  },
  es: {
    'common.welcome': 'Bienvenido',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
  },
  fr: {
    'common.welcome': 'Bienvenue',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
  },
  de: {
    'common.welcome': 'Willkommen',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
  },
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [language, setLanguage] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const storedTheme = localStorage.getItem('app-theme') as Theme
    if (storedTheme) {
      setTheme(storedTheme)
    }

    const storedLanguage = localStorage.getItem('app-language') as Language
    if (storedLanguage && Object.keys(translations).includes(storedLanguage)) {
      setLanguage(storedLanguage)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('app-theme', theme)
  }, [theme, mounted])

  useEffect(() => {
    if (!mounted) return
    localStorage.setItem('app-language', language)
  }, [language, mounted])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const translate = (
    key: string,
    variables?: Record<string, string | number>
  ): string => {
    let str = translations[language]?.[key] || key
    if (variables) {
      Object.entries(variables).forEach(([k, v]) => {
        str = str.replace(`{{${k}}}`, String(v))
      })
    }
    return str
  }

  return (
    <AppContext.Provider
      value={{ theme, toggleTheme, language, setLanguage, t: translate }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider')
  }
  return context
}
