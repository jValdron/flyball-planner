import { SetType } from '../graphql/generated/graphql'

export const SET_TYPE_DISPLAY_NAMES: Record<SetType, string> = {
  [SetType.AroundTheWorld]: 'Around the World',
  [SetType.BoxWork]: 'Box Work',
  [SetType.Custom]: 'Custom',
  [SetType.FullRuns]: 'Full Runs',
  [SetType.PowerJumping]: 'Power Jumping',
  [SetType.Restraints]: 'Restraints',
  [SetType.ReverseSnapoffs]: 'Reverse Snap-offs',
  [SetType.Snapoffs]: 'Snap-offs',
  [SetType.TwoJumpsFlyball]: 'Two Jumps Flyball'
}

export function getSetTypeDisplayName(type: SetType): string {
  return SET_TYPE_DISPLAY_NAMES[type]
}

export function findSetTypeByDisplayName(displayName: string): SetType | undefined {
  const normalizedDisplayName = displayName.toLowerCase().trim()
  return Object.entries(SET_TYPE_DISPLAY_NAMES).find(
    ([_, display]) => display.toLowerCase() === normalizedDisplayName
  )?.[0] as SetType | undefined
}

export function findSetTypeByPartialMatch(searchTerm: string): SetType[] {
  const normalizedSearchTerm = searchTerm.toLowerCase().trim()
  return Object.entries(SET_TYPE_DISPLAY_NAMES)
    .filter(([_, display]) =>
      display.toLowerCase().includes(normalizedSearchTerm) ||
      display.toLowerCase().replace(/\s+/g, '').includes(normalizedSearchTerm)
    )
    .map(([type]) => type as SetType)
    .filter(type => type !== SetType.Custom)
}