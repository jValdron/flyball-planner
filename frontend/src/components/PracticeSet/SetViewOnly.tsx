import { SetDisplayBase } from './SetDisplayBase'
import type { GetPracticeQuery } from '../../graphql/generated/graphql'

type SetData = NonNullable<GetPracticeQuery['practice']>['sets'][0]

interface SetViewOnlyProps {
  sets: SetData[]
  twoColumns?: boolean
  defaultLocationName?: string
  smallHeader?: boolean
  hideNotes?: boolean
  practiceScheduledAt?: string | null
}

export function SetViewOnly({ sets, twoColumns = false, defaultLocationName, smallHeader = false, hideNotes = false, practiceScheduledAt }: SetViewOnlyProps) {
  return (
    <SetDisplayBase
      sets={sets}
      twoColumns={twoColumns}
      defaultLocationName={defaultLocationName}
      smallHeader={smallHeader}
      hideNotes={hideNotes}
      practiceScheduledAt={practiceScheduledAt}
    />
  )
}
