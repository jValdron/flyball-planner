import { Card, Badge } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { getSetTypeDisplayName } from '../../utils/setTypeUtils'
import { getTrainingLevelInfo } from '../../utils/trainingLevels'
import { useTheme } from '../../contexts/ThemeContext'
import { formatRelativeTime } from '../../utils/dateUtils'
import { Lane } from '../../graphql/generated/graphql'
import type { GetPracticeQuery } from '../../graphql/generated/graphql'
import './SetViewOnly.css'

type SetData = NonNullable<GetPracticeQuery['practice']>['sets'][0]

interface SetDisplayBaseProps {
  sets: SetData[]
  twoColumns?: boolean
  defaultLocationName?: string
  showTrainingLevels?: boolean
  clickableDogBadges?: boolean
  smallHeader?: boolean
  hideNotes?: boolean
  practiceScheduledAt?: string | null
  children?: (set: SetData, setIndex: number) => React.ReactNode
}

export function SetDisplayBase({ sets, twoColumns = false, defaultLocationName, showTrainingLevels = false, clickableDogBadges = false, smallHeader = false, hideNotes = false, practiceScheduledAt, children }: SetDisplayBaseProps) {
  const { isDark } = useTheme()
  const navigate = useNavigate()

  const handleDogBadgeClick = (dogId: string) => {
    if (clickableDogBadges) {
      navigate(`/dogs/${dogId}`)
    }
  }

  if (sets.length === 0) {
    return <p className="text-muted text-center">No sets planned yet</p>
  }

  return (
    <div className={`sets-list d-flex gap-3 ${twoColumns ? 'flex-wrap' : 'flex-column'}`}>
      {Object.entries(
        [...sets]
          .sort((a, b) => a.index - b.index)
          .reduce((groups, set) => {
            const key = set.index.toString()
            if (!groups[key]) {
              groups[key] = []
            }
            groups[key].push(set)
            return groups
          }, {} as Record<string, Array<typeof sets[0]>>)
      ).map(([index, sets]) => (
        <Card key={index} className="w-100">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div className={`mb-0 ${smallHeader ? '' : 'fs-5'}`}>
              {practiceScheduledAt && (
                <span className="text-muted me-3">{formatRelativeTime(practiceScheduledAt)}</span>
              )}
              <span className="fw-normal">Set {index}{(sets as any[])[0].type ? ' -' : ''}</span>
              {(sets as any[])[0].type && (
                <span className="ms-2 fw-bold">
                  {(sets as any[])[0].typeCustom || getSetTypeDisplayName((sets as any[])[0].type as any)}
                </span>
              )}
            </div>
            <div className="text-end">
              {(sets as any[]).some((set: any) => set.isWarmup) && (
                <Badge bg="info">Warmup</Badge>
              )}
            </div>
          </Card.Header>
          <Card.Body>
            {(sets as any[]).map((set: any, setIndex: number) => (
              <div key={set.id}>
                {setIndex > 0 && <hr className="my-3" />}
                {set.location && set.location.name !== defaultLocationName && (
                  <div className="mb-2">
                    <strong>{set.location.name}</strong>
                  </div>
                )}
                {set.dogs.length > 0 ? (
                  <div className="lane-container">
                    {(() => {
                      const isDoubleLane = set.location?.isDoubleLane || false
                      const hasDogsInLeftLane = set.dogs.some((d: any) => d.lane === Lane.Left)
                      const hasDogsInRightLane = set.dogs.some((d: any) => d.lane === Lane.Right)
                      const hasDogsInBothLanes = hasDogsInLeftLane && hasDogsInRightLane

                      if (isDoubleLane && hasDogsInBothLanes) {
                        return [Lane.Left, Lane.Right].map(lane => {
                          const laneDogs = set.dogs.filter((d: any) => d.lane === lane)

                          return (
                            <div key={lane} className={`lane-column ${lane === Lane.Left ? 'left' : 'right'}`}>
                              <div className={`lane-dogs ${laneDogs.length < 5 ? 'force-wrap' : ''} ${lane === Lane.Right ? 'justify-content-end' : ''}`}>
                                {[...laneDogs]
                                  .sort((a, b) => a.index - b.index)
                                  .map((setDog) => {
                                    if (showTrainingLevels) {
                                      const trainingLevel = setDog.dog?.trainingLevel
                                      const { variant } = getTrainingLevelInfo(trainingLevel)
                                      return (
                                        <Badge
                                          key={setDog.id}
                                          bg={variant}
                                          className={`me-1 mb-1 ${isDark ? '' : 'text-dark'}`}
                                          style={clickableDogBadges ? { cursor: 'pointer' } : {}}
                                          onClick={() => handleDogBadgeClick(setDog.dogId || setDog.id)}
                                        >
                                          {setDog.dog?.name || `Dog ${setDog.dogId || setDog.id}`}
                                        </Badge>
                                      )
                                    } else {
                                      return (
                                        <Badge
                                          key={setDog.id}
                                          bg="secondary"
                                          className={`me-1 mb-1 ${isDark ? '' : 'text-dark'}`}
                                          style={clickableDogBadges ? { cursor: 'pointer' } : {}}
                                          onClick={() => handleDogBadgeClick(setDog.dogId || setDog.id)}
                                        >
                                          {setDog.dog?.name || `Dog ${setDog.dogId || setDog.id}`}
                                        </Badge>
                                      )
                                    }
                                  })}
                              </div>
                            </div>
                          )
                        })
                      } else {
                        const allDogs = set.dogs.filter((d: any) => d.lane === null || d.lane === Lane.Left || d.lane === Lane.Right)
                        return (
                          <div key="single" className="single-lane">
                            <div className={`lane-dogs ${allDogs.length < 5 ? 'force-wrap' : ''}`}>
                              {[...allDogs]
                                .sort((a, b) => a.index - b.index)
                                .map((setDog) => {
                                  if (showTrainingLevels) {
                                    const trainingLevel = setDog.dog?.trainingLevel
                                    const { variant } = getTrainingLevelInfo(trainingLevel)
                                    return (
                                      <Badge
                                        key={setDog.id}
                                        bg={variant}
                                        className={`me-1 mb-1 ${isDark ? '' : 'text-dark'}`}
                                        style={clickableDogBadges ? { cursor: 'pointer' } : {}}
                                        onClick={() => handleDogBadgeClick(setDog.dogId || setDog.id)}
                                      >
                                        {setDog.dog?.name || `Dog ${setDog.dogId || setDog.id}`}
                                      </Badge>
                                    )
                                  } else {
                                    return (
                                      <Badge
                                        key={setDog.id}
                                        bg="secondary"
                                        className={`me-1 mb-1 ${isDark ? '' : 'text-dark'}`}
                                        style={clickableDogBadges ? { cursor: 'pointer' } : {}}
                                        onClick={() => handleDogBadgeClick(setDog.dogId || setDog.id)}
                                      >
                                        {setDog.dog?.name || `Dog ${setDog.dogId || setDog.id}`}
                                      </Badge>
                                    )
                                  }
                                })}
                            </div>
                          </div>
                        )
                      }
                    })()}
                  </div>
                ) : (
                  <em className="text-muted">No dogs assigned</em>
                )}
                {!hideNotes && set.notes && (
                  <div className="mt-2 text-muted">
                    <em>{set.notes}</em>
                  </div>
                )}
                {children && children(set, setIndex)}
              </div>
            ))}
          </Card.Body>
        </Card>
      ))}
    </div>
  )
}
