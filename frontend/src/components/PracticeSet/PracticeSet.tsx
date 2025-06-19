import { useState, useEffect, useMemo } from 'react'
import { Button, Form, Card } from 'react-bootstrap'
import { DndContext } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useQuery, useMutation } from '@apollo/client'
import { GetSets, UpdateSets, DeleteSet } from '../../graphql/sets'
import { GetLocationsByClub } from '../../graphql/clubs'
import { SetType, AttendanceStatus, Lane } from '../../graphql/generated/graphql'
import { GripVertical, PlusLg, Trash } from 'react-bootstrap-icons'
import { SaveSpinner } from '../SaveSpinner'
import { useClub } from '../../contexts/ClubContext'
import { usePractice } from '../../contexts/PracticeContext'
import type { GetSetsQuery, UpdateSetsMutation, DeleteSetMutation, GetLocationsByClubQuery, PracticeAttendance } from '../../graphql/generated/graphql'
import { DogsPicker } from '../DogsPicker'
import { SetTypeAutocomplete } from './SetTypeAutocomplete'
import { LocationSelector } from './LocationSelector'
import type { Dog, SetDog } from '../../graphql/generated/graphql'

const SAVE_DELAY = 2500

interface DogWithSetCount extends Dog {
  setCount: number
}

interface PracticeSetProps {
  practiceId: string
  isPastPractice: boolean
}

interface SortableSetProps {
  set: GetSetsQuery['sets'][0]
  onDelete: (id: string) => void
  onSetTypeChange: (id: string, type: SetType, typeCustom: string | null) => void
  onSetDogsChange?: (setId: string, dogs: Partial<SetDog>[]) => void
  availableDogs: DogWithSetCount[]
  availableLocations: Array<{ id: string; name: string; isDefault: boolean; isDoubleLane: boolean }>
  defaultLocation?: { id: string; name: string; isDefault: boolean; isDoubleLane: boolean } | null
}

