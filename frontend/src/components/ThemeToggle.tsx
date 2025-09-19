import React from 'react'

import { Dropdown } from 'react-bootstrap'
import {
  SunFill,
  MoonFill,
  CircleHalf
} from 'react-bootstrap-icons'

import { useTheme } from '../contexts/ThemeContext'

export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, isDark } = useTheme()

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <SunFill />
      case 'dark':
        return <MoonFill />
      case 'auto':
        return <CircleHalf />
      default:
        return <CircleHalf />
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light'
      case 'dark':
        return 'Dark'
      case 'auto':
        return 'Auto'
      default:
        return 'Auto'
    }
  }

  const cycleTheme = () => {
    switch (theme) {
      case 'light':
        setTheme('dark')
        break
      case 'dark':
        setTheme('auto')
        break
      case 'auto':
        setTheme('light')
        break
      default:
        setTheme('light')
    }
  }

  return (
    <Dropdown.Item onClick={cycleTheme}>
      <div className="d-flex align-items-center gap-2">
        {getThemeIcon()}
        <span>Theme: {getThemeLabel()}</span>
        {theme === 'auto' && (
          <small className="text-muted ms-auto">
            ({isDark ? 'Dark' : 'Light'})
          </small>
        )}
      </div>
    </Dropdown.Item>
  )
}
