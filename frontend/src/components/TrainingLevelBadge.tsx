import React from 'react'
import { Badge } from 'react-bootstrap'
import { getTrainingLevelInfo } from '../utils/trainingLevels'

interface TrainingLevelBadgeProps {
  level: number
  className?: string
}

const TrainingLevelBadge: React.FC<TrainingLevelBadgeProps> = ({
  level,
  className = ''
}) => {
  const { text, variant } = getTrainingLevelInfo(level)

  return <Badge bg={variant} className={className}>{text}</Badge>
}

export default TrainingLevelBadge
