import { useState, useEffect, useMemo } from 'react'
import { Button, Table, Form, InputGroup } from 'react-bootstrap'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { useQuery, useMutation } from '@apollo/client'
import { GetSets, UpdateSet, DeleteSet } from '../graphql/sets'
import { GetLocationsByClub } from '../graphql/clubs'
import { SetType, AttendanceStatus } from '../graphql/generated/graphql'
import { SaveSpinner } from './SaveSpinner'
import { useClub } from '../contexts/ClubContext'
import { usePractice } from '../contexts/PracticeContext'
import type { GetSetsQuery, UpdateSetMutation, DeleteSetMutation, GetLocationsByClubQuery, PracticeAttendance, SetUpdate } from '../graphql/generated/graphql'
import { GripVertical, PlusLg } from 'react-bootstrap-icons'

const SAVE_DELAY = 2500

interface PracticeSetProps {
  practiceId: string
  isPastPractice: boolean
}

export function PracticeSet({ practiceId, isPastPractice }: PracticeSetProps) {
  const { selectedClub } = useClub()
  const { attendances } = usePractice()
  const [isSaving, setIsSaving] = useState(false)
  const [pendingUpdates, setPendingUpdates] = useState<{ setId: string | null, update: any }[]>([])

  // Fetch locations for the club
  const { data: locationsData, loading: locationsLoading } = useQuery<GetLocationsByClubQuery>(GetLocationsByClub, {
    variables: { clubId: selectedClub?.id! },
    skip: !selectedClub?.id
  })

  // Find default location and other locations
  const locations = locationsData?.locationsByClub || []
  const defaultLocation = useMemo(() => locations.find(l => l.isDefault), [locations])
  const otherLocations = useMemo(() => locations.filter(l => !l.isDefault), [locations])

  // Fetch sets for all locations
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

  const handleDragEnd = (result: any) => {
    if (!result.destination) return

    const sourceLocationId = result.source.droppableId
    const destLocationId = result.destination.droppableId
    const items = Array.from(setsData?.sets || [])
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update indices
    const updatedItems = items.map((item, index) => ({
      ...item,
      index: index + 1
    }))

    // Add to pending updates
    setPendingUpdates(prev => [
      ...prev,
      ...updatedItems.map(item => ({
        setId: item.id,
        update: {
          practiceId,
          locationId: destLocationId,
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

  const handleAddSet = (locationId: string) => {
    const newIndex = (setsData?.sets.length || 0) + 1
    const newSet: SetUpdate = {
      practiceId,
      locationId,
      index: newIndex,
      type: SetType.FullRuns,
      dogs: []
    }
    setsData?.sets.push({
      ...newSet,
      id: '',
      setDogs: []
    })
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

  const handleSetTypeChange = (setId: string, type: SetType) => {
    setPendingUpdates(prev => [
      ...prev,
      { setId, update: { type } }
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

  const renderLocationTable = (location: typeof locations[0]) => {
    const locationSets = setsData?.sets.filter(set => set.locationId === location.id) || []
    const isDoubleLane = location.isDoubleLane

    return (
      <div key={location.id} className="mb-4">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h4>{location.name}</h4>
          <Button
            variant="primary"
            size="sm"
            onClick={() => handleAddSet(location.id)}
            disabled={isPastPractice}
          >
            <PlusLg className="me-2" />
            Add Set
          </Button>
        </div>
        <Droppable droppableId={location.id} isDropDisabled={isPastPractice} isCombineEnabled={false} ignoreContainerClipping={true}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
            >
              <Table striped bordered>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}></th>
                    <th className="text-center" style={{ width: '50px' }}>#</th>
                    {isDoubleLane ? (
                      <>
                        <th>Left Lane</th>
                        <th>Right Lane</th>
                      </>
                    ) : (
                      <th>Dogs</th>
                    )}
                    <th>Type</th>
                    <th style={{ width: '50px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {locationSets.length === 0 ? (
                    <tr>
                      <td colSpan={isDoubleLane ? 6 : 5} className="text-center text-muted py-4">
                        No sets found for this location
                      </td>
                    </tr>
                  ) : (
                    locationSets.map((set, index) => (
                      <Draggable
                        key={set.id}
                        draggableId={set.id}
                        index={index}
                      >
                        {(provided) => (
                          <tr
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                          >
                            <td {...provided.dragHandleProps} className="align-middle text-center"><GripVertical /></td>
                            <td className="text-monospace text-center align-middle">{set.index}</td>
                            {isDoubleLane ? (
                              <>
                                <td>
                                  <InputGroup>
                                    <Form.Control
                                      type="text"
                                      placeholder="Add dog..."
                                      list={`dogs-left-${set.id}`}
                                      disabled={isPastPractice}
                                    />
                                    <datalist id={`dogs-left-${set.id}`}>
                                      {attendingDogsList.map(dog => (
                                        <option key={dog.id} value={dog.displayName} />
                                      ))}
                                    </datalist>
                                  </InputGroup>
                                </td>
                                <td>
                                  <InputGroup>
                                    <Form.Control
                                      type="text"
                                      placeholder="Add dog..."
                                      list={`dogs-right-${set.id}`}
                                      disabled={isPastPractice}
                                    />
                                    <datalist id={`dogs-right-${set.id}`}>
                                      {attendingDogsList.map(dog => (
                                        <option key={dog.id} value={dog.displayName} />
                                      ))}
                                    </datalist>
                                  </InputGroup>
                                </td>
                              </>
                            ) : (
                              <td>
                                <InputGroup>
                                  <Form.Control
                                    type="text"
                                    placeholder="Add dog..."
                                    list={`dogs-${set.id}`}
                                    disabled={isPastPractice}
                                  />
                                  <datalist id={`dogs-${set.id}`}>
                                    {attendingDogsList.map(dog => (
                                      <option key={dog.id} value={dog.displayName} />
                                    ))}
                                  </datalist>
                                </InputGroup>
                              </td>
                            )}
                            <td>
                              <Form.Select
                                value={set.type}
                                onChange={(e) => handleSetTypeChange(set.id, e.target.value as SetType)}
                                disabled={isPastPractice}
                              >
                                {Object.values(SetType).map(type => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </Form.Select>
                            </td>
                            <td>
                              <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => handleDeleteSet(set.id)}
                                disabled={isPastPractice}
                              >
                                ×
                              </Button>
                            </td>
                          </tr>
                        )}
                      </Draggable>
                    ))
                  )}
                </tbody>
              </Table>
            </div>
          )}
        </Droppable>
      </div>
    )
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="practice-sets">
        {locations.map(location => renderLocationTable(location))}
      </div>
      <SaveSpinner show={isSaving} />
    </DragDropContext>
  )
}
