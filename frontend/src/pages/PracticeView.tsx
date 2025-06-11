import { useState, useEffect, useCallback } from 'react'
import React from 'react'
import { Container, Form, Button, Alert, Spinner, Breadcrumb, Tabs, Tab, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { practiceService } from '../services/practiceService'
import type { Practice, PracticeStatus } from '../services/practiceService'
import { useClub } from '../contexts/ClubContext'
import Calendar from 'react-calendar'
import 'react-calendar/dist/Calendar.css'
import { CALENDAR_TYPES } from 'react-calendar/dist/shared/const.js'
import { SaveSpinner } from '../components/SaveSpinner'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, CalendarCheck, CalendarX } from 'react-bootstrap-icons'
import { formatRelativeTime, formatTime, isPastDay } from '../utils/dateUtils'
import { PracticeAttendance } from '../components/PracticeAttendance'

function PracticeView() {
  const navigate = useNavigate()
  const { practiceId } = useParams()
  const location = useLocation()
  const { selectedClub } = useClub()
  const [practice, setPractice] = useState<Practice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null)
  const [scheduledTime, setScheduledTime] = useState<string>('')
  const [isDirty, setIsDirty] = useState(false)
  const isPastPractice = practiceId ? isPastDay(practice?.ScheduledAt ?? null) : false

  const getCurrentTab = () => {
    if (!practiceId) return 'date'
    const pathParts = location.pathname.split('/')
    const tab = pathParts[pathParts.length - 1]
    return ['date', 'attendance', 'sets'].includes(tab) ? tab : 'date'
  }

  const handleTabChange = (tab: string) => {
    if (!practiceId) return
    navigate(tab === 'date' ? `/practices/${practiceId}` : `/practices/${practiceId}/${tab}`)
  }

  useEffect(() => {
    if (!selectedClub) {
      return;
    }

    if (practiceId) {
      loadPractice()
    } else {
      setLoading(false)
    }
  }, [practiceId, selectedClub])

  useEffect(() => {
    if (selectedClub?.DefaultPracticeTime && !practiceId) {
      setScheduledTime(selectedClub.DefaultPracticeTime)
    }
  }, [selectedClub, practiceId])

  const loadPractice = async () => {
    try {
      if (!selectedClub || !practiceId) return
      setLoading(true)
      setError(null)
      const data = await practiceService.getPractice(selectedClub.ID, practiceId)
      setPractice(data)
      if (data?.ScheduledAt) {
        const date = new Date(data.ScheduledAt)
        setScheduledDate(date)
        setScheduledTime(date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }))
      }
    } catch (err) {
      setError('Failed to load practice details. Please try again later.')
      console.error('Error loading practice:', err)
    } finally {
      setLoading(false)
    }
  }

  const savePractice = useCallback(async () => {
    if (!selectedClub || !scheduledDate || !scheduledTime) return

    const [hours, minutes] = scheduledTime.split(':')
    const combinedDate = new Date(scheduledDate)
    combinedDate.setHours(parseInt(hours), parseInt(minutes))
    const scheduledAt = combinedDate.toISOString()

    try {
      setIsSaving(true)
      if (practiceId) {
        const updatedPractice = await practiceService.updatePractice(selectedClub.ID, practiceId, {
          ScheduledAt: scheduledAt
        })
        setPractice(updatedPractice)
        setIsDirty(false)
      } else {
        const newPractice = await practiceService.createPractice(selectedClub.ID, {
          ClubId: selectedClub.ID,
          ScheduledAt: scheduledAt,
          Status: 'Draft'
        })
        setPractice(newPractice)
        setIsDirty(false)
        navigate(`/practices/${newPractice.ID}`, {
          replace: true,
          state: { practiceId: newPractice.ID }
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save practice')
      setIsDirty(false)
      console.error('Error saving practice:', err)
    } finally {
      setIsSaving(false)
    }
  }, [selectedClub, practiceId, navigate, scheduledDate, scheduledTime])

  useEffect(() => {
    if (isDirty && !isSaving) {
      savePractice()
    }
  }, [isDirty, isSaving, savePractice])

  const handleDateChange = (date: Date) => {
    setScheduledDate(date)
    setIsDirty(true)
  }

  const handleTimeChange = (time: string) => {
    setScheduledTime(time)
    setIsDirty(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedClub || !scheduledDate || !scheduledTime) return
    try {
      setError(null)
      await savePractice()
      navigate('/practices')
    } catch (err) {
      setError('Failed to save practice. Please try again later.')
      console.error('Error saving practice:', err)
    }
  }

  const handleStatusChange = async (newStatus: PracticeStatus) => {
    if (!selectedClub || !practiceId) return
    try {
      const updatedPractice = await practiceService.updatePractice(selectedClub.ID, practiceId, {
        Status: newStatus
      })
      setPractice(updatedPractice)
    } catch (err) {
      setError('Failed to update practice status')
      console.error(err)
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
          {practiceId ? isPastPractice ? 'View Practice' : 'Edit Practice' : 'Schedule New Practice'}
        </Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <h1>
          {practice?.ScheduledAt ? <>
              {formatRelativeTime(practice.ScheduledAt)}
            </>
          : 'New Practice'}
        </h1>
        {!isPastPractice && practice && (
          <Form.Check
            type="switch"
            id="status-toggle"
            label="Mark as Ready"
            className="fs-5"
            checked={practice.Status === 'Ready'}
            onChange={(e) => handleStatusChange(e.target.checked ? 'Ready' : 'Draft')}
          />
        )}
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Tabs activeKey={getCurrentTab()} onSelect={(k) => handleTabChange(k || 'date')}>
        <Tab eventKey="date" title="Date & Time">
          <Form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Calendar
                    calendarType={CALENDAR_TYPES.GREGORY}
                    className="w-100"
                    minDate={isPastPractice ? undefined : new Date()}
                    showNavigation={!isPastPractice}
                    prevLabel={<ChevronLeft />}
                    nextLabel={<ChevronRight />}
                    tileClassName={({ date }) => {
                      const today = new Date()
                      if (date.toDateString() === today.toDateString()) {
                        return 'today'
                      }
                      if (scheduledDate && date.toDateString() === scheduledDate.toDateString()) {
                        return 'selected'
                      }
                      return null
                    }}
                    tileDisabled={({date}) => isPastPractice && scheduledDate?.toDateString() !== date.toDateString()}
                    onChange={(value) => {
                      if (!isPastPractice && value instanceof Date) {
                        handleDateChange(value)
                      }
                    }}
                    value={scheduledDate}
                  />
                  <div className="mt-2">
                    <Badge bg="success" className="d-inline-block me-2"><CalendarIcon /> Today</Badge>
                    <Badge bg="primary" className="d-inline-block me-2"><CalendarCheck /> Selected</Badge>
                    <Badge bg="past" className="d-inline-block me-2"><CalendarX /> Past</Badge>
                  </div>
                </Form.Group>
              </div>
              <div className="col-md-6">
                <Form.Group className="mb-3">
                  <Form.Label>Time</Form.Label>
                  <Form.Control
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    disabled={isPastPractice}
                  />
                </Form.Group>
              </div>
            </div>
          </Form>
          <div className="d-flex justify-content-end">
            {!practiceId ? (
              <OverlayTrigger overlay={<Tooltip>Practice must be scheduled first.</Tooltip>} placement="left">
                <span className="d-inline-block">
                  <Button
                    variant="primary"
                    disabled
                    onClick={() => handleTabChange('attendance')}
                  >
                    Attendance <ChevronRight className="ms-1" />
                  </Button>
                </span>
              </OverlayTrigger>
            ) : (
              <Button
                variant="primary"
                onClick={() => handleTabChange('attendance')}
              >
                Attendance <ChevronRight className="ms-1" />
              </Button>
            )}
          </div>
        </Tab>

        <Tab eventKey="attendance" title="Attendance">
          {practiceId && (
            <PracticeAttendance
              practiceId={practiceId}
              isPastPractice={isPastPractice}
            />
          )}
          <div className="d-flex justify-content-between mb-3">
            <Button
              variant="secondary"
              onClick={() => handleTabChange('date')}
            >
              <ChevronLeft className="me-1" /> Date & Time
            </Button>
            <Button
              variant="primary"
              onClick={() => handleTabChange('sets')}
            >
              Sets <ChevronRight className="ms-1" />
            </Button>
          </div>
        </Tab>

        <Tab eventKey="sets" title="Sets">
          <Alert variant="info">
            Practice sets management will be implemented in a future update.
          </Alert>
          <div className="d-flex justify-content-start mb-3">
            <Button
              variant="secondary"
              onClick={() => handleTabChange('attendance')}
            >
              <ChevronLeft className="me-1" /> Attendance
            </Button>
          </div>
        </Tab>
      </Tabs>

      <SaveSpinner show={isSaving} />
    </Container>
  )
}

export default PracticeView
