import { Card, Badge } from 'react-bootstrap'
import { useNavigate } from 'react-router-dom'
import { getSetTypeDisplayName } from '../../utils/setTypeUtils'
import { formatRelativeTime } from '../../utils/dateUtils'
import { Lane } from '../../graphql/generated/graphql'
import type { Set, SetDog, Dog } from '../../graphql/generated/graphql'
import DogBadge from '../DogBadge'
import './SetViewOnly.css'

interface SetDisplayBaseProps {
  sets: Set[]
  twoColumns?: boolean
  defaultLocationName?: string
  showTrainingLevels?: boolean
  clickableDogBadges?: boolean
  smallHeader?: boolean
  hideNotes?: boolean
  practiceScheduledAt?: string | null
  clickableSets?: boolean
  practiceId?: string
  children?: (set: Set, setIndex: number) => React.ReactNode
}

export function SetDisplayBase({ sets, twoColumns = false, defaultLocationName, showTrainingLevels = false, clickableDogBadges = false, smallHeader = false, hideNotes = false, practiceScheduledAt, clickableSets = false, practiceId, children }: SetDisplayBaseProps) {
  const navigate = useNavigate()

  const handleDogBadgeClick = (dog: Dog, event: React.MouseEvent) => {
    if (clickableDogBadges) {
      event.stopPropagation()
      navigate(`/dogs/${dog.id}`)
    }
  }

  const handleSetClick = (set: Set) => {
    if (clickableSets && practiceId) {
      navigate(`/practices/${practiceId}/sets?focusSet=${set.id}`)
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
          }, {} as Record<string, Array<Set>>)
      ).map(([index, sets]) => (
        <Card
          key={index}
          className={`w-100 ${clickableSets ? 'clickable-card cur-point' : ''}`}
          onClick={clickableSets ? () => handleSetClick(sets[0]) : undefined}
        >
          <Card.Header className="d-flex justify-content-between align-items-center">
            <div className={`mb-0 ${smallHeader ? '' : 'fs-5'}`}>
              {practiceScheduledAt && (
                <span className="text-muted me-3">{formatRelativeTime(practiceScheduledAt)}</span>
              )}
              <span className="fw-normal">Set {index}{sets[0].type ? ' -' : ''}</span>
              {sets[0].type && (
                <span className="ms-2 fw-bold">
                  {sets[0].typeCustom || getSetTypeDisplayName(sets[0].type)}
                </span>
              )}
            </div>
            <div className="text-end">
              {sets.some((set: Set) => set.isWarmup) && (
                <Badge bg="info" className="text-dark">Warmup</Badge>
              )}
            </div>
          </Card.Header>
          <Card.Body>
            {sets.map((set: any, setIndex: number) => (
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
                      const hasDogsInLeftLane = set.dogs.some((d: SetDog) => d.lane === Lane.Left)
                      const hasDogsInRightLane = set.dogs.some((d: SetDog) => d.lane === Lane.Right)
                      const hasDogsInBothLanes = hasDogsInLeftLane && hasDogsInRightLane

                      if (isDoubleLane && hasDogsInBothLanes) {
                        return [Lane.Left, Lane.Right].map(lane => {
                          const laneDogs = set.dogs.filter((d: SetDog) => d.lane === lane)

                          return (
                            <div key={lane} className={`lane-column ${lane === Lane.Left ? 'left' : 'right'}`}>
                              <div className={`lane-dogs ${laneDogs.length < 5 ? 'force-wrap' : ''} ${lane === Lane.Right ? 'justify-content-end' : ''}`}>
                                {[...laneDogs]
                                  .sort((a, b) => a.index - b.index)
                                  .map((setDog) => {
                                    if (setDog.dog) {
                                      return (
                                        <DogBadge
                                          key={setDog.id}
                                          dog={setDog.dog}
                                          bgByTrainingLevel={showTrainingLevels}
                                          clickable={clickableDogBadges}
                                          onClick={handleDogBadgeClick}
                                        />
                                      )
                                    }
                                  })}
                              </div>
                            </div>
                          )
                        })
                      } else {
                        const allDogs = set.dogs.filter((d: SetDog) => d.lane === null || d.lane === Lane.Left || d.lane === Lane.Right)
                        return (
                          <div key="single" className="single-lane">
                            <div className={`lane-dogs ${allDogs.length < 5 ? 'force-wrap' : ''}`}>
                              {[...allDogs]
                                .sort((a, b) => a.index - b.index)
                                .map((setDog) => {
                                  if (setDog.dog) {
                                    return (
                                      <DogBadge
                                        key={setDog.id}
                                        dog={setDog.dog}
                                        bgByTrainingLevel={showTrainingLevels}
                                        clickable={clickableDogBadges}
                                        onClick={handleDogBadgeClick}
                                      />
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
