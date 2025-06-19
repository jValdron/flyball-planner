import React from 'react'
import { Badge } from 'react-bootstrap'
import { TrainingLevel } from '../graphql/generated/graphql'
import { TRAINING_LEVELS } from '../utils/trainingLevels'

interface TrainingLevelBadgeProps {
  level: TrainingLevel
  className?: string
}

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
