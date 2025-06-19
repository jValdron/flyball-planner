import { TrainingLevel } from "../graphql/generated/graphql"

export const TRAINING_LEVELS = {
  [TrainingLevel.Beginner]: { text: 'Beginner', variant: 'danger', className: '' },
  [TrainingLevel.Novice]: { text: 'Novice', variant: 'warning', className: 'text-dark' },
  [TrainingLevel.Intermediate]: { text: 'Intermediate', variant: 'secondary', className: '' },
  [TrainingLevel.Advanced]: { text: 'Advanced', variant: 'success', className: '' },
  [TrainingLevel.Solid]: { text: 'Solid', variant: 'info', className: 'text-dark' }
} as const

export const getTrainingLevelInfo = (level: TrainingLevel) => {
  return TRAINING_LEVELS[level as keyof typeof TRAINING_LEVELS] || {
    text: `${level}`,
    variant: 'secondary'
  }
}
