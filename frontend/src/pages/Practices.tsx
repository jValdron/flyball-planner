import React, { useState, useEffect } from 'react'

import { Container, Button, Card, Spinner, Alert, Badge, ListGroup, Breadcrumb } from 'react-bootstrap'
import { Link, useNavigate } from 'react-router-dom'
import { CalendarCheck, CalendarX, CheckLg, Pencil, PlusLg, Trash, FileText, XLg, QuestionLg, Person } from 'react-bootstrap-icons'
import { compareDesc, isAfter, isBefore, compareAsc } from 'date-fns'
import { useQuery, useMutation } from '@apollo/client'

import type { PracticeSummary } from '../graphql/generated/graphql'
import { GetPracticesByClub, DeletePractice} from '../graphql/practice'
import { formatRelativeTime, isPastDay } from '../utils/dateUtils'
import { getPracticeCompletionStatus, getNextIncompleteStepUrl } from '../utils/practiceCompletion'
import { useClub } from '../contexts/ClubContext'
import { useTheme } from '../contexts/ThemeContext'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { usePracticeSummaryChangedSubscription } from '../hooks/useSubscription'
import { useAuth } from '../contexts/AuthContext'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import { ToggleButton } from '../components/ToggleButton'

function Practices() {
  const { selectedClub } = useClub()
  const { isDark } = useTheme()
  const { user: currentUser } = useAuth()
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [practiceToDelete, setPracticeToDelete] = useState<string | null>(null)
  const [showDraftsOnly, setShowDraftsOnly] = useState(false)
  const [practices, setPractices] = useState<PracticeSummary[]>([])
  const navigate = useNavigate()

  useDocumentTitle('Practices')

  const { loading, error, data } = useQuery(GetPracticesByClub, {
    variables: { clubId: selectedClub?.id ?? '' },
    skip: !selectedClub
  })

  const { data: subscriptionData } = usePracticeSummaryChangedSubscription(selectedClub?.id, {
    onError: (error) => {
      console.error('Practice summary subscription error:', error);
    },
    skip: !selectedClub
  });

  useEffect(() => {
    if (data?.practiceSummariesByClub) {
      setPractices(data.practiceSummariesByClub as PracticeSummary[]);
    }
  }, [data]);

  useEffect(() => {
    if (subscriptionData?.practiceSummaryChanged) {
      const { practice: updatedPractice, eventType } = subscriptionData.practiceSummaryChanged;

      setPractices(prevPractices => {
        const existingIndex = prevPractices.findIndex(p => p.id === updatedPractice.id);

        switch (eventType) {
          case 'CREATED':
            if (existingIndex === -1) {
              return [...prevPractices, updatedPractice as PracticeSummary];
            }
            return prevPractices;

          case 'UPDATED':
            if (existingIndex >= 0) {
              const newPractices = [...prevPractices];
              newPractices[existingIndex] = updatedPractice as PracticeSummary;
              return newPractices;
            } else {
              return [...prevPractices, updatedPractice as PracticeSummary];
            }

          case 'DELETED':
            if (existingIndex >= 0) {
              return prevPractices.filter(p => p.id !== updatedPractice.id);
            }
            return prevPractices;

          default:
            return prevPractices;
        }
      });
    }
  }, [subscriptionData]);

  const [deletePractice] = useMutation(DeletePractice, {
    refetchQueries: [{ query: GetPracticesByClub, variables: { clubId: selectedClub?.id ?? '' } }]
  })

  const handleDeleteClick = (id: string) => {
    setPracticeToDelete(id)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedClub || !practiceToDelete) return
    try {
      await deletePractice({ variables: { id: practiceToDelete } })
    } catch (err) {
      console.error(err)
    } finally {
      setShowDeleteModal(false)
      setPracticeToDelete(null)
    }
  }

  const canDeletePractice = (practice: PracticeSummary) => {
    return currentUser?.id === practice.plannedBy?.id
  }

  const now = new Date()
  const sortedPractices = [...practices].sort((a, b) => {
    const dateA = a.scheduledAt ? new Date(a.scheduledAt) : new Date(0)
    const dateB = b.scheduledAt ? new Date(b.scheduledAt) : new Date(0)

    if (isAfter(dateA, now) && isAfter(dateB, now)) {
      return compareAsc(dateA, dateB)
    }
    if (isBefore(dateA, now) && isBefore(dateB, now)) {
      return compareDesc(dateA, dateB)
    }
    return isAfter(dateA, now) ? -1 : 1
  })

  const filteredPractices = sortedPractices.filter(practice =>
    !showDraftsOnly || practice.status === 'Draft'
  )

  // Check if there are any planned (future) practices
  const hasPlannedPractices = filteredPractices.some(practice => !isPastDay(practice.scheduledAt))

  // Get the practice being deleted to determine if it's in the past
  const practiceBeingDeleted = practiceToDelete ? practices.find(p => p.id === practiceToDelete) : null
  const isPastPractice = practiceBeingDeleted ? isPastDay(practiceBeingDeleted.scheduledAt) : false

  if (!selectedClub) {
    return (
      <Container>
        <Alert variant="info" className="mt-4">
          Please select a club to view its practices.
        </Alert>
      </Container>
    )
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

  if (error) {
    return (
      <Container>
        <Alert variant="danger">Failed to load practices</Alert>
      </Container>
    )
  }

  return (
    <Container>
      <Breadcrumb>
        <Breadcrumb.Item onClick={() => navigate('/')}>Home</Breadcrumb.Item>
        <Breadcrumb.Item active>Practices</Breadcrumb.Item>
      </Breadcrumb>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Practices</h2>
        <Button variant="primary" className="d-flex align-items-center" onClick={() => navigate('/practices/new')}>
          <PlusLg className="me-1" /> Schedule New Practice
        </Button>
      </div>

      <div className="d-flex gap-2 mb-4">
        <ToggleButton
          id="draft-toggle"
          checked={showDraftsOnly}
          onChange={setShowDraftsOnly}
          label="Show Drafts Only"
          variant="warning"
        />
      </div>

      {filteredPractices.length === 0 ? (
        <Alert variant="info">
          {showDraftsOnly
            ? <>No draft practices found. <Link to="/practices/new">Schedule a new practice now</Link>.</>
            : <>No practices have been scheduled yet. <Link to="/practices/new">Schedule your first practice now</Link>.</>
          }
        </Alert>
      ) : (
        <React.Fragment>
          {!hasPlannedPractices && !showDraftsOnly && (
            <Alert variant="info" className="mb-4">
              No planned practices scheduled. <Link to="/practices/new">Schedule a new practice now</Link>.
            </Alert>
          )}

          <div className="row">
            {filteredPractices.map((practice, index) => {
              const practiceIsPast = isPastDay(practice.scheduledAt)
              const previousPractice = index > 0 ? filteredPractices[index - 1] : null
              const showPastDivider = practiceIsPast && (!previousPractice || !isPastDay(previousPractice.scheduledAt))

              return (
                <React.Fragment key={practice.id}>
                  {showPastDivider && (
                    <div className="col-12 mb-4">
                      <hr className="border-secondary" />
                      <h3 className="text-secondary">Past Practices</h3>
                    </div>
                  )}
                  <div key={practice.id} className="col-md-4 mb-4">
                    <Card
                      onClick={() => {
                        const completionStatus = getPracticeCompletionStatus(practice)
                        const nextStepUrl = getNextIncompleteStepUrl(practice.id, completionStatus.nextIncompleteStep)
                        navigate(nextStepUrl)
                      }}
                      className="cur-point"
                    >
                      <Card.Body className={practiceIsPast ? 'bg-past' : practice.status === 'Draft' ? 'bg-warning-subtle' : 'bg-primary-subtle'}>
                        <Card.Title className="text-truncate">
                          {formatRelativeTime(practice.scheduledAt)}
                        </Card.Title>
                        <Card.Text>
                          {practice.status === 'Ready' && <Badge bg="primary" className="d-inline-flex align-items-center me-2"><CalendarCheck className="me-1" /> Ready</Badge>}
                          {practice.status === 'Draft' && <Badge bg="warning" className="d-inline-flex align-items-center me-2 text-dark"><Pencil className="me-1" /> Draft</Badge>}
                          {practiceIsPast && <Badge bg="past" className="d-inline-flex align-items-center me-2 text-dark"><CalendarX className="me-1" /> Past</Badge>}
                        </Card.Text>
                      </Card.Body>
                      <ListGroup className="list-group-flush">
                        <ListGroup.Item><Person className="me-1" /> {practice.plannedBy.firstName} {practice.plannedBy.lastName}</ListGroup.Item>
                        <ListGroup.Item><CheckLg className="me-1" /> {practice.attendingCount} attending</ListGroup.Item>
                        <ListGroup.Item><XLg className="me-1" /> {practice.notAttendingCount} not attending</ListGroup.Item>
                        <ListGroup.Item><QuestionLg className="me-1" /> {practice.unconfirmedCount} unconfirmed</ListGroup.Item>
                        <ListGroup.Item><FileText className="me-1" /> {practice.setsCount} sets</ListGroup.Item>
                      </ListGroup>
                      <Card.Body className={`${isDark ? 'bg-dark' : 'bg-light'} d-flex justify-content-between`}>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            const completionStatus = getPracticeCompletionStatus(practice)
                            const nextStepUrl = getNextIncompleteStepUrl(practice.id, completionStatus.nextIncompleteStep)
                            navigate(nextStepUrl);
                          }}
                        >
                          {practiceIsPast && practice.status === 'Ready' ? (
                            <>
                              <FileText className="me-1" />
                              Recap
                            </>
                          ) : (
                            <>
                              <Pencil className="me-1" />
                              Edit
                            </>
                          )}
                        </Button>
                        {canDeletePractice(practice) && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(practice.id);
                            }}
                          >
                            <Trash />
                          </Button>
                        )}
                      </Card.Body>
                    </Card>
                  </div>
                </React.Fragment>
              )
            })}
          </div>
        </React.Fragment>
      )}

      <DeleteConfirmationModal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        title={isPastPractice ? "Confirm Practice Deletion" : "Confirm Practice Cancellation"}
        message={isPastPractice
          ? "Are you sure you want to delete this past practice? This action cannot be undone."
          : "Are you sure you want to cancel this practice? This action cannot be undone."
        }
        confirmButtonText={isPastPractice ? "Delete Practice" : "Cancel Practice"}
      />
    </Container>
  )
}

export default Practices
