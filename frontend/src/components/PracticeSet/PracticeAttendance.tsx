import React, { useState, useEffect } from 'react'
import { Button, Table } from 'react-bootstrap'
import { CheckLg, XLg } from 'react-bootstrap-icons'
import { useClub } from '../../contexts/ClubContext'
import { usePractice } from '../../contexts/PracticeContext'
import { useMutation } from '@apollo/client'
import { UpdateAttendances } from '../../graphql/attendance'
import { AttendanceStatus, DogStatus } from '../../graphql/generated/graphql'
import type { UpdateAttendancesMutation } from '../../graphql/generated/graphql'
import { useTheme } from '../../contexts/ThemeContext'

const SAVE_DELAY = 25

interface PracticeAttendanceProps {
  practiceId: string
  isPastPractice: boolean
}

export function PracticeAttendance({ practiceId, isPastPractice }: PracticeAttendanceProps) {
  const { selectedClub, dogsByHandlersInSelectedClub } = useClub()
  const { isDark } = useTheme()
  const { getAttendance } = usePractice()
  const [pendingUpdates, setPendingUpdates] = useState<{ dogId: string, attending: AttendanceStatus }[]>([])

  const [updateAttendances] = useMutation<UpdateAttendancesMutation>(UpdateAttendances)

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
      } catch (err) {
        console.error('Error updating attendances:', err)
      }
    }, SAVE_DELAY)
    return () => clearTimeout(timer)
  }, [pendingUpdates, selectedClub, practiceId, updateAttendances])

  const handleAttendanceChange = (dogId: string, status: AttendanceStatus) => {
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
      <Table striped bordered hover className="align-middle">
        <tbody>
          {[...dogsByHandlersInSelectedClub]
            .filter(owner => owner.dogs?.some(dog => dog.status === DogStatus.Active))
            .sort((a, b) => a.givenName.localeCompare(b.givenName))
            .map(owner => {
              const ownerDogs = owner.dogs?.filter(dog => dog.status === DogStatus.Active) || []
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
                    className={`${isDark ? 'table-dark' : 'table-secondary'}`}
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      if (!isPastPractice) {
                        const newStatus = ownerStatus === AttendanceStatus.Attending ?
                          AttendanceStatus.NotAttending :
                          AttendanceStatus.Attending
                        handleOwnerAttendanceChange(owner.id, newStatus)
                      }
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
                          if (!isPastPractice) {
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
    </React.Fragment>
  )
}
