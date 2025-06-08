import { useState, useEffect } from 'react'
import { Container, Form, Button, Alert, Spinner, Breadcrumb, Tabs, Tab, Table } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import { practiceService } from '../services/practiceService'
import type { Practice } from '../services/practiceService'
import { dogService } from '../services/dogService'
import type { Dog } from '../services/dogService'
import { ownerService } from '../services/ownerService'
import type { Owner } from '../services/ownerService'
import { useClub } from '../contexts/ClubContext'
import Calendar from 'react-calendar'
import type { CalendarType } from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { CALENDAR_TYPES } from 'react-calendar/dist/shared/const.js'

type PracticeFormData = {
  scheduledDate: Date | null
  scheduledTime: string
  scheduledAt: string | null
}

type AttendanceStatus = 'unknown' | 'yes' | 'no'

interface DogAttendance {
  dogId: string
  name: string
  ownerId: string
  ownerName: string
  status: AttendanceStatus
}

function PracticeView() {
  const navigate = useNavigate()
  const { practiceId } = useParams()
  const { selectedClubId, selectedClub } = useClub()
  const [practice, setPractice] = useState<Practice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [dogs, setDogs] = useState<DogAttendance[]>([])
  const [owners, setOwners] = useState<Owner[]>([])
  const [formData, setFormData] = useState<PracticeFormData>({
    scheduledDate: null,
    scheduledTime: selectedClub?.DefaultPracticeTime || '',
    scheduledAt: null
  })

  useEffect(() => {
    if (!selectedClubId) {
      return;
    }

    if (practiceId) {
      loadPractice()
    } else {
      setLoading(false)
      setIsEditMode(true)
    }
    loadOwners()
  }, [practiceId, selectedClubId, selectedClub])

  useEffect(() => {
    if (selectedClub?.DefaultPracticeTime && !practiceId) {
      setFormData(prev => ({
        ...prev,
        scheduledTime: selectedClub.DefaultPracticeTime
      }))
    }
  }, [selectedClub, practiceId])

  const loadOwners = async () => {
    try {
      const data = await ownerService.getOwners()
      setOwners(data)
      loadDogs(data)
    } catch (err) {
      console.error('Error loading owners:', err)
    }
  }

  const loadDogs = async (ownersList: Owner[]) => {
    try {
      if (!selectedClubId) return
      const data = await dogService.getDogsByClub(selectedClubId as string)
      const ownerMap = new Map(ownersList.map(owner => [owner.ID, owner]))
      const dogsWithOwners = data.map(dog => {
        const owner = ownerMap.get(dog.OwnerID)
        return {
          dogId: dog.ID,
          name: dog.Name,
          ownerId: dog.OwnerID,
          ownerName: owner ? `${owner.GivenName} ${owner.Surname}` : 'Unknown Owner',
          status: 'unknown' as AttendanceStatus
        }
      })
      const sortedDogs = dogsWithOwners.sort((a, b) => {
        const ownerCompare = a.ownerName.localeCompare(b.ownerName)
        if (ownerCompare !== 0) return ownerCompare
        return a.name.localeCompare(b.name)
      })
      setDogs(sortedDogs)
    } catch (err) {
      console.error('Error loading dogs:', err)
    }
  }

  const loadPractice = async () => {
    try {
      if (!selectedClubId || !practiceId) return
      setLoading(true)
      setError(null)
      const data = await practiceService.getPractice(selectedClubId as string, practiceId)
      setPractice(data)
      if (data.scheduledAt) {
        const date = new Date(data.scheduledAt)
        setFormData({
          scheduledDate: date,
          scheduledTime: date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }),
          scheduledAt: data.scheduledAt
        })
      }
    } catch (err) {
      setError('Failed to load practice details. Please try again later.')
      console.error('Error loading practice:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (date: Date) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        scheduledDate: date
      }
      if (prev.scheduledTime) {
        const [hours, minutes] = prev.scheduledTime.split(':')
        const combinedDate = new Date(date)
        combinedDate.setHours(parseInt(hours), parseInt(minutes))
        newData.scheduledAt = combinedDate.toISOString()
      }
      return newData
    })
  }

  const handleTimeChange = (time: string) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        scheduledTime: time
      }
      if (prev.scheduledDate) {
        const [hours, minutes] = time.split(':')
        const combinedDate = new Date(prev.scheduledDate)
        combinedDate.setHours(parseInt(hours), parseInt(minutes))
        newData.scheduledAt = combinedDate.toISOString()
      }
      return newData
    })
  }

  const handleAttendanceChange = (dogId: string, status: AttendanceStatus) => {
    setDogs(prev => prev.map(dog =>
      dog.dogId === dogId ? { ...dog, status } : dog
    ))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClubId) return
    try {
      setError(null)
      if (practiceId) {
        await practiceService.updatePractice(selectedClubId as string, practiceId, { scheduledAt: formData.scheduledAt })
      } else {
        await practiceService.createPractice(selectedClubId as string, {
          clubId: selectedClubId as string,
          scheduledAt: formData.scheduledAt
        })
      }
      navigate('/practices')
    } catch (err) {
      setError('Failed to save practice. Please try again later.')
      console.error('Error saving practice:', err)
    }
  }

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    )
  }

  return (
    <Container>
      <Breadcrumb className="mt-3">
        <div className="breadcrumb-item" onClick={() => navigate('/practices')} style={{ cursor: 'pointer' }}>Practices</div>
        <Breadcrumb.Item active>
          {practiceId ? (isEditMode ? 'Edit Practice' : 'View Practice') : 'Schedule New Practice'}
        </Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <h1>
          {practiceId
            ? (isEditMode ? 'Edit Practice' : 'View Practice')
            : formData.scheduledAt
              ? <>
                  {new Date(formData.scheduledAt).toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                  })}
                  <div className="d-block d-md-inline ms-md-2 ms-0">
                    <small className="text-muted fs-3">
                      at {new Date(formData.scheduledAt).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </small>
                  </div>
                </>
              : 'New Practice'}
        </h1>
        {practiceId && (
          <Button
            variant={isEditMode ? 'secondary' : 'primary'}
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? 'Cancel Edit' : 'Edit Practice'}
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Tabs defaultActiveKey="date">
        <Tab eventKey="date" title="Date & Time">
          <Form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Calendar
                    onChange={(value) => {
                      if (value instanceof Date) {
                        handleDateChange(value)
                      }
                    }}
                    value={formData.scheduledDate}
                    minDate={new Date()}
                    className="w-100"
                    calendarType={CALENDAR_TYPES.GREGORY}
                    navigationLabel={({ date }) => date.toLocaleString('default', { month: 'long' })}
                    prevLabel={<i className="bi bi-chevron-left"></i>}
                    nextLabel={<i className="bi bi-chevron-right"></i>}
                    tileClassName={({ date }) => {
                      const today = new Date()
                      if (date.toDateString() === today.toDateString()) {
                        return 'today'
                      }
                      if (formData.scheduledDate && date.toDateString() === formData.scheduledDate.toDateString()) {
                        return 'selected'
                      }
                      return null
                    }}
                  />
                  <div className="mt-2">
                    <small className="text-muted">
                      <span className="d-inline-block me-1">
                        <span className="badge bg-success me-1"><i className="bi bi-calendar me-1"></i>Today</span>
                      </span>
                      <span className="d-inline-block me-2">
                        <span className="badge bg-primary me-1"><i className="bi bi-calendar-check me-1"></i>Selected</span>
                      </span>
                      <span className="d-inline-block">
                        <span className="badge bg-past me-1"><i className="bi bi-calendar-x me-1"></i>Past</span>
                      </span>
                    </small>
                  </div>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={formData.scheduledTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    disabled={!isEditMode}
                  />
                </Form.Group>
              </div>
            </div>

            {isEditMode && (
              <div className="d-flex gap-2">
                <Button type="submit" variant="primary">
                  {practiceId ? 'Save Changes' : 'Create Practice'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/practices')}
                >
                  Cancel
                </Button>
              </div>
            )}
          </Form>
        </Tab>

        <Tab eventKey="attendance" title="Attendance">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th style={{ width: '100px' }}>Attendance</th>
                <th>Owner</th>
                <th>Dog</th>
              </tr>
            </thead>
            <tbody>
              {dogs.map((dog) => (
                <tr key={dog.dogId}>
                  <td className="text-center">
                    <div className="btn-group" role="group">
                      <Button
                        variant={dog.status === 'yes' ? 'success' : 'outline-success'}
                        size="sm"
                        onClick={() => handleAttendanceChange(dog.dogId, 'yes')}
                        disabled={!isEditMode}
                        title="Attending"
                      >
                        <i className="bi bi-check-lg"></i>
                      </Button>
                      <Button
                        variant={dog.status === 'no' ? 'danger' : 'outline-danger'}
                        size="sm"
                        onClick={() => handleAttendanceChange(dog.dogId, 'no')}
                        disabled={!isEditMode}
                        title="Not Attending"
                      >
                        <i className="bi bi-x-lg"></i>
                      </Button>
                      <Button
                        variant={dog.status === 'unknown' ? 'secondary' : 'outline-secondary'}
                        size="sm"
                        onClick={() => handleAttendanceChange(dog.dogId, 'unknown')}
                        disabled={!isEditMode}
                        title="Unknown"
                      >
                        <i className="bi bi-dash-lg"></i>
                      </Button>
                    </div>
                  </td>
                  <td>{dog.ownerName}</td>
                  <td>{dog.name}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Tab>

        <Tab eventKey="sets" title="Sets">
          <Alert variant="info">
            Practice sets management will be implemented in a future update.
          </Alert>
        </Tab>
      </Tabs>
    </Container>
  )
}

export default PracticeView
