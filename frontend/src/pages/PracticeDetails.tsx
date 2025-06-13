import { useState, useEffect, useCallback } from 'react'
import { Container, Form, Button, Alert, Spinner, Breadcrumb, Tabs, Tab, Badge, OverlayTrigger, Tooltip, Modal, ListGroup } from 'react-bootstrap'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useClub } from '../contexts/ClubContext'
import { PracticeProvider, usePractice } from '../contexts/PracticeContext'
import { SaveSpinner } from '../components/SaveSpinner'
import { ChevronLeft, ChevronRight, Trash, CheckLg } from 'react-bootstrap-icons'
import { formatRelativeTime, isPastDay } from '../utils/dateUtils'
import { PracticeAttendance } from '../components/PracticeSet/PracticeAttendance'
import { useQuery, useMutation } from '@apollo/client'
import { GetPractice, CreatePractice, UpdatePractice, DeletePractice } from '../graphql/practice'
import { AttendanceStatus, PracticeStatus } from '../graphql/generated/graphql'
import type { Practice, GetPracticeQuery, CreatePracticeMutation, UpdatePracticeMutation, DeletePracticeMutation, PracticeAttendance as PracticeAttendanceType } from '../graphql/generated/graphql'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import { PracticeValidationService, type ValidationError } from '../services/practiceValidation'
import { PracticeValidation } from '../components/PracticeSet/PracticeValidation'
import { PracticeSet } from '../components/PracticeSet'
import { DatePickerComponent } from '../components/PracticeSet/DatePickerComponent'

