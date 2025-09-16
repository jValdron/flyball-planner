import { SetDisplayBase } from './SetDisplayBase'
import type { GetPracticeQuery } from '../../graphql/generated/graphql'

type SetData = NonNullable<GetPracticeQuery['practice']>['sets'][0]

interface SetViewOnlyProps {
  sets: SetData[]
  twoColumns?: boolean
  defaultLocationName?: string
}

export function SetViewOnly({ sets, twoColumns = false, defaultLocationName }: SetViewOnlyProps) {
  return (
    <SetDisplayBase sets={sets} twoColumns={twoColumns} defaultLocationName={defaultLocationName} />
  )
}
