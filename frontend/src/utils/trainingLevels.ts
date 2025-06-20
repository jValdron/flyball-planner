import { TrainingLevel } from "../graphql/generated/graphql"

export const TRAINING_LEVELS = {
  [TrainingLevel.Beginner]: { text: 'Beginner', variant: 'danger-subtle', className: '' },
  [TrainingLevel.Novice]: { text: 'Novice', variant: 'warning-subtle', className: '' },
  [TrainingLevel.Intermediate]: { text: 'Intermediate', variant: 'secondary-subtle', className: '' },
  [TrainingLevel.Advanced]: { text: 'Advanced', variant: 'success-subtle', className: '' },
  [TrainingLevel.Solid]: { text: 'Solid', variant: 'info-subtle', className: '' }
} as const

export const getTrainingLevelInfo = (level: TrainingLevel) => {
  return TRAINING_LEVELS[level as keyof typeof TRAINING_LEVELS] || {
    text: `${level}`,
    variant: 'secondary'
  }
}
