import React from 'react'
import { Button, Form } from 'react-bootstrap'
import { CheckSquareFill, Square } from 'react-bootstrap-icons'

interface ToggleButtonProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'danger'
  size?: 'sm' | 'lg'
  disabled?: boolean
  className?: string
  showIcon?: boolean
  icon?: React.ReactNode
}

export function ToggleButton({
  id,
  checked,
  onChange,
  label,
  variant = 'primary',
  size,
  disabled = false,
  className = '',
  showIcon = true,
  icon
}: ToggleButtonProps) {
  const buttonVariant = checked ? variant : `outline-${variant}`
  const iconSize = size === 'lg' ? 16 : 14

  return (
    <div className="d-flex gap-2">
      <Form.Check
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="d-none"
      />
      <Button
        as="label"
        htmlFor={id}
        variant={buttonVariant}
        size={size}
        className={`d-flex align-items-center ${disabled ? 'disabled' : ''} ${className}`}
        disabled={disabled}
      >
        {showIcon && (
          icon ? (
            icon
          ) : (
            checked ? (
              <CheckSquareFill className="me-2" size={iconSize} />
            ) : (
              <Square className="me-2" size={iconSize} />
            )
          )
        )}
        {label}
      </Button>
    </div>
  )
}

export default ToggleButton