function SortableSet({
  set,
  onDelete,
  onSetTypeChange,
  availableDogs,
  onSetDogsChange,
  availableLocations,
  defaultLocation
}: SortableSetProps) {
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
  const customLocation = hasCustomLocation ? availableLocations.find(l => l.id === set.locationId) : null
  const setLocation = customLocation || defaultLocation || { id: '', name: '', isDefault: false, isDoubleLane: false }

  const handleLocationRemove = () => {
    onDelete(set.id)
  }

  return (
    <div>
      {customLocation && (
        <div className="d-flex align-items-center justify-content-between mb-3">
          <h6 className="mb-0">{customLocation.name}</h6>
          <Button variant="outline-danger" size="sm" onClick={handleLocationRemove}>
            <Trash />
          </Button>
        </div>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <Form.Group className="flex-grow-1">
          <SetTypeAutocomplete
            value={set.typeCustom ?? set.type ?? null}
            typeCustom={set.typeCustom ?? null}
            onChange={(type, typeCustom) => onSetTypeChange(set.id, type, typeCustom)}
          />
        </Form.Group>
      </div>

      <DogsSection
        set={set}
        availableDogs={availableDogs}
        onDogsChange={handleDogsChange}
        location={setLocation}
      />
    </div>
  )
}

type PendingUpdate = { setId?: string, update?: any, delete?: boolean };

function getDisplaySets(setsData: GetSetsQuery | undefined, pendingUpdates: PendingUpdate[]) {
  const pendingDeletes = new Set(pendingUpdates.filter(u => u.delete).map(u => u.setId))
  const pendingCreates = pendingUpdates.filter(u => u.setId && u.setId.startsWith('temp-') && !u.delete)
  const pendingUpdatesMap = Object.fromEntries(
    pendingUpdates.filter(u => u.update && !u.delete && u.setId && !u.setId.startsWith('temp-')).map(u => [u.setId, u.update])
  )

  // Filter out pending creates that have been successfully created on the server
  const serverSets = setsData?.sets || []
  const filteredPendingCreates = pendingCreates.filter(pendingCreate => {
    return !serverSets.some(serverSet =>
      serverSet.index === pendingCreate.update.index &&
      serverSet.locationId === pendingCreate.update.locationId
    )
  })

  return [
    ...(serverSets.filter(set => !pendingDeletes.has(set.id)).map(set => ({
      ...set,
      ...(pendingUpdatesMap[set.id] || {})
    })) as any[]),
    ...filteredPendingCreates.map(u => ({ ...u.update, id: u.setId }))
  ].sort((a, b) => a.index - b.index)
}

interface DogsSectionProps {
  set: GetSetsQuery['sets'][0]
  availableDogs: DogWithSetCount[]
  onDogsChange: (lane: Lane | null, setDogs: Partial<SetDog>[]) => void
  location: { id: string; name: string; isDefault: boolean; isDoubleLane: boolean }
}

function DogsSection({ set, availableDogs, onDogsChange, location }: DogsSectionProps) {
  const getDogsForLane = (lane: Lane | null) => set.dogs.filter(d => d.lane === lane)

  // Determine lanes based on location
  const lanes = location.isDoubleLane ? [Lane.Left, Lane.Right] : [null]

  return (
    <div className="d-flex">
      {lanes.map(lane => {
        const dogsUsedInOtherLanes = new Set<string>()
        set.dogs.forEach(setDog => {
          if (setDog.lane !== lane) {
            dogsUsedInOtherLanes.add(setDog.dogId)
          }
        })

        const availableDogsForLane = availableDogs.filter(dog => !dogsUsedInOtherLanes.has(dog.id))

        return (
          <div key={lane ?? 'single'} className="flex-grow-1 me-2">
            <DogsPicker
              value={getDogsForLane(lane).map(sd => {
                const dog = availableDogs.find(d => d.id === sd.dogId)
                if (!dog) return null
                return {
                  ...sd,
                  dog
                }
              }).filter(Boolean) as any[]}
              onChange={setDogs => onDogsChange(lane, setDogs)}
              availableDogs={availableDogsForLane}
              placeholder={lane ? `Add dog to ${lane} lane` : 'Add dog'}
            />
          </div>
        )
      })}
    </div>
  )
}

interface SortableGroupProps {
  group: { index: number; sets: GetSetsQuery['sets'] }
  onDelete: (id: string) => void
  onDeleteGroup: (index: number) => void
  onSetTypeChange: (id: string, type: SetType, typeCustom: string | null) => void
  onSetDogsChange?: (setId: string, dogs: Partial<SetDog>[]) => void
  onLocationAdd?: (locationId: string, index: number) => void
  availableDogs: DogWithSetCount[]
  availableLocations: Array<{ id: string; name: string; isDefault: boolean; isDoubleLane: boolean }>
  defaultLocation?: { id: string; name: string; isDefault: boolean; isDoubleLane: boolean } | null
}

function SortableGroup({
  group,
  onDelete,
  onDeleteGroup,
  onSetTypeChange,
  availableDogs,
  onSetDogsChange,
  onLocationAdd,
  availableLocations,
  defaultLocation
}: SortableGroupProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: group.index.toString() })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const usedLocationIdsInGroup = new Set(group.sets.map(set => set.locationId).filter(Boolean))

  const availableLocationsForThisSet = availableLocations.filter(location =>
    !usedLocationIdsInGroup.has(location.id) || location.id === group.sets[0].locationId
  )

  const handleLocationAdd = (locationId: string) => {
    onLocationAdd?.(locationId, group.index)
  }

  return (
    <div className="mb-3" ref={setNodeRef} style={style}>
      <div className="d-flex gap-0">
        <Card className="flex-shrink-0 rounded-end-0" style={{ width: 'auto' }}>
          <Card.Body
            {...attributes}
            {...listeners}
            className="bg-light cursor-grab p-4 d-flex align-items-center h-100">
            <h5 className="text-nowrap mb-0">
              <GripVertical />
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
                    availableDogs={availableDogsForThisSet}
                    availableLocations={availableLocations}
                    defaultLocation={defaultLocation}
                  />
                </div>
              )
            })}
          </Card.Body>
          <Card.Footer className="d-flex rounded-start-0">
            <div className="d-flex gap-2 ms-auto">
              {availableLocationsForThisSet.length > 0 && (
                <LocationSelector
                  availableLocations={availableLocationsForThisSet}
                  onSelect={handleLocationAdd}
                />
              )}
              <Button variant="outline-danger" size="sm" className="text-nowrap" onClick={() => onDeleteGroup(group.index)}>
                <Trash /> Remove Set
              </Button>
            </div>
          </Card.Footer>
        </Card>
      </div>
    </div>
  )
}

