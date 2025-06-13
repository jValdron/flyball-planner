import React, { useState, useEffect } from 'react'
import { Button, Table } from 'react-bootstrap'
import { CheckLg, XLg } from 'react-bootstrap-icons'
import { useClub } from '../../contexts/ClubContext'
import { usePractice } from '../../contexts/PracticeContext'
import { SaveSpinner } from '../SaveSpinner'
import { useQuery, useMutation } from '@apollo/client'
import { GetDogsByHandlersInClub } from '../../graphql/dogs'
import { GetPracticeAttendances, UpdateAttendances } from '../../graphql/attendance'
import { AttendanceStatus, DogStatus } from '../../graphql/generated/graphql'
import type { Dog, GetDogsByHandlersInClubQuery, GetPracticeAttendancesQuery, UpdateAttendancesMutation } from '../../graphql/generated/graphql'

const SAVE_DELAY = 1500

interface PracticeAttendanceProps {
  practiceId: string
  isPastPractice: boolean
}

export function PracticeAttendance({ practiceId, isPastPractice }: PracticeAttendanceProps) {
  const { selectedClub } = useClub()
  const { setAttendances, updateAttendance, getAttendance, setIsAttendancesLoading } = usePractice()
  const [isSaving, setIsSaving] = useState(false)
  const [pendingUpdates, setPendingUpdates] = useState<{ dogId: string, attending: AttendanceStatus }[]>([])

  const { data: ownersData, loading: ownersLoading } = useQuery<GetDogsByHandlersInClubQuery>(GetDogsByHandlersInClub, {
    variables: { clubId: selectedClub?.id! },
    skip: !selectedClub?.id
  })

  const { data: attendanceData, refetch, loading: attendanceLoading } = useQuery<GetPracticeAttendancesQuery>(GetPracticeAttendances, {
    variables: { practiceId },
    skip: !practiceId
  })

  const [updateAttendances] = useMutation<UpdateAttendancesMutation>(UpdateAttendances)

  useEffect(() => {
    setIsAttendancesLoading(ownersLoading || attendanceLoading)
  }, [ownersLoading, attendanceLoading, setIsAttendancesLoading])

  useEffect(() => {
    if (attendanceData?.practiceAttendances && ownersData?.dogsByHandlersInClub) {
      const attendanceMap = new Map(
        attendanceData.practiceAttendances.map(a => [a.dogId, a.attending])
      )

      const allDogs = ownersData.dogsByHandlersInClub
        .flatMap(owner =>
          owner.dogs.filter(dog => dog.status === DogStatus.Active).map(dog => ({
            dog: dog as Dog,
            dogId: dog.id,
            attending: attendanceMap.get(dog.id) || AttendanceStatus.Unknown
          }))
        )

      setAttendances(allDogs)
    }
  }, [attendanceData, ownersData, setAttendances])

  useEffect(() => {
    if (pendingUpdates.length === 0) return
    const timer = setTimeout(async () => {
      if (!selectedClub || !practiceId) return
      try {
        setIsSaving(true)
        await updateAttendances({
          variables: {
            practiceId,
            updates: pendingUpdates.map(u => ({ dogId: u.dogId, attending: u.attending }))
          }
        })
        setPendingUpdates([])
        refetch()
      } catch (err) {
      } finally {
        setIsSaving(false)
      }
    }, SAVE_DELAY)
    return () => clearTimeout(timer)
  }, [pendingUpdates, selectedClub, practiceId, updateAttendances, refetch])

  const handleAttendanceChange = (dogId: string, status: AttendanceStatus) => {
    updateAttendance(dogId, status)

    setPendingUpdates(prev => {
      const existingUpdate = prev.find(u => u.dogId === dogId)
      if (existingUpdate) {
        return prev.map(u => u.dogId === dogId ? { ...u, attending: status } : u)
      }
      return [...prev, { dogId, attending: status }]
    })
  }

  const handleOwnerAttendanceChange = (ownerId: string, status: AttendanceStatus) => {
    const ownerDogs = ownersData?.dogsByHandlersInClub?.find(o => o.id === ownerId)?.dogs || []

    ownerDogs.forEach(dog => {
      updateAttendance(dog.id, status)
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
      <Table striped bordered hover>
        <tbody>
          {[...(ownersData?.dogsByHandlersInClub || [])]
            .filter(owner => owner.dogs.some(dog => dog.status === DogStatus.Active))
            .sort((a, b) => a.givenName.localeCompare(b.givenName))
            .map(owner => {
            const ownerDogs = owner.dogs.filter(dog => dog.status === DogStatus.Active)
            const ownerName = `${owner.givenName} ${owner.surname}`
            const allDogsSameStatus = ownerDogs.length > 0 && ownerDogs.every(dog =>
              getAttendance(dog.id) === getAttendance(ownerDogs[0].id)
            )
            const ownerStatus = allDogsSameStatus ?
              getAttendance(ownerDogs[0].id) || AttendanceStatus.Unknown :
              AttendanceStatus.Unknown

            return (
              <React.Fragment key={owner.id}>
                <tr
                  className="table-secondary"
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    if (!isPastPractice && !isSaving) {
                      const newStatus = ownerStatus === AttendanceStatus.Attending ?
                        AttendanceStatus.NotAttending :
                        AttendanceStatus.Attending
                      handleOwnerAttendanceChange(owner.id, newStatus)
                    }
                  }}
                >
                  <td className="w-100"><strong>{ownerName}</strong></td>
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
                        disabled={isPastPractice}
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
                        disabled={isPastPractice}
                      >
                        <XLg />
                      </Button>
                    </div>
                  </td>
                </tr>
                {ownerDogs.map(dog => {
                  const dogAttendance = getAttendance(dog.id)
                  return (
                    <tr
                      key={dog.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        if (!isPastPractice && !isSaving) {
                          const newStatus = dogAttendance === AttendanceStatus.Attending ?
                            AttendanceStatus.NotAttending :
                            AttendanceStatus.Attending
                          handleAttendanceChange(dog.id, newStatus)
                        }
                      }}
                    >
                      <td className="ps-4">{dog.name}</td>
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
                            disabled={isPastPractice}
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
                            disabled={isPastPractice}
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
          })}
        </tbody>
      </Table>
      <SaveSpinner show={isSaving} />
    </React.Fragment>
  )
}
