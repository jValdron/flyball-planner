import { useState, useMemo, useRef, useEffect } from 'react'
import { Button, Form, Card, Spinner, Badge, Alert } from 'react-bootstrap'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent, DragOverEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { DragProvider, useDrag } from '../../contexts/DragContext'
import { useMutation } from '@apollo/client'
import { UpdateSets, DeleteSets } from '../../graphql/sets'
import { SetType, AttendanceStatus, Lane, DogStatus } from '../../graphql/generated/graphql'
import { GripVertical, PlusLg, Trash, Journal, Arrow90degLeft } from 'react-bootstrap-icons'
import { SaveSpinner } from '../SaveSpinner'
import { useClub } from '../../contexts/ClubContext'
import { usePractice } from '../../contexts/PracticeContext'
import type { UpdateSetsMutation, DeleteSetsMutation, Dog, SetDog, Location } from '../../graphql/generated/graphql'
import { DogsPicker } from '../DogsPicker'
import { SetTypeAutocomplete } from './SetTypeAutocomplete'
import { LocationSelector } from './LocationSelector'
import { useTheme } from '../../contexts/ThemeContext'
import type { ValidationError } from '../../services/practiceValidation'

interface DogWithSetCount extends Dog {
  setCount: number
}

interface PracticeSetProps {
  practiceId: string
  disabled: boolean
  isLocked?: boolean
  validationErrors?: ValidationError[]
  focusSetId?: string | null
}

interface SortableSetProps {
  set: NonNullable<ReturnType<typeof usePractice>['sets'][0]>
  onDelete: (id: string) => void
  onSetTypeChange: (id: string, type: SetType | null, typeCustom: string | null) => void
  onSetDogsChange?: (setId: string, dogs: Partial<SetDog>[]) => void
  onSetNotesChange?: (setId: string, notes: string) => void
  onInsertAbove?: (setId: string) => void
  availableDogs: DogWithSetCount[]
  otherLocations: Location[]
  defaultLocation?: Location | null
  disabled?: boolean
  isLocked?: boolean
  dogsWithValidationIssues?: Set<string>
  validationErrors?: ValidationError[]
  inputRef?: React.RefObject<HTMLInputElement | null>
  getValidationErrorsForSet?: (setId: string) => ValidationError[]
  showNotes?: boolean
  isDeleting?: boolean
}

// Component that uses drag context for cross-picker operations
function DogsPickerWithDrag({
  lane,
  set,
  availableDogs,
  disabled,
  isLocked,
  dogsWithValidationIssues,
  validationErrors,
  getValidationErrorsForSet,
  onDogsChange
}: {
  lane: Lane | null
  set: NonNullable<ReturnType<typeof usePractice>['sets'][0]>
  availableDogs: DogWithSetCount[]
  disabled: boolean
  isLocked?: boolean
  dogsWithValidationIssues?: Set<string>
  validationErrors?: ValidationError[]
  getValidationErrorsForSet?: (setId: string) => ValidationError[]
  onDogsChange: (lane: Lane | null, dogs: Partial<SetDog>[]) => void
}) {
  const { dragOverPicker } = useDrag()

  const getDogsForLane = (lane: Lane | null) => {
    return set.dogs.filter(dog => dog.lane === lane)
  }

  const availableDogsForLane = useMemo(() => {
    const dogsUsedInOtherLanes = new Set<string>()
    set.dogs.forEach(dog => {
      if (dog.lane !== lane) {
        dogsUsedInOtherLanes.add(dog.dogId)
      }
    })
    return availableDogs.filter(dog => !dogsUsedInOtherLanes.has(dog.id))
  }, [set.dogs, lane, availableDogs])

  const pickerId = `${set.id}-${lane || 'single'}`

  return (
    <div key={lane ?? 'single'} className="col-6">
      <DogsPicker
        value={getDogsForLane(lane).map(sd => {
          const dog = availableDogs.find(d => d.id === sd.dogId)
          if (!dog) return null
          return {
            ...sd,
            dog
          }
        }).filter(Boolean) as unknown as Array<SetDog>}
        onChange={setDogs => onDogsChange(lane, setDogs)}
        availableDogs={availableDogsForLane}
        placeholder={lane ? `Add dog to ${lane} lane` : 'Add dog'}
        disabled={disabled}
        isLocked={isLocked}
        dogsWithValidationIssues={dogsWithValidationIssues}
        validationErrors={validationErrors}
        getValidationErrorsForSet={getValidationErrorsForSet}
        currentSetId={set.id}
        pickerId={pickerId}
        isDragOver={dragOverPicker === pickerId}
      />
    </div>
  )
}

