import { useState, useEffect, useCallback } from 'react'
import { Container, Form, Button, Alert, Spinner, Breadcrumb, Tabs, Tab, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useClub } from '../contexts/ClubContext'
import { PracticeProvider, usePractice } from '../contexts/PracticeContext'
import { SaveSpinner } from '../components/SaveSpinner'
import { ChevronLeft, ChevronRight, Trash, CheckLg, Share, Pencil } from 'react-bootstrap-icons'
import { formatRelativeTime, isPastDay } from '../utils/dateUtils'
import { PracticeAttendance } from '../components/PracticeSet/PracticeAttendance'
import { useMutation } from '@apollo/client'
import { CreatePractice, UpdatePractice, DeletePractice } from '../graphql/practice'
import { AttendanceStatus, PracticeStatus } from '../graphql/generated/graphql'
import type { CreatePracticeMutation, UpdatePracticeMutation, DeletePracticeMutation } from '../graphql/generated/graphql'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import { PracticeValidationService, type ValidationError } from '../services/practiceValidation'
import { PracticeValidation } from '../components/PracticeSet/PracticeValidation'
import { PracticeSet } from '../components/PracticeSet/PracticeSet'
import { DatePickerComponent } from '../components/PracticeSet/DatePickerComponent'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

function PracticeDetailsContent() {
  const navigate = useNavigate()
  const { practiceId } = useParams()
  const location = useLocation()
  const { selectedClub, dogs, handlers } = useClub()
  const {
    practice,
    isPracticeLoading,
    practiceError,
    attendances,
    sets
  } = usePractice()
  const [scheduledAt, setScheduledAt] = useState<Date | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isLocked, setIsLocked] = useState(true) // Start locked for past practices

  const title = practiceId
    ? (practice?.scheduledAt ? formatRelativeTime(practice.scheduledAt) : 'Practice Details')
    : 'New Practice'
  useDocumentTitle(title)

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

  const isPastPractice = practiceId ? isPastDay(practice?.scheduledAt ?? null) : false
  const isSaving = isCreating || isUpdating

  // Set initial lock state based on whether it's a past practice
  useEffect(() => {
    if (practiceId) {
      setIsLocked(isPastPractice)
    } else {
      setIsLocked(false) // New practices are not locked
    }
  }, [practiceId, isPastPractice])

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
      const practiceToValidate = {
        id: practice.id,
        scheduledAt: practice.scheduledAt,
        status: practice.status,
        clubId: practice.clubId,
        attendances: attendances as any,
        sets: sets as any
      }
      const validationContext = { dogs, handlers, idealSetsPerDog: selectedClub?.idealSetsPerDog ?? 2 }
      const validationResult = PracticeValidationService.validatePractice(practiceToValidate, validationContext)
      setValidationErrors(validationResult.errors)
    }
  }, [practice, attendances, sets, dogs, handlers])

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

  const handleShare = () => {
    if (!practiceId || !practice?.shareCode) return

    navigate(`/practices/${practiceId}/view?code=${practice.shareCode}`)
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

  if (practiceError) {
    return (
      <Container>
        <Alert variant="danger" className="mt-4">
          {practiceError}
        </Alert>
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
            <div className="d-flex gap-2">
              <Button
                variant="outline-primary"
                size="sm"
                onClick={handleShare}
                disabled={!practice?.shareCode}
              >
                <Share className="me-2" /> Share
              </Button>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => setShowDeleteModal(true)}
                disabled={isDeleting}
              >
                <Trash className="me-2" /> {isPastPractice ? 'Delete' : 'Cancel'}
              </Button>
            </div>
          )}
          {practice && (() => {
            const hasValidationErrors = validationErrors.some(error => error.severity === 'error')
            const isCurrentlyDraft = practice.status === PracticeStatus.Draft
            const shouldDisable = hasValidationErrors && isCurrentlyDraft

            if (isPastPractice) {
              return (
                <Form.Check
                  type="switch"
                  id="unlock-toggle"
                  label="Unlock for editing"
                  checked={!isLocked}
                  onChange={(e) => setIsLocked(!e.target.checked)}
                />
              )
            }

            const formCheck = (
              <Form.Check
                type="switch"
                id="status-toggle"
                label="Mark as Ready"
                checked={practice.status === PracticeStatus.Ready}
                onChange={(e) => handleStatusChange(e.target.checked ? PracticeStatus.Ready : PracticeStatus.Draft)}
                disabled={shouldDisable}
              />
            )

            return shouldDisable ? (
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip>
                    You must fix validation <strong>errors</strong> in the <em>Checks</em> tab before marking as ready
                  </Tooltip>
                }
              >
                <div>{formCheck}</div>
              </OverlayTrigger>
            ) : formCheck
          })()}
        </div>
      </div>

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title={isPastPractice ? "Confirm Practice Deletion" : "Confirm Practice Cancellation"}
        message={isPastPractice
          ? "Are you sure you want to delete this past practice? This action cannot be undone."
          : "Are you sure you want to cancel this practice? This action cannot be undone."
        }
        confirmButtonText={isPastPractice ? "Delete Practice" : "Cancel Practice"}
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
            <DatePickerComponent
              initialScheduledAt={practice?.scheduledAt}
              onChange={handleScheduledAtChange}
              disabled={isLocked}
            />
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
              {practiceId && !attendances.some(a => a.attending === AttendanceStatus.Unknown) ? <CheckLg className="me-2 text-success" /> : ""}
              Attendance
              <Badge bg={practiceId ? 'primary' : 'secondary'} className="ms-2">
                {attendances.filter(a => a.attending === AttendanceStatus.Attending).length}
              </Badge>
            </span>
          }
          disabled={!practiceId}
          >
          {practiceId && (
            <PracticeAttendance
              practiceId={practiceId}
              disabled={isLocked}
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

        <Tab eventKey="sets" title={
          <span>
            Sets
            <Badge bg={practiceId ? 'primary' : 'secondary'} className="ms-2">
              {sets.length}
            </Badge>
          </span>
        } disabled={!practiceId}>
          {practiceId && (
            <PracticeSet
              practiceId={practiceId}
              disabled={isLocked}
              validationErrors={validationErrors}
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
            <span className={!practiceId || !scheduledAt ? 'text-muted' : ''}>
              Checks
              {validationErrors.length > 0 && (
                <Badge bg="primary" className="ms-2">
                  {validationErrors.length}
                </Badge>
              )}
            </span>
          }
          disabled={!practiceId}
        >
          <PracticeValidation validationErrors={validationErrors} />
          <div className="d-flex justify-content-between mb-3">
            <Button
              variant="outline-secondary"
              onClick={() => handleTabChange('sets')}
            >
              <ChevronLeft className="me-1" /> Sets
            </Button>
            <div className="d-flex gap-2">
              {!isPastPractice && (
                <Button
                  variant={practice?.status === PracticeStatus.Ready ? "outline-warning" : "success"}
                  onClick={() => handleStatusChange(practice?.status === PracticeStatus.Ready ? PracticeStatus.Draft : PracticeStatus.Ready)}
                  disabled={validationErrors.some(error => error.severity === 'error') && practice?.status === PracticeStatus.Draft}
                >
                  {practice?.status === PracticeStatus.Ready ? (
                    <>
                      <Pencil className="me-2" /> Mark as Draft
                    </>
                  ) : (
                    <>
                      <CheckLg className="me-2" /> Mark as Ready
                    </>
                  )}
                </Button>
              )}
              <Button
                variant={practice?.status === PracticeStatus.Ready ? "primary" : "outline-primary"}
                onClick={handleShare}
                disabled={!practice?.shareCode}
              >
                <Share className="me-2" /> Share / Print
              </Button>
            </div>
          </div>
        </Tab>
      </Tabs>

      <SaveSpinner show={isSaving} />
    </Container>
  )
}

function PracticeDetails() {
  const { practiceId } = useParams()

  return (
    <PracticeProvider practiceId={practiceId}>
      <PracticeDetailsContent />
    </PracticeProvider>
  )
}

export default PracticeDetails
