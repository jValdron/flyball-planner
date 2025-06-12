import { useState, useEffect, useMemo } from 'react'
import { Button, Table, Form, InputGroup, CardGroup, Card, Badge, OverlayTrigger, Popover, Dropdown } from 'react-bootstrap'
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useQuery, useMutation } from '@apollo/client'
import { GetSets, UpdateSet, DeleteSet } from '../graphql/sets'
import { GetLocationsByClub } from '../graphql/clubs'
import { SetType, AttendanceStatus, Lane } from '../graphql/generated/graphql'
import { GripVertical, PlusLg, Trash, ChevronDown } from 'react-bootstrap-icons'
import { SaveSpinner } from './SaveSpinner'
import { useClub } from '../contexts/ClubContext'
import { usePractice } from '../contexts/PracticeContext'
import type { GetSetsQuery, UpdateSetMutation, DeleteSetMutation, GetLocationsByClubQuery, PracticeAttendance, SetUpdate } from '../graphql/generated/graphql'
import { DogAutocomplete } from './DogAutocomplete'
import { SetTypeAutocomplete } from './PracticeSet/SetTypeAutocomplete'
import { LocationSelector } from './PracticeSet/LocationSelector'

const SAVE_DELAY = 2500

interface PracticeSetProps {
  practiceId: string
  isPastPractice: boolean
}

interface SortableSetProps {
  set: GetSetsQuery['sets'][0]
  onDelete: (id: string) => void
  onTypeChange: (id: string, type: SetType, dogs?: Array<{ dogId: string; index: number; lane: Lane }>) => void
  attendingDogsList: Array<{ id: string; name: string; displayName: string }>
}