function SortableSet({
  set,
  onDelete,
  onSetTypeChange,
  availableDogs,
  onSetDogsChange,
  onSetNotesChange,
  otherLocations,
  defaultLocation,
  disabled = false,
  isLocked = false,
  dogsWithValidationIssues = new Set<string>(),
  validationErrors,
  inputRef,
  getValidationErrorsForSet,
  showNotes = false,
  isDeleting = false
}: SortableSetProps) {
  const [notesValue, setNotesValue] = useState<string>(set.notes ?? '')

  useEffect(() => {
    setNotesValue(set.notes ?? '')
  }, [set.id, set.notes])
  const handleDogsChange = (lane: Lane | null, setDogs: Partial<SetDog>[]) => {
    const updatedLaneDogs: Partial<SetDog>[] = setDogs.map((setDog, idx) => ({
      dogId: setDog.dogId,
      index: idx + 1,
      lane,
    }))
    const otherLaneDogs: Partial<SetDog>[] = set.dogs.filter(d => d.lane !== lane).map(dog => ({
      dogId: dog.dogId,
      index: dog.index,
      lane: dog.lane,
    }))
    const updatedDogs = [...otherLaneDogs, ...updatedLaneDogs]
    onSetDogsChange?.(set.id, updatedDogs)
  }

  const hasCustomLocation = set.locationId && set.locationId !== defaultLocation?.id
  const customLocation = hasCustomLocation ? otherLocations.find(l => l.id === set.locationId) : null
  const setLocation = customLocation || defaultLocation || { id: '', name: '', isDefault: false, isDoubleLane: false }

  const handleLocationRemove = () => {
    onDelete(set.id)
  }

  return (
    <div>
      {customLocation && (
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="mb-0">{customLocation.name}</h6>
          {!isLocked && (
            <Button variant="outline-danger" size="sm" className="d-flex align-items-center" onClick={handleLocationRemove} disabled={disabled || isDeleting}>
              {isDeleting ? <Spinner size="sm" /> : <Trash />}
            </Button>
          )}
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <Form.Group className="flex-grow-1">
          <SetTypeAutocomplete
            value={set.typeCustom ? SetType.Custom : (set.type ?? null)}
            typeCustom={set.typeCustom ?? null}
            onChange={(type, typeCustom) => onSetTypeChange(set.id, type, typeCustom)}
            disabled={disabled}
            inputRef={inputRef}
          />
        </Form.Group>
      </div>

      <DogsSection
        set={set}
        availableDogs={availableDogs}
        onDogsChange={handleDogsChange}
        location={setLocation}
        disabled={disabled}
        isLocked={isLocked}
        dogsWithValidationIssues={dogsWithValidationIssues}
        validationErrors={validationErrors}
        getValidationErrorsForSet={getValidationErrorsForSet}
      />

      {(showNotes || (set.notes && set.notes.trim().length > 0)) && (
        <div className="mt-3">
          <Form.Group controlId={`set-notes-${set.id}`}>
            <Form.Control
              as="textarea"
              rows={3}
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              onBlur={() => onSetNotesChange?.(set.id, notesValue)}
              placeholder="Add notes for this set"
              disabled={disabled}
            />
          </Form.Group>
        </div>
      )}
    </div>
  )
}

interface DogsSectionProps {
  set: NonNullable<ReturnType<typeof usePractice>['sets'][0]>
  availableDogs: DogWithSetCount[]
  onDogsChange: (lane: Lane | null, setDogs: Partial<SetDog>[]) => void
  location: { id: string; name: string; isDefault: boolean; isDoubleLane: boolean }
  disabled: boolean
  isLocked: boolean
  dogsWithValidationIssues?: Set<string>
  validationErrors?: ValidationError[]
  getValidationErrorsForSet?: (setId: string) => ValidationError[]
}

function DogsSection({ set, availableDogs, onDogsChange, location, disabled, isLocked, dogsWithValidationIssues, validationErrors, getValidationErrorsForSet }: DogsSectionProps) {
  const lanes = location.isDoubleLane ? [Lane.Left, Lane.Right] : [null]

  return (
    <div className="row g-2">
      {lanes.map(lane => (
        <DogsPickerWithDrag
          key={lane ?? 'single'}
          lane={lane}
          set={set}
          availableDogs={availableDogs}
          disabled={disabled}
          isLocked={isLocked}
          dogsWithValidationIssues={dogsWithValidationIssues}
          validationErrors={validationErrors}
          getValidationErrorsForSet={getValidationErrorsForSet}
          onDogsChange={onDogsChange}
        />
      ))}
    </div>
  )
}

interface SortableGroupProps {
  group: { index: number; sets: NonNullable<ReturnType<typeof usePractice>['sets']> }
  onDelete: (id: string) => void
  onDeleteGroup: (index: number) => void
  onSetTypeChange: (id: string, type: SetType | null, typeCustom: string | null) => void
  onSetDogsChange?: (setId: string, dogs: Partial<SetDog>[]) => void
  onSetNotesChange?: (setId: string, notes: string) => void
  onInsertAbove?: (setId: string) => void
  onWarmupChange?: (index: number, isWarmup: boolean) => void
  onLocationAdd?: (locationId: string, index: number) => void
  availableDogs: DogWithSetCount[]
  otherLocations: Location[]
  defaultLocation?: Location | null
  disabled?: boolean
  isLocked?: boolean
  validationErrors?: ValidationError[]
  getSetTypeRef: (setId: string) => React.RefObject<HTMLInputElement | null>
  getDogsWithValidationIssuesForSet: (setId: string) => Set<string>
  getValidationErrorsForSet: (setId: string) => ValidationError[]
  isGroupNotesOpen: boolean
  onShowGroupNotes: (groupIndex: number) => void
  isDeletingGroup?: boolean
  deletingSetIds: Set<string>
}

function SortableGroup({
  group,
  onDelete,
  onDeleteGroup,
  onSetTypeChange,
  availableDogs,
  onSetDogsChange,
  onSetNotesChange,
  onInsertAbove,
  onWarmupChange,
  onLocationAdd,
  otherLocations,
  defaultLocation,
  disabled = false,
  isLocked = false,
  validationErrors,
  getSetTypeRef,
  getDogsWithValidationIssuesForSet,
  getValidationErrorsForSet,
  isGroupNotesOpen,
  onShowGroupNotes,
  isDeletingGroup = false,
  deletingSetIds
}: SortableGroupProps) {
  const { isDark } = useTheme()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.index.toString(), disabled })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const usedLocationIdsInGroup = new Set(group.sets.map(set => set.locationId).filter(Boolean))

  const availableLocationsForThisSet = otherLocations.filter(location =>
    !usedLocationIdsInGroup.has(location.id) || location.id === group.sets[0].locationId
  )

  const handleLocationAdd = (locationId: string) => {
    onLocationAdd?.(locationId, group.index)
  }

  return (
    <div className="mb-3" ref={setNodeRef} style={style}>
      <div className="d-flex gap-0">
        <Card className="flex-shrink-0 rounded-end-0 border-end-0" style={{ width: '80px' }}>
          <Card.Body
            {...attributes}
            {...listeners}
            className={`${isDark ? 'bg-dark' : 'bg-light'} cursor-grab d-flex align-items-center justify-content-center h-100 ${disabled ? '' : 'cursor-grab'}`}>
            <h5 className="text-nowrap mb-0">
              {!disabled && <GripVertical />}
              <span>{group.index}</span>
            </h5>
          </Card.Body>
        </Card>

        <Card className="flex-grow-1 rounded-start-0">
          <Card.Body>
            {group.sets.map((set, idx) => {
              const dogsUsedInOtherSetsInGroup = new Set<string>()
              group.sets.forEach(otherSet => {
                if (otherSet.id !== set.id) {
                  otherSet.dogs.forEach(setDog => {
                    dogsUsedInOtherSetsInGroup.add(setDog.dogId)
                  })
                }
              })

              const availableDogsForThisSet = availableDogs.filter(dog => !dogsUsedInOtherSetsInGroup.has(dog.id))

              return (
                <div key={set.id} className={idx > 0 ? "mt-4 pt-4 border-top" : ""}>
                  <SortableSet
                    set={set}
                    onDelete={onDelete}
                    onSetTypeChange={onSetTypeChange}
                    onSetDogsChange={onSetDogsChange}
                    onSetNotesChange={onSetNotesChange}
                    onInsertAbove={onInsertAbove}
                    availableDogs={availableDogsForThisSet}
                    otherLocations={otherLocations}
                    defaultLocation={defaultLocation}
                    disabled={disabled}
                    isLocked={isLocked}
                    dogsWithValidationIssues={getDogsWithValidationIssuesForSet(set.id)}
                    validationErrors={validationErrors}
                    inputRef={getSetTypeRef(set.id)}
                    getValidationErrorsForSet={getValidationErrorsForSet}
                    showNotes={isGroupNotesOpen || (set.notes && set.notes.trim().length > 0) || false}
                    isDeleting={deletingSetIds.has(set.id)}
                  />
                </div>
              )
            })}
          </Card.Body>
          <Card.Footer className="d-flex rounded-start-0">
            <div className="d-flex align-items-center me-auto">
              <Form.Check
                type="checkbox"
                id={`warmup-${group.index}`}
                label="Warmup"
                checked={group.sets.some(set => set.isWarmup)}
                onChange={(e) => onWarmupChange?.(group.index, e.target.checked)}
                disabled={disabled}
                className="me-3"
              />
            </div>
            {!isLocked && (
              <div className="d-flex gap-2">
                {availableLocationsForThisSet.length > 0 && (
                  <LocationSelector
                    availableLocations={availableLocationsForThisSet}
                    onSelect={handleLocationAdd}
                    disabled={disabled}
                  />
                )}
                {!isGroupNotesOpen && (
                  <Button
                    variant="outline-info"
                    size="sm"
                    className="text-nowrap d-flex align-items-center"
                    onClick={() => onShowGroupNotes(group.index)}
                    disabled={disabled}
                  >
                    <Journal className="me-1" /> Notes
                  </Button>
                )}
                {group.sets.length > 0 && (
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="d-flex align-items-center"
                    onClick={() => onInsertAbove?.(group.sets[0].id)}
                    disabled={disabled}
                    title="Insert set above"
                  >
                    <Arrow90degLeft />
                  </Button>
                )}
                <Button variant="outline-danger" size="sm" className="text-nowrap d-flex align-items-center" onClick={() => onDeleteGroup(group.index)} disabled={disabled || isDeletingGroup}>
                  {isDeletingGroup ? <Spinner size="sm" className="me-1" /> : <Trash className="me-1" />} Remove
                </Button>
              </div>
            )}
          </Card.Footer>
        </Card>
      </div>
    </div>
  )
}

