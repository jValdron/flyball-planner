export const TRAINING_LEVELS = {
  1: { text: 'Beginner', variant: 'secondary' },
  2: { text: 'Novice', variant: 'info' },
  3: { text: 'Intermediate', variant: 'primary' },
  4: { text: 'Advanced', variant: 'warning' },
  5: { text: 'Solid', variant: 'primary' }
} as const

export const getTrainingLevelInfo = (level: number) => {
  return TRAINING_LEVELS[level as keyof typeof TRAINING_LEVELS] || {
    text: `Level ${level}`,
    variant: 'secondary'
  }
}