function SortableSet({ set, onDelete, onTypeChange, attendingDogsList }: SortableSetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: set.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const [dogInputs, setDogInputs] = useState<Record<Lane, string>>({
    [Lane.Left]: '',
    [Lane.Right]: ''
  })

  const handleDogInputChange = (lane: Lane, value: string) => {
    setDogInputs(prev => ({
      ...prev,
      [lane]: value
    }))
  }

  const handleDogSelect = (lane: Lane, dog: { id: string; name: string; displayName: string }) => {
    const newDog = {
      dogId: dog.id,
      index: set.setDogs.length + 1,
      lane
    }

    const updatedDogs = [...set.setDogs, newDog]
    onTypeChange(set.id, set.type, updatedDogs)
    setDogInputs(prev => ({
      ...prev,
      [lane]: ''
    }))
  }

  const handleRemoveDog = (dogId: string) => {
    const updatedDogs = set.setDogs.filter(dog => dog.dogId !== dogId)
    onTypeChange(set.id, set.type, updatedDogs)
  }

  const handleDogReorder = (lane: Lane, dogId: string, newIndex: number) => {
    const laneDogs = set.setDogs.filter(dog => dog.lane === lane)
    const otherLaneDogs = set.setDogs.filter(dog => dog.lane !== lane)
    const dogToMove = laneDogs.find(dog => dog.dogId === dogId)
    if (!dogToMove) return

    const updatedLaneDogs = laneDogs.filter(dog => dog.dogId !== dogId)
    updatedLaneDogs.splice(newIndex, 0, dogToMove)

    const updatedDogs = [
      ...otherLaneDogs,
      ...updatedLaneDogs.map((dog, index) => ({
        ...dog,
        index: index + 1
      }))
    ]

    onTypeChange(set.id, set.type, updatedDogs)
  }

  return (
    <CardGroup ref={setNodeRef} style={style} className="d-flex mb-3">
      <Card bg="light" className="rounded-left">
        <Card.Body {...attributes} {...listeners} className="cursor-grab d-flex align-items-center justify-content-center">
          <Card.Title>
            <GripVertical /> {set.index}
          </Card.Title>
        </Card.Body>
      </Card>
      <Card className="flex-fill">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Form.Group className="flex-grow-1 me-3">
              <SetTypeAutocomplete
                value={set.typeCustom || set.type}
                typeCustom={set.typeCustom}
                onChange={(type, typeCustom) => onTypeChange(set.id, type, set.setDogs.map(dog => ({
                  dogId: dog.dogId,
                  index: dog.index,
                  lane: dog.lane
                })))}
              />
            </Form.Group>
            <Button variant="outline-danger" size="sm" onClick={() => onDelete(set.id)}>
              <Trash />
            </Button>
          </div>
          <div className="d-flex">
            {Object.values(Lane).map(lane => (
              <div key={lane} className="flex-grow-1 me-2">
                <div className="d-flex flex-column">
                  <SortableContext
                    items={set.setDogs
                      .filter(dog => dog.lane === lane)
                      .map(dog => dog.dogId)}
                    strategy={verticalListSortingStrategy}
                  >
                    {set.setDogs
                      .filter(dog => dog.lane === lane)
                      .map(dog => {
                        const {
                          attributes,
                          listeners,
                          setNodeRef,
                          transform,
                          transition,
                        } = useSortable({ id: dog.dogId })

                        const style = {
                          transform: CSS.Transform.toString(transform),
                          transition,
                        }

                        return (
                          <div
                            key={dog.dogId}
                            ref={setNodeRef}
                            style={style}
                            {...attributes}
                            {...listeners}
                          >
                            <Badge bg="primary" className="mb-1 d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center">
                                <GripVertical className="me-1" />
                                <span>{attendingDogsList.find(d => d.id === dog.dogId)?.displayName}</span>
                              </div>
                              <Button
                                variant="link"
                                className="text-white p-0 ms-2"
                                onClick={() => handleRemoveDog(dog.dogId)}
                              >
                                <Trash size={12} />
                              </Button>
                            </Badge>
                          </div>
                        )
                      })}
                  </SortableContext>
                  <DogAutocomplete
                    value={dogInputs[lane]}
                    onChange={(value) => handleDogInputChange(lane, value)}
                    onSelect={(dog) => handleDogSelect(lane, dog)}
                    attendingDogsList={attendingDogsList}
                    placeholder={`Add dog to ${lane} lane`}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="d-flex">
            {/* <LocationSelector
              locations={locations}
              selectedLocationId={selectedLocationId || ''}
              onSelect={handleLocationSelect}
              onDelete={handleLocationDelete}
            /> */}
          </div>
        </Card.Body>
      </Card>
    </CardGroup>
  )
}

export function PracticeSet({ practiceId, isPastPractice }: PracticeSetProps) {
  const { selectedClub } = useClub()
  const { attendances } = usePractice()
  const [isSaving, setIsSaving] = useState(false)
  const [pendingUpdates, setPendingUpdates] = useState<{ setId: string | null, update: any }[]>([])
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null)

  const { data: locationsData, loading: locationsLoading } = useQuery<GetLocationsByClubQuery>(GetLocationsByClub, {
    variables: { clubId: selectedClub?.id! },
    skip: !selectedClub?.id
  })

  const locations = locationsData?.locationsByClub || []
  const defaultLocation = useMemo(() => locations.find(l => l.isDefault), [locations])
  const otherLocations = useMemo(() => locations.filter(l => !l.isDefault), [locations])

  const { data: setsData, loading: setsLoading, refetch } = useQuery<GetSetsQuery>(GetSets, {
    variables: {
      practiceId,
      locationId: defaultLocation?.id || ''
    },
    skip: !practiceId || !defaultLocation?.id
  })

  const [updateSet] = useMutation<UpdateSetMutation>(UpdateSet)
  const [deleteSet] = useMutation<DeleteSetMutation>(DeleteSet)

  const attendingDogsList = useMemo(() =>
    attendances
      .filter((attendance): attendance is PracticeAttendance =>
        attendance.attending === AttendanceStatus.Attending &&
        attendance.dog !== undefined
      )
      .map(attendance => ({
        ...attendance.dog!,
        displayName: attendance.dog!.name
      }))
      .sort((a, b) => a.displayName.localeCompare(b.displayName)), [attendances])

  useEffect(() => {
    if (defaultLocation?.id && !selectedLocationId) {
      setSelectedLocationId(defaultLocation.id)
    }
  }, [defaultLocation?.id, selectedLocationId])

  const handleLocationSelect = (locationId: string) => {
    setSelectedLocationId(locationId)
  }

  const handleLocationDelete = async (locationId: string) => {
    const setsToDelete = setsData?.sets.filter(set => set.locationId === locationId) || []
    for (const set of setsToDelete) {
      await deleteSet({
        variables: { id: set.id }
      })
    }
    refetch()
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = setsData?.sets.findIndex(set => set.id === active.id) ?? -1
    const newIndex = setsData?.sets.findIndex(set => set.id === over.id) ?? -1

    if (oldIndex === -1 || newIndex === -1) return

    const items = Array.from(setsData?.sets || [])
    const [reorderedItem] = items.splice(oldIndex, 1)
    items.splice(newIndex, 0, reorderedItem)

    const updatedItems = items.map((item, index) => ({
      ...item,
      index: index + 1
    }))

    setPendingUpdates(prev => [
      ...prev,
      ...updatedItems.map(item => ({
        setId: item.id,
        update: {
          practiceId,
          locationId: selectedLocationId!,
          index: item.index,
          type: item.type,
          typeCustom: item.typeCustom,
          notes: item.notes,
          dogs: item.setDogs.map(dog => ({
            dogId: dog.dogId,
            index: dog.index,
            lane: dog.lane
          }))
        }
      }))
    ])
  }

  const handleAddSet = () => {
    const newIndex = (setsData?.sets.length || 0) + 1
    const newSet: SetUpdate = {
      practiceId,
      locationId: selectedLocationId!,
      index: newIndex,
      type: SetType.FullRuns,
      dogs: []
    }
    setPendingUpdates(prev => [
      ...prev,
      {
        setId: null,
        update: newSet
      }
    ])
  }

  const handleDeleteSet = async (setId: string) => {
    try {
      await deleteSet({
        variables: { id: setId }
      })
      refetch()
    } catch (err) {
      console.error('Error deleting set:', err)
    }
  }

  const handleSetTypeChange = (setId: string, type: SetType, dogs?: Array<{ dogId: string; index: number; lane: Lane }>) => {
    setPendingUpdates(prev => [
      ...prev,
      {
        setId,
        update: {
          practiceId,
          locationId: selectedLocationId!,
          type,
          dogs: dogs || setsData?.sets.find(s => s.id === setId)?.setDogs.map(dog => ({
            dogId: dog.dogId,
            index: dog.index,
            lane: dog.lane
          })) || []
        }
      }
    ])
  }

  useEffect(() => {
    if (pendingUpdates.length === 0) return
    const timer = setTimeout(async () => {
      try {
        setIsSaving(true)
        for (const update of pendingUpdates) {
          await updateSet({
            variables: {
              id: update.setId,
              update: update.update
            }
          })
        }
        setPendingUpdates([])
        refetch()
      } catch (err) {
        console.error('Error updating sets:', err)
      } finally {
        setIsSaving(false)
      }
    }, SAVE_DELAY)
    return () => clearTimeout(timer)
  }, [pendingUpdates, updateSet, refetch])

  if (setsLoading || locationsLoading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <DndContext
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={setsData?.sets.map(set => set.id) || []}
          strategy={verticalListSortingStrategy}
        >
          {(setsData?.sets || []).map(set => (
            <SortableSet
              key={set.id}
              set={set}
              onDelete={handleDeleteSet}
              onTypeChange={handleSetTypeChange}
              attendingDogsList={attendingDogsList}
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
