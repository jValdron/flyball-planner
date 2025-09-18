import { TrainingLevel } from "../graphql/generated/graphql"

export const TRAINING_LEVELS = {
  [TrainingLevel.Beginner]: { text: 'Beginner', variant: 'danger-subtle' },
  [TrainingLevel.Novice]: { text: 'Novice', variant: 'warning-subtle' },
  [TrainingLevel.Intermediate]: { text: 'Intermediate', variant: 'secondary-subtle' },
  [TrainingLevel.Advanced]: { text: 'Advanced', variant: 'success-subtle' },
  [TrainingLevel.Solid]: { text: 'Solid', variant: 'info-subtle' }
} as const

export const getTrainingLevelInfo = (level: TrainingLevel) => {
  return TRAINING_LEVELS[level as keyof typeof TRAINING_LEVELS] || {
    text: `${level}`,
    variant: 'secondary'
  }
}
