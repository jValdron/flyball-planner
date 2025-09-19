import { TrainingLevel } from "../graphql/generated/graphql"

export const TRAINING_LEVELS = {
  [TrainingLevel.Beginner]: { text: 'Beginner', variant: 'danger-subtle', fullVariant: 'danger' },
  [TrainingLevel.Novice]: { text: 'Novice', variant: 'warning-subtle', fullVariant: 'warning' },
  [TrainingLevel.Intermediate]: { text: 'Intermediate', variant: 'secondary-subtle', fullVariant: 'secondary' },
  [TrainingLevel.Advanced]: { text: 'Advanced', variant: 'success-subtle', fullVariant: 'success' },
  [TrainingLevel.Solid]: { text: 'Solid', variant: 'info-subtle', fullVariant: 'info' }
} as const

export const getTrainingLevelInfo = (level: TrainingLevel) => {
  return TRAINING_LEVELS[level as keyof typeof TRAINING_LEVELS] || {
    text: `${level}`,
    variant: 'secondary',
    fullVariant: 'secondary'
  }
}
