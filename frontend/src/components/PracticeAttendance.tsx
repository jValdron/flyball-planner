import React, { useState, useEffect } from 'react'
import { Button, Table } from 'react-bootstrap'
import { CheckLg, XLg } from 'react-bootstrap-icons'
import { attendanceService, AttendanceStatus, type AttendanceUpdate } from '../services/attendanceService'
import { useClub } from '../contexts/ClubContext'
import { SaveSpinner } from './SaveSpinner'
import type { Owner } from '../services/ownerService'
import { ownerService } from '../services/ownerService'
import { dogService, type Dog } from '../services/dogService'

const SAVE_DELAY = 2000

interface PracticeAttendanceProps {
  practiceId: string
  isPastPractice: boolean
}

interface DogWithOwner extends Dog {
  ownerName: string
}

export function PracticeAttendance({ practiceId, isPastPractice }: PracticeAttendanceProps) {
  const { selectedClub } = useClub()
  const [isSaving, setIsSaving] = useState(false)
  const [pendingUpdates, setPendingUpdates] = useState<AttendanceUpdate[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [dogs, setDogs] = useState<DogWithOwner[]>([])
  const [attendances, setAttendances] = useState<Map<string, AttendanceStatus>>(new Map())

  // Load owners, dogs and attendances
  useEffect(() => {
    if (owners && owners.length > 0 && selectedClub) {
      loadDogs(owners)
    }
  }, [selectedClub, owners])

  useEffect(() => {
    if (selectedClub && practiceId) {
      loadOwners()
      loadAttendances()
    }
  }, [selectedClub, practiceId])

  const loadOwners = async () => {
    try {
      const data = await ownerService.getOwners()
      setOwners(data)
    } catch (err) {
      console.error('Error loading owners:', err)
    }
  }

  const loadDogs = async (ownersList: Owner[]) => {
    try {
      if (!selectedClub) return
      const data = await dogService.getDogsByClub(selectedClub.ID)
      const ownerMap = new Map(ownersList.map(owner => [owner.ID, owner]))
      const dogsWithOwners = data
        .filter(dog => dog.Status === 'Active')
        .map(dog => {
          const owner = ownerMap.get(dog.OwnerID)
          return {
            ...dog,
            ownerName: owner ? `${owner.GivenName} ${owner.Surname}` : 'Unknown Owner'
          }
        })
      const sortedDogs = dogsWithOwners.sort((a, b) => {
        const ownerCompare = a.ownerName.localeCompare(b.ownerName)
        if (ownerCompare !== 0) return ownerCompare
        return a.Name.localeCompare(b.Name)
      })
      setDogs(sortedDogs)
    } catch (err) {
      console.error('Error loading dogs:', err)
    }
  }

  const loadAttendances = async () => {
    if (!selectedClub || !practiceId) return
    try {
      const attendanceData = await attendanceService.getAttendances(selectedClub.ID, practiceId)
      const newAttendances = new Map(Object.entries(attendanceData))
      setAttendances(newAttendances)
    } catch (err) {
      console.error('Error loading attendances:', err)
    }
  }

  // Save attendances
  useEffect(() => {
    if (pendingUpdates.length === 0) {
      return
    }

    const timer = setTimeout(async () => {
      if (!selectedClub || !practiceId) {
        return
      }

      try {
        setIsSaving(true)
        await attendanceService.updateAttendances(selectedClub.ID, practiceId, pendingUpdates)
        setPendingUpdates([])
      } catch (err) {
        console.error('Error saving attendance:', err)
      } finally {
        setIsSaving(false)
      }
    }, SAVE_DELAY)

    return () => {
      clearTimeout(timer)
    }
  }, [pendingUpdates, selectedClub, practiceId])

  const handleAttendanceChange = (dogId: string, status: AttendanceStatus) => {
    setAttendances(prev => {
      const newMap = new Map(prev)
      newMap.set(dogId, status)
      return newMap
    })

    setPendingUpdates(prev => {
      const existingUpdate = prev.find(u => u.dogId === dogId)
      if (existingUpdate) {
        return prev.map(u => u.dogId === dogId ? { ...u, status } : u)
      }
      return [...prev, { dogId, status }]
    })
  }

  const handleOwnerAttendanceChange = (ownerId: string, status: AttendanceStatus) => {
    const ownerDogs = dogs.filter(dog => dog.OwnerID === ownerId)

    setAttendances(prev => {
      const newMap = new Map(prev)
      ownerDogs.forEach(dog => newMap.set(dog.ID, status))
      return newMap
    })

    setPendingUpdates(prev => {
      const ownerDogs = dogs.filter(dog => dog.OwnerID === ownerId)
      const existingUpdates = prev.filter(u => !ownerDogs.some(d => d.ID === u.dogId))
      const newUpdates = ownerDogs.map(dog => ({ dogId: dog.ID, status }))
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
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [pendingUpdates])

  return (
    <>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th className="w-100">Owner / Dog</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {Array.from(new Set(dogs.map(dog => dog.OwnerID))).map(ownerId => {
            const ownerDogs = dogs.filter(dog => dog.OwnerID === ownerId)
            const ownerName = ownerDogs[0]?.ownerName
            const allDogsSameStatus = ownerDogs.every(dog =>
              attendances.get(dog.ID) === attendances.get(ownerDogs[0].ID)
            )
            const ownerStatus = allDogsSameStatus ? attendances.get(ownerDogs[0].ID) || AttendanceStatus.Unknown : AttendanceStatus.Unknown

            return (
              <React.Fragment key={ownerId}>
                <tr
                  className="table-secondary"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (!isPastPractice && !isSaving) {
                      const newStatus = ownerStatus === AttendanceStatus.Yes ? AttendanceStatus.No : AttendanceStatus.Yes
                      handleOwnerAttendanceChange(ownerId, newStatus)
                    }
                  }}
                >
                  <td><strong>{ownerName}</strong></td>
                  <td className="text-left">
                    <div className="btn-group" role="group">
                      <Button
                        variant={ownerStatus === AttendanceStatus.Yes ? 'primary' : 'outline-primary'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOwnerAttendanceChange(ownerId, AttendanceStatus.Yes)
                        }}
                        title="All Attending"
                        disabled={isPastPractice || isSaving}
                      >
                        <CheckLg />
                      </Button>
                      <Button
                        variant={ownerStatus === AttendanceStatus.No ? 'secondary' : 'outline-secondary'}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleOwnerAttendanceChange(ownerId, AttendanceStatus.No)
                        }}
                        title="All Not Attending"
                        disabled={isPastPractice || isSaving}
                      >
                        <XLg />
                      </Button>
                    </div>
                  </td>
                </tr>
                {ownerDogs.map((dog) => (
                  <tr
                    key={dog.ID}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (!isPastPractice && !isSaving) {
                        const newStatus = attendances.get(dog.ID) === AttendanceStatus.Yes ? AttendanceStatus.No : AttendanceStatus.Yes
                        handleAttendanceChange(dog.ID, newStatus)
                      }
                    }}
                  >
                    <td className="ps-4">{dog.Name}</td>
                    <td className="text-left">
                      <div className="btn-group" role="group">
                        <Button
                          variant={attendances.get(dog.ID) === AttendanceStatus.Yes ? 'primary' : 'outline-primary'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAttendanceChange(dog.ID, AttendanceStatus.Yes)
                          }}
                          title="Attending"
                          disabled={isPastPractice || isSaving}
                        >
                          <CheckLg />
                        </Button>
                        <Button
                          variant={attendances.get(dog.ID) === AttendanceStatus.No ? 'secondary' : 'outline-secondary'}
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleAttendanceChange(dog.ID, AttendanceStatus.No)
                          }}
                          title="Not Attending"
                          disabled={isPastPractice || isSaving}
                        >
                          <XLg />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            )
          })}
        </tbody>
      </Table>
      <SaveSpinner show={isSaving} />
    </>
  )
}