function PracticeDetailsContent() {
  const navigate = useNavigate()
  const { practiceId } = useParams()
  const location = useLocation()
  const { selectedClub } = useClub()
  const { attendances, isAttendancesLoading } = usePractice()
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])

  const { data: practiceData, loading: isPracticeLoading } = useQuery<GetPracticeQuery>(GetPractice, {
    variables: { id: practiceId! },
    skip: !practiceId,
    onError: (err) => {
      setError('Failed to load practice details. Please try again later.')
      console.error('Error loading practice:', err)
    }
  })

  const [createPractice, { loading: isCreating }] = useMutation<CreatePracticeMutation>(CreatePractice, {
    onError: (err) => {
      setError(err.message)
      setIsDirty(false)
      console.error('Error creating practice:', err)
    }
  })

  const [updatePractice, { loading: isUpdating }] = useMutation<UpdatePracticeMutation>(UpdatePractice, {
    onError: (err) => {
      setError(err.message)
      setIsDirty(false)
      console.error('Error updating practice:', err)
    }
  })

  const [deletePractice, { loading: isDeleting }] = useMutation<DeletePracticeMutation>(DeletePractice, {
    onError: (err) => {
      setError('Failed to delete practice')
      console.error('Error deleting practice:', err)
    },
    onCompleted: () => {
      navigate('/practices')
    }
  })

  const practice = practiceData?.practice
  const isPastPractice = practiceId ? isPastDay(practice?.scheduledAt ?? null) : false
  const isSaving = isCreating || isUpdating

  const getCurrentTab = () => {
    if (!practiceId) return 'date'
    const pathParts = location.pathname.split('/')
    const tab = pathParts[pathParts.length - 1]
    return ['date', 'attendance', 'sets', 'checks'].includes(tab) ? tab : 'date'
  }

  const handleTabChange = (tab: string) => {
    if (!practiceId) return
    navigate(tab === 'date' ? `/practices/${practiceId}` : `/practices/${practiceId}/${tab}`)
  }

  const handleScheduledAtChange = (newScheduledAt: Date) => {
    console.log('newScheduledAt', newScheduledAt)
    setScheduledAt(newScheduledAt)
    setIsDirty(true)
  }

  useEffect(() => {
    if (practice?.scheduledAt) {
      const newDate = new Date(practice.scheduledAt)
      setScheduledAt(newDate)
    }
  }, [practice?.scheduledAt])

  useEffect(() => {
    if (practice) {
      const practiceToValidate: Partial<Practice> = {
        ...practice,
        attendances: attendances as PracticeAttendanceType[]
      }
      const validationResult = PracticeValidationService.validatePractice(practiceToValidate)
      setValidationErrors(validationResult.errors)
    }
  }, [practice, attendances])

  const savePractice = useCallback(async () => {
    if (!selectedClub || !scheduledAt) return

    try {
      if (practiceId) {
        await updatePractice({
          variables: {
            id: practiceId,
            clubId: selectedClub.id,
            scheduledAt
          }
        })
        setIsDirty(false)
      } else {
        const result = await createPractice({
          variables: {
            clubId: selectedClub.id,
            scheduledAt,
            status: PracticeStatus.Draft
          }
        })
        setIsDirty(false)
        const newPracticeId = result.data?.createPractice.id
        if (!newPracticeId) {
          throw new Error('Failed to create practice - no ID returned')
        }
        navigate(`/practices/${newPracticeId}`, {
          replace: true,
          state: { practiceId: newPracticeId }
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save practice')
      setIsDirty(false)
    }
  }, [selectedClub, practiceId, navigate, scheduledAt, createPractice, updatePractice])

  useEffect(() => {
    if (isDirty && !isSaving) {
      savePractice()
    }
  }, [isDirty, isSaving, savePractice])

  const handleStatusChange = async (newStatus: PracticeStatus) => {
    if (!selectedClub || !practiceId) return
    try {
      await updatePractice({
        variables: {
          id: practiceId,
          clubId: selectedClub.id,
          status: newStatus
        }
      })
    } catch (err) {
      setError('Failed to update practice status')
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!practiceId) return
    try {
      await deletePractice({
        variables: { id: practiceId }
      })
    } catch (err) {
      setError('Failed to delete practice')
      console.error(err)
    }
  }

  if (isPracticeLoading) {
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
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate('/practices')}>Practices</Breadcrumb.Item>
        <Breadcrumb.Item active>
          {practiceId ? formatRelativeTime(practice?.scheduledAt) : 'Schedule New Practice'}
        </Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-start mb-2">
        <h1>
          {practice?.scheduledAt ? formatRelativeTime(practice.scheduledAt) : 'New Practice'}
        </h1>
        <div className="d-flex flex-column align-items-end gap-2">
          {practiceId && (
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => setShowDeleteModal(true)}
              disabled={isDeleting}
            >
              <Trash className="me-2" /> {isPastPractice ? 'Delete' : 'Cancel'}
            </Button>
          )}
          {!isPastPractice && practice && (
            <Form.Check
              type="switch"
              id="status-toggle"
              label="Mark as Ready"
              className="fs-5"
              checked={practice.status === PracticeStatus.Ready}
              onChange={(e) => handleStatusChange(e.target.checked ? PracticeStatus.Ready : PracticeStatus.Draft)}
              disabled={validationErrors.some(error => error.severity === 'error')}
            />
          )}
        </div>
      </div>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Confirm Practice Cancellation"
        message="Are you sure you want to cancel this practice? This action cannot be undone."
        confirmButtonText="Cancel Practice"
      />

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      <Tabs activeKey={getCurrentTab()} onSelect={(k) => handleTabChange(k || 'date')}>
        <Tab eventKey="date" title={
          <span>
            {practice?.scheduledAt ? <CheckLg className="me-2 text-success" /> : ""}
            Date & Time
          </span>
        }>
          <Form>
            <DatePickerComponent isPastPractice={isPastPractice} initialScheduledAt={practice?.scheduledAt} onChange={handleScheduledAtChange} />
            <div className="d-flex justify-content-end">
              {!practiceId ? (
                <OverlayTrigger overlay={<Tooltip>Practice must be scheduled first.</Tooltip>} placement="left">
                  <span className="d-inline-block">
                    <Button
                      variant="outline-primary"
                      disabled
                      onClick={() => handleTabChange('attendance')}
                    >
                      Attendance <ChevronRight className="ms-1" />
                    </Button>
                  </span>
                </OverlayTrigger>
              ) : (
                <Button
                  variant="outline-primary"
                  onClick={() => handleTabChange('attendance')}
                >
                  Attendance <ChevronRight className="ms-1" />
                </Button>
              )}
            </div>
          </Form>
        </Tab>

        <Tab
          eventKey="attendance"
          title={
            <span>
              {!attendances.some(a => a.attending === AttendanceStatus.Unknown) ? <CheckLg className="me-2 text-success" /> : ""}
              Attendance
              {isAttendancesLoading ? (
                <Spinner animation="border" size="sm" className="ms-2" />
              ) : (
                  <Badge bg="primary" className="ms-2">
                    {attendances.filter(a => a.attending === AttendanceStatus.Attending).length}
                  </Badge>
              )}
            </span>
          }>
          {practiceId && (
            <PracticeAttendance
              practiceId={practiceId}
              isPastPractice={isPastPractice}
            />
          )}
          <div className="d-flex justify-content-between mb-3">
            <Button
              variant="outline-secondary"
              onClick={() => handleTabChange('date')}
            >
              <ChevronLeft className="me-1" /> Date & Time
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => handleTabChange('sets')}
            >
              Sets <ChevronRight className="ms-1" />
            </Button>
          </div>
        </Tab>

        <Tab eventKey="sets" title="Sets">
          {practiceId && (
            <PracticeSet
              practiceId={practiceId}
              isPastPractice={isPastPractice}
            />
          )}
          <div className="d-flex justify-content-between mb-3">
            <Button
              variant="outline-secondary"
              onClick={() => handleTabChange('attendance')}
            >
              <ChevronLeft className="me-1" /> Attendance
            </Button>
            <Button
              variant="outline-primary"
              onClick={() => handleTabChange('checks')}
            >
              Checks <ChevronRight className="ms-1" />
            </Button>
          </div>
        </Tab>

        <Tab
          eventKey="checks"
          title={
            <span>
              Checks
              {isAttendancesLoading ?
                <Spinner animation="border" size="sm" className="ms-2" /> :
                validationErrors.length > 0 && (
                  <Badge bg="primary" className="ms-2">
                    {validationErrors.length}
                  </Badge>
                )}
            </span>
          }
        >
          {isAttendancesLoading ?
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner> :
            <PracticeValidation validationErrors={validationErrors} />
          }
          <div className="d-flex justify-content-start mb-3">
            <Button
              variant="outline-secondary"
              onClick={() => handleTabChange('sets')}
            >
              <ChevronLeft className="me-1" /> Sets
            </Button>
          </div>
        </Tab>
      </Tabs>

      <SaveSpinner show={isSaving} />
    </Container>
  )
}

function PracticeDetails() {
  return (
    <PracticeProvider>
      <PracticeDetailsContent />
    </PracticeProvider>
  )
}

export default PracticeDetails