export function PracticeSet({ practiceId, isPastPractice }: PracticeSetProps) {
  const { selectedClub } = useClub()
  const { attendances, setSets, setIsSetsLoading } = usePractice()
  const [isSaving, setIsSaving] = useState(false)
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([])

  const { data: locationsData, loading: locationsLoading } = useQuery<GetLocationsByClubQuery>(GetLocationsByClub, {
    variables: { clubId: selectedClub?.id! },
    skip: !selectedClub?.id
  })

  const locations = locationsData?.locationsByClub || []
  const defaultLocation = useMemo(() => locations.find(l => l.isDefault), [locations])

  const { data: setsData, loading: setsLoading } = useQuery<GetSetsQuery>(GetSets, {
    variables: {
      practiceId
    },
    skip: !practiceId,
    onCompleted: (data) => {
      setSets(data.sets as any || [])
      setIsSetsLoading(false)
    },
    onError: () => {
      setIsSetsLoading(false)
    }
  })

  useEffect(() => {
    if (practiceId) {
      setIsSetsLoading(true)
    }
  }, [practiceId, setIsSetsLoading])

  const [updateSets] = useMutation<UpdateSetsMutation>(UpdateSets, {
    onCompleted: () => {
      setPendingUpdates([])
    },
    onError: (err) => {
      console.error('Error updating sets:', err)
    }
  })
  const [deleteSet] = useMutation<DeleteSetMutation>(DeleteSet, {
    onCompleted: () => {
      setPendingUpdates([])
    },
    onError: (err) => {
      console.error('Error deleting set:', err)
    }
  })

  const displaySets = useMemo(() => {
    return getDisplaySets(setsData, pendingUpdates)
  }, [setsData, pendingUpdates])

  const availableDogs = useMemo(() => {
    const dogSetCounts = new Map<string, number>()
    displaySets.forEach(set => {
      set.dogs.forEach((setDog: GetSetsQuery['sets'][0]['dogs'][0]) => {
        const currentCount = dogSetCounts.get(setDog.dogId) || 0
        dogSetCounts.set(setDog.dogId, currentCount + 1)
      })
    })

    return attendances
      .filter((attendance): attendance is PracticeAttendance =>
        attendance.attending !== AttendanceStatus.NotAttending &&
        attendance.dog !== undefined
      )
      .map(attendance => ({
        ...attendance.dog!,
        setCount: dogSetCounts.get(attendance.dog!.id) || 0
      }))
  }, [attendances, displaySets])

  const handleSetReorder = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldGroupIndex = parseInt(active.id as string)
    const newGroupIndex = parseInt(over.id as string)

    if (isNaN(oldGroupIndex) || isNaN(newGroupIndex)) return

    const setsToUpdate = displaySets.filter(set => set.index === oldGroupIndex)
    const targetIndex = newGroupIndex

    setsToUpdate.forEach(set => {
      queueUpdate({
        setId: set.id,
        update: {
          index: targetIndex
        }
      })
    })

    // Update all other sets' indices to maintain order
    displaySets.forEach(set => {
      if (set.index !== oldGroupIndex) {
        let newIndex = set.index
        if (oldGroupIndex < newGroupIndex && set.index > oldGroupIndex && set.index <= newGroupIndex) {
          newIndex = set.index - 1
        } else if (oldGroupIndex > newGroupIndex && set.index >= newGroupIndex && set.index < oldGroupIndex) {
          newIndex = set.index + 1
        }
        if (newIndex !== set.index) {
          queueUpdate({
            setId: set.id,
            update: {
              index: newIndex
            }
          })
        }
      }
    })
  }

  const queueUpdate = (
    action: { setId?: string, update?: any, delete?: boolean },
    callback?: (next: PendingUpdate[]) => void
  ) => {
    setPendingUpdates(prev => {
      let next: PendingUpdate[] = prev
      if (action.delete && action.setId) {
        const filtered = prev.filter(u => u.setId !== action.setId)
        if (filtered.some(u => u.setId === action.setId && u.delete)) {
          next = filtered
        } else {
          next = [
            ...filtered,
            { setId: action.setId, delete: true }
          ]
        }
      } else if (action.update) {
        if (action.setId) {
          const existing = prev.find(u => u.setId === action.setId && !u.delete)
          if (existing) {
            next = prev.map(u =>
              u.setId === action.setId && !u.delete
                ? { ...u, update: { ...u.update, ...action.update } }
                : u
            )
          } else {
            next = [...prev, { setId: action.setId, update: action.update }]
          }
        } else {
          const tempId = `temp-${Date.now()}`
          next = [...prev, { setId: tempId, update: action.update }]
        }
      } else if (action.setId && !action.update && !action.delete && action.setId.startsWith('temp-')) {
        next = prev.filter(u => u.setId !== action.setId)
      }
      if (callback) callback(next)
      return next
    })
  }

  const handleAddSet = () => {
    const newIndex = displaySets.length + 1
    queueUpdate({
      update: {
        practiceId,
        locationId: defaultLocation?.id!,
        index: newIndex,
        dogs: []
      }
    })
  }

  const handleDeleteSet = (setId: string) => {
    if (setId.startsWith('temp-')) {
      queueUpdate({ setId }, (next) => reorderSets(next))
    } else {
      queueUpdate({ setId, delete: true }, (next) => reorderSets(next))
    }
  }

  const handleDeleteGroup = (index: number) => {
    const setsToDelete = displaySets.filter(set => set.index === index)

    setsToDelete.forEach(set => {
      if (set.id.startsWith('temp-')) {
        queueUpdate({ setId: set.id }, (next) => reorderSets(next))
      } else {
        queueUpdate({ setId: set.id, delete: true }, (next) => reorderSets(next))
      }
    })
  }

  const handleSetTypeChange = (setId: string, type: SetType, typeCustom: string | null) => {
    queueUpdate({ setId, update: { type, typeCustom } })
  }

  const reorderSets = (pendingUpdatesArg?: PendingUpdate[]) => {
    const pending = pendingUpdatesArg ?? pendingUpdates
    const allSets = pendingUpdatesArg ? getDisplaySets(setsData, pending) : displaySets

    allSets.forEach((set, idx) => {
      if (set.index !== idx + 1) {
        queueUpdate({
          setId: set.id,
          update: { index: idx + 1 }
        })
      }
    })
  }

  const handleDogsChange = (setId: string, dogs: Partial<SetDog>[]) => {
    queueUpdate({ setId, update: { dogs } })
  }

  const handleLocationAdd = (locationId: string, index: number) => {
    // Create a new set with the same index but different location
    // Don't pass any setId to ensure a new set is created
    queueUpdate({
      update: {
        practiceId,
        locationId: locationId,
        index: index,
        dogs: []
      }
    })
  }

  // Filter out default location from available locations
  const availableLocations = useMemo(() =>
    locations.filter(location => !location.isDefault),
    [locations]
  )

  // Group sets by index to show them together visually
  const groupedSets = useMemo(() => {
    const groups = new Map<number, GetSetsQuery['sets']>()

    displaySets.forEach(set => {
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

        const aLocation = availableLocations.find(l => l.id === a.locationId)
        const bLocation = availableLocations.find(l => l.id === b.locationId)
        return (aLocation?.name || '').localeCompare(bLocation?.name || '')
      })
    }))
  }, [displaySets, defaultLocation?.id, availableLocations])

  useEffect(() => {
    setSets(displaySets as any)
  }, [displaySets, setSets])

  useEffect(() => {
    if (pendingUpdates.length === 0) return
    const timer = setTimeout(async () => {
      try {
        setIsSaving(true)
        const deletes = pendingUpdates.filter(u => u.delete)
        for (const del of deletes) {
          await deleteSet({
            variables: { id: del.setId }
          })
        }
        const updatesToSave = pendingUpdates.filter(u => !u.delete && u.update)
        if (updatesToSave.length > 0) {
          await updateSets({
            variables: {
              updates: updatesToSave.map(u => ({
                ...u.update,
                ...(u.setId && !u.setId.startsWith('temp-') ? { id: u.setId } : {})
              }))
            }
          })
        }
        // pendingUpdates will be cleared by mutation onCompleted callbacks
      } catch (err) {
        console.error('Error updating sets:', err)
        // Don't clear pending updates on error to allow retry
      } finally {
        setIsSaving(false)
      }
    }, SAVE_DELAY)
    return () => clearTimeout(timer)
  }, [pendingUpdates, updateSets, deleteSet])

  if (setsLoading || locationsLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <DndContext
        onDragEnd={handleSetReorder}
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
              onLocationAdd={handleLocationAdd}
              availableDogs={availableDogs}
              availableLocations={availableLocations}
              defaultLocation={defaultLocation}
            />
          ))}
        </SortableContext>
      </DndContext>
      <div className="d-flex justify-content-end mb-4">
        <Button variant="primary" onClick={handleAddSet}>
          <PlusLg className="me-2" />
          Add Set
        </Button>
      </div>
      <SaveSpinner show={isSaving} />
    </div>
  )
}
