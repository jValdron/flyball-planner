import { Form } from 'react-bootstrap'
import Calendar from 'react-calendar'
import { Calendar as CalendarIcon, CalendarCheck, CalendarX, ChevronLeft, ChevronRight } from 'react-bootstrap-icons'
import { Badge } from 'react-bootstrap'
import { CALENDAR_TYPES } from 'react-calendar/dist/shared/const.js'
import { useClub } from '../../contexts/ClubContext'
import { useEffect, useState } from 'react'

interface DatePickerComponentProps {
  initialScheduledAt: Date | null
  onChange: (scheduledAt: Date) => void
}

export function DatePickerComponent({ initialScheduledAt, onChange }: DatePickerComponentProps) {
  const { selectedClub } = useClub()

  const [scheduledAt, setScheduledAt] = useState<Date | null>(initialScheduledAt)
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null)
  const [scheduledTime, setScheduledTime] = useState<string>('')

  useEffect(() => {
    if (initialScheduledAt) {
      const date = new Date(initialScheduledAt)
      setScheduledDate(date)
      setScheduledTime(date.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }))
    }
  }, [initialScheduledAt])

  useEffect(() => {
    if (selectedClub?.defaultPracticeTime && !scheduledTime && !scheduledAt) {
      setScheduledTime(selectedClub.defaultPracticeTime)
    }
  }, [selectedClub, scheduledTime, scheduledAt])

  useEffect(() => {
    if (scheduledDate && scheduledTime) {
      const [hours, minutes] = scheduledTime.split(':')
      const newScheduledAt = new Date(scheduledDate)
      newScheduledAt.setHours(parseInt(hours), parseInt(minutes))

      if (!scheduledAt || newScheduledAt.getTime() !== new Date(scheduledAt).getTime()) {
        setScheduledAt(newScheduledAt)
        onChange(newScheduledAt)
      }
    }
  }, [scheduledDate, scheduledTime, setScheduledAt, onChange])

  const handleDateChange = (date: Date) => {
    setScheduledDate(date)
  }

  const handleTimeChange = (time: string) => {
    setScheduledTime(time)
  }

  return (
    <div className="row">
      <div className="col-md-6">
        <Form.Group className="mb-3">
          <Calendar
            calendarType={CALENDAR_TYPES.GREGORY}
            className="w-100"
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
            onChange={(value) => {
              if (value instanceof Date) {
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
          />
        </Form.Group>
      </div>
    </div>
  )
}
