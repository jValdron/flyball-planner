import React from 'react'

import { Badge } from 'react-bootstrap'

import { TrainingLevel } from '../graphql/generated/graphql'
import { getTrainingLevelInfo } from '../utils/trainingLevels'
import { useTheme } from '../contexts/ThemeContext'

interface TrainingLevelBadgeProps {
  level: TrainingLevel
  className?: string
}

const TrainingLevelBadge: React.FC<TrainingLevelBadgeProps> = ({
  level,
  className = ''
}) => {
  const { isDark } = useTheme()
  const { text, variant } = getTrainingLevelInfo(level)

  return <Badge bg={variant} className={`${isDark ? '' : 'text-dark'} ${className}`}>{text}</Badge>
}

export default TrainingLevelBadge