export function PracticeSet({ practiceId, disabled, isLocked = false, validationErrors, focusSetId }: PracticeSetProps) {
  const { dogs, locations } = useClub()
  const { attendances, sets } = usePractice()
  const [isSaving, setIsSaving] = useState(false)
  const [isAddingSet, setIsAddingSet] = useState(false)
  const [newlyCreatedSetIds, setNewlyCreatedSetIds] = useState<Set<string>>(new Set())
  const [deletingSetIds, setDeletingSetIds] = useState<Set<string>>(new Set())
  const [deletingGroupIndices, setDeletingGroupIndices] = useState<Set<number>>(new Set())
  const setTypeRefs = useRef<Map<string, React.RefObject<HTMLInputElement | null>>>(new Map())
  const [openNotesGroupIndices, setOpenNotesGroupIndices] = useState<Set<number>>(new Set())
  const [activeDragItem, setActiveDragItem] = useState<{ setDog: SetDog; pickerId: string; targetPickerId?: string } | null>(null)

  const [updateSets] = useMutation<UpdateSetsMutation>(UpdateSets)
  const [deleteSets] = useMutation<DeleteSetsMutation>(DeleteSets)

  const getValidationErrorsForSet = (setId: string) => {
    if (!validationErrors) return []

    return validationErrors.filter(error => {
      if (error.code === 'SAME_HANDLER_IN_SET' && error.extra?.conflicts) {
        return error.extra.conflicts.some((conflict: any) => conflict.setId === setId)
      }
      if (error.code === 'BACK_TO_BACK_HANDLERS' && error.extra?.backToBackHandlers) {
        return error.extra.backToBackHandlers.some((handler: any) => {
          if (handler.dogIds) {
            const set = sets.find(s => s.id === setId)
            if (set) {
              return set.dogs.some(setDog => handler.dogIds.includes(setDog.dogId))
            }
          }
          return false
        })
      }
      if (error.code === 'INSUFFICIENT_DOG_REST' && error.extra?.insufficientRest) {
        const set = sets.find(s => s.id === setId)
        if (set) {
          return error.extra.insufficientRest.some((dogInfo: any) => {
            return dogInfo.setGaps.some((gap: any) => {
              const setIndex = set.index
              return gap.from === setIndex || gap.to === setIndex
            })
          })
        }
      }
      if (error.code === 'SUBOPTIMAL_DOG_REST' && error.extra?.suboptimalRest) {
        const set = sets.find(s => s.id === setId)
        if (set) {
          return error.extra.suboptimalRest.some((dogInfo: any) => {
            return dogInfo.setGaps.some((gap: any) => {
              const setIndex = set.index
              return gap.from === setIndex || gap.to === setIndex
            })
          })
        }
      }
      return false
    })
  }

  // Helper function to get dog IDs with validation issues for a specific set
  const getDogsWithValidationIssuesForSet = (setId: string) => {
    const dogIdsWithIssues = new Set<string>()
    const setValidationErrors = getValidationErrorsForSet(setId)

    setValidationErrors.forEach(error => {
      if (error.code === 'SAME_HANDLER_IN_SET' && error.extra?.conflicts) {
        error.extra.conflicts.forEach((conflict: any) => {
          if (conflict.setId === setId && conflict.dogIds) {
            conflict.dogIds.forEach((dogId: string) => dogIdsWithIssues.add(dogId))
          }
        })
      }
      if (error.code === 'BACK_TO_BACK_HANDLERS' && error.extra?.backToBackHandlers) {
        error.extra.backToBackHandlers.forEach((handler: any) => {
          if (handler.dogIds && handler.setIds) {
            if (handler.setIds.includes(setId)) {
              const set = sets.find(s => s.id === setId)
              if (set) {
                set.dogs.forEach(setDog => {
                  if (handler.dogIds.includes(setDog.dogId)) {
                    dogIdsWithIssues.add(setDog.dogId)
                  }
                })
              }
            }
          }
        })
      }
      if (error.code === 'INSUFFICIENT_DOG_REST' && error.extra?.insufficientRest) {
        error.extra.insufficientRest.forEach((dogInfo: any) => {
          dogIdsWithIssues.add(dogInfo.dog.id)
        })
      }
      if (error.code === 'SUBOPTIMAL_DOG_REST' && error.extra?.suboptimalRest) {
        error.extra.suboptimalRest.forEach((dogInfo: any) => {
          dogIdsWithIssues.add(dogInfo.dog.id)
        })
      }
    })

    return dogIdsWithIssues
  }

  const availableDogs = useMemo(() => {
    const dogSetCounts = new Map<string, number>()
    sets.forEach(set => {
      if (set.isWarmup) return

      set.dogs.forEach(setDog => {
        const currentCount = dogSetCounts.get(setDog.dogId) || 0
        dogSetCounts.set(setDog.dogId, currentCount + 1)
      })
    })

    return dogs
      .filter(dog => {
        const attendance = attendances.find(a => a.dogId === dog.id)
        return attendance && attendance.attending !== AttendanceStatus.NotAttending && dog.status === DogStatus.Active
      })
      .map(dog => {
        const attendance = attendances.find(a => a.dogId === dog.id)
        return {
          ...dog,
          setCount: dogSetCounts.get(dog.id) || 0,
          attendanceStatus: attendance?.attending
        }
      })
  }, [attendances, sets, dogs])

  const handleSetReorder = async (event: DragEndEvent) => {
    if (disabled) return

    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldGroupIndex = parseInt(active.id as string)
    const newGroupIndex = parseInt(over.id as string)

    if (isNaN(oldGroupIndex) || isNaN(newGroupIndex)) return

    const setsToUpdate = sets.filter(set => set.index === oldGroupIndex)
    const targetIndex = newGroupIndex

    const updates: Array<{ id: string; index: number }> = []

    setsToUpdate.forEach(set => {
      updates.push({ id: set.id, index: targetIndex })
    })

    sets.forEach(set => {
      if (set.index !== oldGroupIndex) {
        let newIndex = set.index
        if (oldGroupIndex < newGroupIndex && set.index > oldGroupIndex && set.index <= newGroupIndex) {
          newIndex = set.index - 1
        } else if (oldGroupIndex > newGroupIndex && set.index >= newGroupIndex && set.index < oldGroupIndex) {
          newIndex = set.index + 1
        }
        if (newIndex !== set.index) {
          updates.push({ id: set.id, index: newIndex })
        }
      }
    })

    if (updates.length > 0) {
      try {
        setIsSaving(true)
        await updateSets({
          variables: {
            updates: updates
          }
        })
      } catch (err) {
        console.error('Error updating sets during reorder:', err)
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleSetUpdate = async (setId: string, updates: Partial<{ index: number; type: SetType | null; typeCustom: string | null; notes: string | null; isWarmup: boolean; dogs: Partial<SetDog>[] }>) => {
    try {
      setIsSaving(true)

      // Transform dogs array to only include fields expected by SetDogUpdate
      const transformedUpdates = { ...updates }
      if (updates.dogs) {
        transformedUpdates.dogs = updates.dogs.map(dog => ({
          dogId: dog.dogId,
          lane: dog.lane,
          index: dog.index
        }))
      }

      await updateSets({
        variables: {
          updates: [{
            id: setId,
            ...transformedUpdates
          }]
        }
      })
    } catch (err) {
      console.error('Error updating set:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddSet = async () => {
    const defaultLocationSets = sets.filter(set => set.locationId === defaultLocation?.id)
    const maxIndex = defaultLocationSets.length > 0 ? Math.max(...defaultLocationSets.map(set => set.index)) : 0
    const newIndex = maxIndex + 1

    try {
      setIsAddingSet(true)
      const result = await updateSets({
        variables: {
          updates: [{
            practiceId,
            locationId: defaultLocation?.id,
            index: newIndex,
            dogs: []
          }]
        }
      })

      if (result.data?.updateSets) {
        const newSetId = result.data.updateSets[0]?.id
        if (newSetId) {
          setNewlyCreatedSetIds(prev => new Set([...prev, newSetId]))
        }
      }
    } catch (err) {
      console.error('Error creating set:', err)
      setIsAddingSet(false)
    }
  }

  const handleDeleteSet = async (setId: string) => {
    try {
      setDeletingSetIds(prev => new Set([...prev, setId]))
      await deleteSets({
        variables: { ids: [setId] }
      })
    } catch (err) {
      console.error('Error deleting set:', err)
    } finally {
      setDeletingSetIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(setId)
        return newSet
      })
    }
  }

  const handleDeleteGroup = async (index: number) => {
    const setsToDelete = sets.filter(set => set.index === index)
    const setIds = setsToDelete.map(set => set.id)

    try {
      setDeletingGroupIndices(prev => new Set([...prev, index]))
      await deleteSets({
        variables: { ids: setIds }
      })
    } catch (err) {
      console.error('Error deleting set group:', err)
    } finally {
      setDeletingGroupIndices(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
    }
  }

  const handleSetTypeChange = async (setId: string, type: SetType | null, typeCustom: string | null) => {
    await handleSetUpdate(setId, { type, typeCustom })
  }

  const handleDogsChange = async (setId: string, dogs: Partial<SetDog>[]) => {
    await handleSetUpdate(setId, { dogs })
  }

  const handleSetNotesChange = async (setId: string, notes: string) => {
    await handleSetUpdate(setId, { notes })
  }

  const handleWarmupChange = async (index: number, isWarmup: boolean) => {
    const setsToUpdate = sets.filter(set => set.index === index)
    for (const set of setsToUpdate) {
      await handleSetUpdate(set.id, { isWarmup })
    }
  }

  const handleLocationAdd = async (locationId: string, index: number) => {
    try {
      setIsSaving(true)
      await updateSets({
        variables: {
          updates: [{
            practiceId,
            locationId: locationId,
            index: index,
            dogs: []
          }]
        }
      })
    } catch (err) {
      console.error('Error creating set with location:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleInsertAbove = async (setId: string) => {
    const currentSet = sets.find(set => set.id === setId)
    if (!currentSet) return

    const newIndex = currentSet.index
    const updates: Array<{
      id: string;
      index: number;
    }> = []

    try {
      setIsSaving(true)

      // Reorder existing sets - increment all sets with index >= currentSet.index
      sets.forEach(set => {
        if (set.index >= currentSet.index) {
          updates.push({ id: set.id, index: set.index + 1 })
        }
      })

      // Add the new set at the current set's index (it will take that position)
      updates.push({
        id: practiceId,
        index: newIndex,
      })

      if (updates.length > 0) {
        const result = await updateSets({
          variables: {
            updates: updates
          }
        })

        // Track the newly created set for focusing
        if (result.data?.updateSets) {
          const newSetId = result.data.updateSets[result.data.updateSets.length - 1]?.id
          if (newSetId) {
            setNewlyCreatedSetIds(prev => new Set([...prev, newSetId]))
          }
        }
      }
    } catch (err) {
      console.error('Error inserting set above:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const defaultLocation = useMemo(() => locations.find(l => l.isDefault), [locations])

  const otherLocations = useMemo(() =>
    locations.filter(location => !location.isDefault),
    [locations]
  )

  // Group sets by index to show them together visually
  const groupedSets = useMemo(() => {
    const groups = new Map<number, NonNullable<ReturnType<typeof usePractice>['sets']>>()

    sets.forEach(set => {
      if (!groups.has(set.index)) {
        groups.set(set.index, [])
      }
      groups.get(set.index)!.push(set)
    })

    return Array.from(groups.entries()).map(([index, sets]) => ({
      index,
      sets: sets.sort((a, b) => {
        // Sort by location: default first, then others alphabetically
        const aIsDefault = a.locationId === defaultLocation?.id
        const bIsDefault = b.locationId === defaultLocation?.id
        if (aIsDefault && !bIsDefault) return -1
        if (!aIsDefault && bIsDefault) return 1
        if (aIsDefault && bIsDefault) return 0

        const aLocation = otherLocations.find(l => l.id === a.locationId)
        const bLocation = otherLocations.find(l => l.id === b.locationId)
        return (aLocation?.name || '').localeCompare(bLocation?.name || '')
      })
    }))
  }, [sets, defaultLocation?.id, otherLocations])

  // Initialize open notes per group if any set within has notes
  useEffect(() => {
    const groupsWithNotes = new Set<number>()
    groupedSets.forEach(group => {
      if (group.sets.some(s => (s.notes || '').trim().length > 0)) {
        groupsWithNotes.add(group.index)
      }
    })
    setOpenNotesGroupIndices(prev => {
      const next = new Set(prev)
      groupsWithNotes.forEach(idx => next.add(idx))
      return next
    })
  }, [groupedSets])

  // Helper function to get or create a ref for a set
  const getSetTypeRef = (setId: string) => {
    if (!setTypeRefs.current.has(setId)) {
      setTypeRefs.current.set(setId, { current: null })
    }
    return setTypeRefs.current.get(setId)!
  }

  // Helper function to focus on a set
  const focusOnSet = (setId: string, delay: number = 100) => {
    const ref = setTypeRefs.current.get(setId)
    if (ref?.current) {
      setTimeout(() => {
        ref.current?.focus()
        ref.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        })
      }, delay)
    }
  }

  // Focus newly created sets
  useEffect(() => {
    newlyCreatedSetIds.forEach(setId => {
      focusOnSet(setId, 100)
      setNewlyCreatedSetIds(prev => {
        const newSet = new Set(prev)
        newSet.delete(setId)
        return newSet
      })
    })
  }, [newlyCreatedSetIds, sets])

  // Focus on specific set when focusSetId is provided
  useEffect(() => {
    if (focusSetId && sets.length > 0) {
      focusOnSet(focusSetId, 200)
    }
  }, [focusSetId, sets])

  // Clear adding state when we get any set subscription event
  useEffect(() => {
    if (isAddingSet) {
      // Simple timeout to clear the adding state after a reasonable delay
      // This will be cleared by the subscription event, but provides a fallback
      const timeout = setTimeout(() => {
        setIsAddingSet(false)
      }, 5000) // 5 second fallback

      return () => clearTimeout(timeout)
    }
  }, [isAddingSet])

  // Clear adding state when sets array changes (subscription event)
  useEffect(() => {
    if (isAddingSet) {
      setIsAddingSet(false)
    }
  }, [sets])

  const handleDogMove = async (dog: SetDog, fromPicker: string, toPicker: string) => {
    const fromParts = fromPicker.split('-')
    const toParts = toPicker.split('-')

    const fromSetId = fromParts.slice(0, -1).join('-')
    const toSetId = toParts.slice(0, -1).join('-')
    const toLane = toParts[toParts.length - 1]

    if (fromSetId === toSetId) {
      const set = sets.find(s => s.id === fromSetId)
      if (!set) return

      const updatedDogs = set.dogs.map(d =>
        d.id === dog.id
          ? { ...d, lane: toLane === 'single' ? null : toLane as Lane }
          : d
      )

      const leftLaneDogs = updatedDogs.filter(d => d.lane === 'Left').map((d, index) => ({ ...d, index: index + 1 }))
      const rightLaneDogs = updatedDogs.filter(d => d.lane === 'Right').map((d, index) => ({ ...d, index: index + 1 }))
      const singleLaneDogs = updatedDogs.filter(d => d.lane === null).map((d, index) => ({ ...d, index: index + 1 }))

      const finalDogs = [...leftLaneDogs, ...rightLaneDogs, ...singleLaneDogs].map(({ dog, ...setDog }) => setDog)

      try {
        await handleDogsChange(fromSetId, finalDogs)
      } catch (error) {
        console.error('Failed to move dog to different lane:', error)
      }
      return
    }

    const fromSet = sets.find(s => s.id === fromSetId)
    const toSet = sets.find(s => s.id === toSetId)

    if (!fromSet || !toSet) return

    const updatedFromSetDogs = fromSet.dogs.filter(d => d.id !== dog.id)

    const newDog = {
      ...dog,
      lane: toLane === 'single' ? null : toLane as Lane,
      index: toSet.dogs.length + 1
    }
    const updatedToSetDogs = [...toSet.dogs, newDog]

    const updates = [
      { id: fromSetId, dogs: updatedFromSetDogs },
      { id: toSetId, dogs: updatedToSetDogs }
    ]

    try {
      await updateSets({
        variables: {
          updates: updates.map(update => ({
            id: update.id,
            dogs: update.dogs.map(d => ({
              dogId: d.dogId,
              lane: d.lane,
              index: d.index
            }))
          }))
        }
      })
    } catch (error) {
      console.error('Failed to move dog between sets:', error)
    }
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event

    if (typeof active.id === 'string' && active.id.includes('-') && active.data.current?.type === 'dog') {
      const activeData = active.data.current
      if (activeData?.setDog && activeData?.pickerId) {
        setActiveDragItem({ setDog: activeData.setDog, pickerId: activeData.pickerId })
      }
    }
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event

    if (typeof active.id === 'string' && active.id.includes('-') && active.data.current?.type === 'dog') {
      const activeData = active.data.current
      const overData = over?.data.current

      if (activeData?.pickerId && overData?.pickerId && activeData.pickerId !== overData.pickerId) {
        setActiveDragItem(prev => prev ? { ...prev, targetPickerId: overData.pickerId } : null)
      } else {
        setActiveDragItem(prev => prev ? { ...prev, targetPickerId: undefined } : null)
      }
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    setActiveDragItem(null)

    if (!over) return

    if (typeof active.id === 'string' && !isNaN(parseInt(active.id)) && typeof over.id === 'string' && !isNaN(parseInt(over.id))) {
      handleSetReorder(event)
      return
    }

    if (typeof active.id === 'string' && active.id.includes('-') && active.data.current?.type === 'dog') {
      const activeData = active.data.current
      const overData = over.data.current

      if (activeData?.pickerId) {
        if (overData?.pickerId && overData.pickerId !== activeData.pickerId) {
          // Cross-picker dog movement - handled by handleDogMove
          handleDogMove(activeData.setDog, activeData.pickerId, overData.pickerId)
        } else if (overData?.pickerId && overData.pickerId === activeData.pickerId) {
          const pickerId = activeData.pickerId
          const [setId] = pickerId.split('-')
          const set = sets.find(s => s.id === setId)

          if (set) {
            const oldIndex = set.dogs.findIndex((_, index) => `${set.dogs[index].id}-${index}` === active.id)
            const newIndex = set.dogs.findIndex((_, index) => `${set.dogs[index].id}-${index}` === over.id)

            if (oldIndex !== -1 && newIndex !== -1) {
              const newDogs = [...set.dogs]
              const [removed] = newDogs.splice(oldIndex, 1)
              newDogs.splice(newIndex, 0, removed)

              const updatedDogs = newDogs.map(({ dog, ...setDog }, index) => ({
                ...setDog,
                index: index + 1
              }))

              handleDogsChange(setId, updatedDogs)
            }
          }
        }
      }
    }
  }

  return (
    <DragProvider onDogMove={handleDogMove}>
      <div>
        {groupedSets.length === 0 ? (
          <Alert variant="info">
            No sets for this practice.{' '}
            {!isLocked ? (
              <Button
                variant="link"
                className="p-0 align-baseline"
                onClick={handleAddSet}
                disabled={disabled || isAddingSet}
              >
                {isAddingSet ? <Spinner size="sm" className="me-1" /> : null}
                Add a set now.
              </Button>
            ) : (
              <span className="text-muted">Unlock the practice to add a new set.</span>
            )}
          </Alert>
        ) : (
          <DndContext
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={groupedSets.map(group => group.index.toString())}
              strategy={verticalListSortingStrategy}
            >
              {groupedSets.map(group => (
                <SortableGroup
                  key={group.index}
                  group={group}
                  onDelete={handleDeleteSet}
                  onDeleteGroup={handleDeleteGroup}
                  onSetTypeChange={handleSetTypeChange}
                  onSetDogsChange={handleDogsChange}
                  onSetNotesChange={handleSetNotesChange}
                  onInsertAbove={handleInsertAbove}
                  onWarmupChange={handleWarmupChange}
                  onLocationAdd={handleLocationAdd}
                  availableDogs={availableDogs}
                  otherLocations={otherLocations}
                  defaultLocation={defaultLocation}
                  disabled={disabled}
                  isLocked={isLocked}
                  validationErrors={validationErrors}
                  getSetTypeRef={getSetTypeRef}
                  getDogsWithValidationIssuesForSet={getDogsWithValidationIssuesForSet}
                  getValidationErrorsForSet={getValidationErrorsForSet}
                  isGroupNotesOpen={openNotesGroupIndices.has(group.index)}
                  onShowGroupNotes={(groupIndex) => setOpenNotesGroupIndices(prev => new Set([...prev, groupIndex]))}
                  isDeletingGroup={deletingGroupIndices.has(group.index)}
                  deletingSetIds={deletingSetIds}
                />
              ))}
            </SortableContext>
            <DragOverlay>
              {activeDragItem && activeDragItem.targetPickerId ? (
                <Badge
                  bg="primary"
                  className="fs-6 px-3 py-2 drag-overlay-badge"
                >
                  Move {activeDragItem.setDog.dog.name} to {(() => {
                    const targetParts = activeDragItem.targetPickerId.split('-')
                    const targetSetId = targetParts.slice(0, -1).join('-')
                    const lane = targetParts[targetParts.length - 1]

                    const sourceParts = activeDragItem.pickerId.split('-')
                    const sourceSetId = sourceParts.slice(0, -1).join('-')
                    const isDifferentSet = sourceSetId !== targetSetId

                    let laneName = 'target lane'
                    if (lane === 'single') laneName = 'single lane'
                    else if (lane === 'Left') laneName = 'left lane'
                    else if (lane === 'Right') laneName = 'right lane'

                    if (isDifferentSet) {
                      const targetSet = sets.find(s => s.id === targetSetId)
                      if (targetSet) {
                        return `${laneName} in set ${targetSet.index}`
                      }
                    }

                    return laneName
                  })()}
                </Badge>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
        {!isLocked && (
          <div className="d-flex justify-content-end mb-4">
            <Button
              variant="primary"
              className="text-nowrap d-flex align-items-center"
              onClick={handleAddSet}
              disabled={disabled || isAddingSet}
            >
              {isAddingSet ? <Spinner size="sm" className="me-2" /> : <PlusLg className="me-2" />}
              Add Set
            </Button>
          </div>
        )}
        <SaveSpinner show={isSaving} />
      </div>
    </DragProvider>
  )
}
