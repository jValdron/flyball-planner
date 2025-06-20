import React from 'react'
import { Dropdown, Button } from 'react-bootstrap'
import { useTheme } from '../contexts/ThemeContext'
import {
  SunFill,
  MoonFill,
  CircleHalf
} from 'react-bootstrap-icons'

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

  return (
    <Dropdown align="end">
      <Dropdown.Toggle
        variant="outline-secondary"
        size="sm"
        className="d-flex align-items-center gap-1"
      >
        {getThemeIcon()}
        <span className="d-none d-sm-inline">{getThemeLabel()}</span>
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Header>Theme</Dropdown.Header>
        <Dropdown.Item
          onClick={() => setTheme('light')}
          active={theme === 'light'}
        >
          <SunFill className="me-2" />
          Light
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => setTheme('dark')}
          active={theme === 'dark'}
        >
          <MoonFill className="me-2" />
          Dark
        </Dropdown.Item>
        <Dropdown.Item
          onClick={() => setTheme('auto')}
          active={theme === 'auto'}
        >
          <CircleHalf className="me-2" />
          Auto
          {theme === 'auto' && (
            <small className="text-muted ms-2">
              ({isDark ? 'Dark' : 'Light'})
            </small>
          )}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  )
}
