import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Button, Table } from 'react-bootstrap'
import { ChevronLeft, ChevronRight, CheckLg, XLg, DashLg } from 'react-bootstrap-icons'
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
  onTabChange: (tab: string) => void
}

interface DogWithOwner extends Dog {
  ownerName: string
}

export function PracticeAttendance({ practiceId, isPastPractice, onTabChange }: PracticeAttendanceProps) {
  const { selectedClub } = useClub()
  const [isSaving, setIsSaving] = useState(false)
  const [pendingUpdates, setPendingUpdates] = useState<AttendanceUpdate[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [dogs, setDogs] = useState<DogWithOwner[]>([])
  const [attendances, setAttendances] = useState<Map<string, AttendanceStatus>>(new Map())

  const loadOwners = async () => {
    try {
      const data = await ownerService.getOwners()
      setOwners(data)
    } catch (err) {
      console.error('Error loading owners:', err)
    }
  }

  useEffect(() => {
    if (owners && owners.length > 0 && selectedClub) {
      loadDogs(owners)
    }
  }, [selectedClub, owners])

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

  useEffect(() => {
    if (selectedClub && practiceId) {
      loadOwners()
      loadAttendances()
    }
  }, [selectedClub, practiceId])

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
      <div className="d-flex justify-content-between mb-3">
        <Button
          variant="secondary"
          onClick={() => onTabChange('details')}
        >
          <ChevronLeft className="me-1" /> Date & Time
        </Button>
        <Button
          variant="primary"
          onClick={() => onTabChange('sets')}
        >
          Sets <ChevronRight className="ms-1" />
        </Button>
      </div>
      <Table striped bordered>
        <thead>
          <tr>
            <th style={{ width: '100px' }}>Attendance</th>
            <th>Owner / Dog</th>
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
                <tr className="table-Secondary">
                  <td className="text-left">
                    <div className="btn-group" role="group">
                      <Button
                        variant={ownerStatus === AttendanceStatus.Yes ? 'success' : 'outline-success'}
                        size="sm"
                        onClick={() => handleOwnerAttendanceChange(ownerId, AttendanceStatus.Yes)}
                        title="All Attending"
                        disabled={isPastPractice || isSaving}
                      >
                        <CheckLg />
                      </Button>
                      <Button
                        variant={ownerStatus === AttendanceStatus.No ? 'danger' : 'outline-danger'}
                        size="sm"
                        onClick={() => handleOwnerAttendanceChange(ownerId, AttendanceStatus.No)}
                        title="All Not Attending"
                        disabled={isPastPractice || isSaving}
                      >
                        <XLg />
                      </Button>
                    </div>
                  </td>
                  <td><strong>{ownerName}</strong></td>
                </tr>
                {ownerDogs.map((dog) => (
                  <tr key={dog.ID}>
                    <td className="text-left">
                      <div className="btn-group" role="group">
                        <Button
                          variant={attendances.get(dog.ID) === AttendanceStatus.Yes ? 'success' : 'outline-success'}
                          size="sm"
                          onClick={() => handleAttendanceChange(dog.ID, AttendanceStatus.Yes)}
                          title="Attending"
                          disabled={isPastPractice || isSaving}
                        >
                          <CheckLg />
                        </Button>
                        <Button
                          variant={attendances.get(dog.ID) === AttendanceStatus.No ? 'danger' : 'outline-danger'}
                          size="sm"
                          onClick={() => handleAttendanceChange(dog.ID, AttendanceStatus.No)}
                          title="Not Attending"
                          disabled={isPastPractice || isSaving}
                        >
                          <XLg />
                        </Button>
                        <Button
                          variant={attendances.get(dog.ID) === AttendanceStatus.Unknown ? 'secondary' : 'outline-secondary'}
                          size="sm"
                          onClick={() => handleAttendanceChange(dog.ID, AttendanceStatus.Unknown)}
                          title="Unknown"
                          disabled={isPastPractice || isSaving}
                        >
                          <DashLg />
                        </Button>
                      </div>
                    </td>
                    <td className="ps-4">{dog.Name}</td>
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
