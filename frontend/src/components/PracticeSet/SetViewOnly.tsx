import { SetDisplayBase } from './SetDisplayBase'
import type { Set } from '../../graphql/generated/graphql'

interface SetViewOnlyProps {
  sets: Set[]
  twoColumns?: boolean
  defaultLocationName?: string
  smallHeader?: boolean
  hideNotes?: boolean
  practiceScheduledAt?: string | null
  clickableDogBadges?: boolean
  showTrainingLevels?: boolean
  clickableSets?: boolean
  practiceId?: string
  cardClassName?: string
}

export function SetViewOnly({
  sets,
  twoColumns = false,
  defaultLocationName,
  smallHeader = false,
  hideNotes = false,
  practiceScheduledAt,
  clickableDogBadges = false,
  showTrainingLevels = false,
  clickableSets = false,
  practiceId,
  cardClassName
}: SetViewOnlyProps) {
  return (
    <SetDisplayBase
      sets={sets}
      twoColumns={twoColumns}
      defaultLocationName={defaultLocationName}
      smallHeader={smallHeader}
      hideNotes={hideNotes}
      practiceScheduledAt={practiceScheduledAt}
      clickableDogBadges={clickableDogBadges}
      showTrainingLevels={showTrainingLevels}
      clickableSets={clickableSets}
      practiceId={practiceId}
      cardClassName={cardClassName}
    />
  )
}
