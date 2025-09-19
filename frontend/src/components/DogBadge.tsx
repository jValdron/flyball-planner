import React from 'react'

import { Badge } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'

import type { Dog } from '../graphql/generated/graphql'
import { getTrainingLevelInfo } from '../utils/trainingLevels'
import { useTheme } from '../contexts/ThemeContext'

interface DogBadgeProps {
  dog: Dog
  clickable?: boolean
  onClick?: (dog: Dog, event: React.MouseEvent) => void
  className?: string
  variant?: string
  showTrainingLevel?: boolean
  bgByTrainingLevel?: boolean
}

const DogBadge: React.FC<DogBadgeProps> = ({
  dog,
  clickable = false,
  onClick,
  className = '',
  variant,
  showTrainingLevel = false,
  bgByTrainingLevel = false,
}) => {
  const { isDark } = useTheme()
  const navigate = useNavigate()

  const handleClick = (event: React.MouseEvent) => {
    if (clickable) {
      event.preventDefault()
      event.stopPropagation()

      if (event.ctrlKey || event.metaKey) {
        window.open(`/dogs/${dog.id}`, '_blank')
        return
      }

      if (onClick) {
        onClick(dog, event)
      } else {
        navigate(`/dogs/${dog.id}`)
      }
    }
  }

  const handleMouseDown = (event: React.MouseEvent) => {
    if (clickable && event.button === 1) {
      event.preventDefault()
      event.stopPropagation()
      window.open(`/dogs/${dog.id}`, '_blank')
    }
  }

  let badgeVariant = variant || 'secondary'
  if (bgByTrainingLevel) {
    const { variant: trainingVariant } = getTrainingLevelInfo(dog.trainingLevel)
    badgeVariant = trainingVariant
  }

  const allClassName = `me-1 mb-1 ${clickable ? 'cur-point' : ''} ${isDark ? '' : 'text-dark'} ${className}`

  return (
    <Badge
      bg={badgeVariant}
      className={allClassName}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
    >
      {dog.name}
      {showTrainingLevel && (
        <span className="ms-1">
          ({getTrainingLevelInfo(dog.trainingLevel).text})
        </span>
      )}
    </Badge>
  )
}

export default DogBadge
