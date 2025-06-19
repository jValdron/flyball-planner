import React from 'react'
import { Badge } from 'react-bootstrap'
import { TrainingLevel } from '../graphql/generated/graphql'

interface TrainingLevelBadgeProps {
  level: TrainingLevel
  className?: string
}
export const TRAINING_LEVELS = {
  [TrainingLevel.Beginner]: { text: 'Beginner', variant: 'danger', className: '' },
  [TrainingLevel.Novice]: { text: 'Novice', variant: 'warning', className: 'text-dark' },
  [TrainingLevel.Intermediate]: { text: 'Intermediate', variant: 'secondary', className: '' },
  [TrainingLevel.Advanced]: { text: 'Advanced', variant: 'success', className: '' },
  [TrainingLevel.Solid]: { text: 'Solid', variant: 'info', className: 'text-dark' }
} as const

const TrainingLevelBadge: React.FC<TrainingLevelBadgeProps> = ({
  level,
  className = ''
}) => {
  const { text, variant, className: badgeClassName } = TRAINING_LEVELS[level as TrainingLevel] || {
    text: `${level}`,
    variant: 'secondary'
  }

  return <Badge bg={variant} className={`${badgeClassName} ${className}`}>{text}</Badge>
}

export default TrainingLevelBadge
