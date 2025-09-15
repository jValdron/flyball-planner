import React, { useState, useEffect, useRef } from 'react'
import { Button, Table, Form, InputGroup } from 'react-bootstrap'
import { CheckLg, XLg } from 'react-bootstrap-icons'
import { useClub } from '../../contexts/ClubContext'
import { usePractice } from '../../contexts/PracticeContext'
import { useMutation } from '@apollo/client'
import { UpdateAttendances } from '../../graphql/attendance'
import { AttendanceStatus, DogStatus } from '../../graphql/generated/graphql'
import type { UpdateAttendancesMutation } from '../../graphql/generated/graphql'
import { useTheme } from '../../contexts/ThemeContext'
import { getFilteredAndSortedDogsByHandlers, getHandlerName } from '../../utils/dogsUtils'

const SAVE_DELAY = 25

interface PracticeAttendanceProps {
  practiceId: string
}

export function PracticeAttendance({ practiceId }: PracticeAttendanceProps) {
  const { selectedClub, dogsByHandlersInSelectedClub } = useClub()
  const { isDark } = useTheme()
  const { getAttendance } = usePractice()
  const [pendingUpdates, setPendingUpdates] = useState<{ dogId: string, attending: AttendanceStatus }[]>([])
  const [optimisticAttendances, setOptimisticAttendances] = useState<Map<string, AttendanceStatus>>(new Map())
  const [searchQuery, setSearchQuery] = useState('')
  const [showOnlyUnconfirmed, setShowOnlyUnconfirmed] = useState(true)
  const [initiallyVisibleHandlers, setInitiallyVisibleHandlers] = useState<Set<string>>(new Set())
  const hasInitialized = useRef(false)

  const [updateAttendances] = useMutation<UpdateAttendancesMutation>(UpdateAttendances)

  // Get the effective attendance status for a dog, considering optimistic updates
  const getEffectiveAttendance = (dogId: string): AttendanceStatus => {
    const optimisticStatus = optimisticAttendances.get(dogId)
    if (optimisticStatus !== undefined) {
      return optimisticStatus
    }

    return getAttendance(dogId) || AttendanceStatus.Unknown
  }

  // Initialize the set of handlers that should remain visible
  useEffect(() => {
    if (!hasInitialized.current && dogsByHandlersInSelectedClub.length > 0) {
      const handlersWithUnconfirmed = dogsByHandlersInSelectedClub
        .filter(handler => {
          const handlerDogs = handler.dogs?.filter(dog => dog.status === DogStatus.Active) || []
          return handlerDogs.some(dog => getEffectiveAttendance(dog.id) === AttendanceStatus.Unknown)
        })
        .map(handler => handler.id)

      setInitiallyVisibleHandlers(new Set(handlersWithUnconfirmed))
      hasInitialized.current = true
    }
  }, [dogsByHandlersInSelectedClub, getEffectiveAttendance])

  // Handle checkbox change and reset initially visible handlers
  const handleShowOnlyUnconfirmedChange = (checked: boolean) => {
    setShowOnlyUnconfirmed(checked)

    if (checked) {
      const handlersWithUnconfirmed = dogsByHandlersInSelectedClub
        .filter(handler => {
          const handlerDogs = handler.dogs?.filter(dog => dog.status === DogStatus.Active) || []
          return handlerDogs.some(dog => getEffectiveAttendance(dog.id) === AttendanceStatus.Unknown)
        })
        .map(handler => handler.id)

      setInitiallyVisibleHandlers(new Set(handlersWithUnconfirmed))
    } else {
      setInitiallyVisibleHandlers(new Set())
    }
  }

  // Filter handlers based on search query and unconfirmed attendance preference
  const filteredHandlers = getFilteredAndSortedDogsByHandlers(dogsByHandlersInSelectedClub, searchQuery, false)
    .filter(handler => {
      if (!showOnlyUnconfirmed) return true

      if (initiallyVisibleHandlers.has(handler.id)) return true

      const handlerDogs = handler.dogs?.filter(dog => dog.status === DogStatus.Active) || []
      return handlerDogs.some(dog => getEffectiveAttendance(dog.id) === AttendanceStatus.Unknown)
    })

  // Check if there are any unconfirmed attendances
  const hasUnconfirmedAttendances = dogsByHandlersInSelectedClub.some(handler => {
    const handlerDogs = handler.dogs?.filter(dog => dog.status === DogStatus.Active) || []
    return handlerDogs.some(dog => getEffectiveAttendance(dog.id) === AttendanceStatus.Unknown)
  })

  useEffect(() => {
    if (pendingUpdates.length === 0) return
    const timer = setTimeout(async () => {
      if (!selectedClub || !practiceId) return
      try {
        await updateAttendances({
          variables: {
            practiceId,
            updates: pendingUpdates.map(u => ({ dogId: u.dogId, attending: u.attending }))
          }
        })
        setPendingUpdates([])
        setOptimisticAttendances(prev => {
          const newMap = new Map(prev)
          pendingUpdates.forEach(update => {
            newMap.delete(update.dogId)
          })
          return newMap
        })
      } catch (err) {
        console.error('Error updating attendances:', err)
        setOptimisticAttendances(prev => {
          const newMap = new Map(prev)
          pendingUpdates.forEach(update => {
            newMap.delete(update.dogId)
          })
          return newMap
        })
      }
    }, SAVE_DELAY)
    return () => clearTimeout(timer)
  }, [pendingUpdates, selectedClub, practiceId, updateAttendances])

  const handleAttendanceChange = (dogId: string, status: AttendanceStatus) => {
    setOptimisticAttendances(prev => new Map(prev).set(dogId, status))

    setPendingUpdates(prev => {
      const existingUpdate = prev.find(u => u.dogId === dogId)
      if (existingUpdate) {
        return prev.map(u => u.dogId === dogId ? { ...u, attending: status } : u)
      }
      return [...prev, { dogId, attending: status }]
    })
  }

  const handleOwnerAttendanceChange = (ownerId: string, status: AttendanceStatus) => {
    const ownerDogs = dogsByHandlersInSelectedClub.find(o => o.id === ownerId)?.dogs || []

    setOptimisticAttendances(prev => {
      const newMap = new Map(prev)
      ownerDogs.forEach(dog => {
        newMap.set(dog.id, status)
      })
      return newMap
    })

    setPendingUpdates(prev => {
      const existingUpdates = prev.filter(u => !ownerDogs.some(d => d.id === u.dogId))
      const newUpdates = ownerDogs.map(dog => ({ dogId: dog.id, attending: status }))
      return [...existingUpdates, ...newUpdates]
    })
  }

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingUpdates.length > 0) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [pendingUpdates])

  return (
    <React.Fragment>
      <div className="d-flex align-items-center gap-3 mb-3">
        <InputGroup style={{ maxWidth: '300px' }}>
          <Form.Control
            type="text"
            placeholder="Search handlers or dogs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </InputGroup>
        <Form.Check
          type="switch"
          id="show-unconfirmed"
          label="Unconfirmed attendance only"
          checked={showOnlyUnconfirmed}
          onChange={(e) => handleShowOnlyUnconfirmedChange(e.target.checked)}
        />
      </div>

      <Table striped bordered hover className="align-middle">
        <tbody>
          {filteredHandlers.length === 0 && showOnlyUnconfirmed && !hasUnconfirmedAttendances ? (
            <tr style={{ pointerEvents: 'none' }}>
              <td colSpan={2} className="text-center py-4">
                <div className="text-muted">
                  <p className="mb-0">No unconfirmed attendances found.</p>
                  <small>Everyone has confirmed their attendance.</small>
                </div>
              </td>
            </tr>
          ) : filteredHandlers.length === 0 ? (
            <tr style={{ pointerEvents: 'none' }}>
              <td colSpan={2} className="text-center py-4">
                <div className="text-muted">
                  <p className="mb-0">No handlers or dogs found matching your search.</p>
                </div>
              </td>
            </tr>
          ) : (
            filteredHandlers.map(owner => {
              const ownerDogs = owner.dogs?.filter(dog => dog.status === DogStatus.Active) || []
              const ownerName = getHandlerName(owner)
              const allDogsSameStatus = ownerDogs.length > 0 && ownerDogs.every(dog =>
                getEffectiveAttendance(dog.id) === getEffectiveAttendance(ownerDogs[0].id)
              )
              const ownerStatus = allDogsSameStatus ?
                getEffectiveAttendance(ownerDogs[0].id) :
                AttendanceStatus.Unknown

              return (
                <React.Fragment key={owner.id}>
                  <tr
                    className={`${isDark ? 'table-dark' : 'table-secondary'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      const newStatus = ownerStatus === AttendanceStatus.Attending ?
                        AttendanceStatus.NotAttending :
                        AttendanceStatus.Attending
                      handleOwnerAttendanceChange(owner.id, newStatus)
                    }}
                  >
                    <td className="w-100 text-nowrap text-truncate"><strong>{ownerName}</strong></td>
                    <td className="text-left">
                      <div className="btn-group" role="group">
                        <Button
                          variant={ownerStatus === AttendanceStatus.Attending ? 'primary' : 'outline-primary'}
                          size="sm"
                          onClick={e => {
                            e.stopPropagation()
                            handleOwnerAttendanceChange(owner.id, AttendanceStatus.Attending)
                          }}
                          title="All Attending"
                        >
                          <CheckLg />
                        </Button>
                        <Button
                          variant={ownerStatus === AttendanceStatus.NotAttending ? 'secondary' : 'outline-secondary'}
                          size="sm"
                          onClick={e => {
                            e.stopPropagation()
                            handleOwnerAttendanceChange(owner.id, AttendanceStatus.NotAttending)
                          }}
                          title="All Not Attending"
                        >
                          <XLg />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  {ownerDogs.map(dog => {
                    const dogAttendance = getEffectiveAttendance(dog.id)
                    const isOptimistic = optimisticAttendances.has(dog.id)

                    return (
                      <tr
                        key={dog.id}
                        style={{
                          cursor: 'pointer',
                          opacity: isOptimistic ? 0.7 : 1,
                          backgroundColor: isOptimistic ? '#f8f9fa' : undefined
                        }}
                        onClick={() => {
                          const newStatus = dogAttendance === AttendanceStatus.Attending ?
                            AttendanceStatus.NotAttending :
                            AttendanceStatus.Attending
                          handleAttendanceChange(dog.id, newStatus)
                        }}
                      >
                        <td className="ps-4">
                          {dog.name}
                        </td>
                        <td className="text-left">
                          <div className="btn-group" role="group">
                            <Button
                              variant={dogAttendance === AttendanceStatus.Attending ? 'primary' : 'outline-primary'}
                              size="sm"
                              onClick={e => {
                                e.stopPropagation()
                                handleAttendanceChange(dog.id, AttendanceStatus.Attending)
                              }}
                              title="Attending"
                            >
                              <CheckLg />
                            </Button>
                            <Button
                              variant={dogAttendance === AttendanceStatus.NotAttending ? 'secondary' : 'outline-secondary'}
                              size="sm"
                              onClick={e => {
                                e.stopPropagation()
                                handleAttendanceChange(dog.id, AttendanceStatus.NotAttending)
                              }}
                              title="Not Attending"
                            >
                              <XLg />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </React.Fragment>
              )
            })
          )}
        </tbody>
      </Table>
    </React.Fragment>
  )
}
