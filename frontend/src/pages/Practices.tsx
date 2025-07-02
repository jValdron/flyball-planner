import React, { useState, useEffect } from 'react'
import { Container, Button, Card, Spinner, Alert, Badge, Form, ListGroup, Breadcrumb } from 'react-bootstrap'
import { useClub } from '../contexts/ClubContext'
import { useTheme } from '../contexts/ThemeContext'
import { Link, useNavigate } from 'react-router-dom'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import { CalendarCheck, CalendarX, CheckLg, Pencil, PlusLg, Trash, FileText, XLg, QuestionLg } from 'react-bootstrap-icons'
import { formatRelativeTime, isPastDay } from '../utils/dateUtils'
import { useQuery, useMutation } from '@apollo/client'
import { GetPracticesByClub, DeletePractice} from '../graphql/practice'
import { compareDesc, isAfter, isBefore } from 'date-fns'
import { compareAsc } from 'date-fns'
import { usePracticeSummaryChangedSubscription } from '../hooks/useSubscription'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import type { PracticeSummary } from '../graphql/generated/graphql'

function Practices() {
  const { selectedClub } = useClub()
  const { isDark } = useTheme()
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
        <h1>Practices</h1>
        <Button variant="primary" onClick={() => navigate('/practices/new')}>
          <PlusLg className="me-1" /> Schedule New Practice
        </Button>
      </div>

      {filteredPractices.length === 0 ? (
        <Alert variant="info">
          No practices have been scheduled yet. <Link to="/practices/new">Schedule your first practice now</Link>.
        </Alert>
      ) : (
        <React.Fragment>
          <Form.Check
            type="switch"
            id="draft-toggle"
            label="Show Drafts Only"
            className="mb-4 fs-5"
            checked={showDraftsOnly}
            onChange={(e) => setShowDraftsOnly(e.target.checked)}
          />

          {!hasPlannedPractices && (
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
                      onClick={() => navigate(`/practices/${practice.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Body className={practiceIsPast ? 'bg-past' : practice.status === 'Draft' ? 'bg-warning-subtle' : 'bg-primary-subtle'}>
                        <Card.Title className="text-truncate">
                          {formatRelativeTime(practice.scheduledAt)}
                        </Card.Title>
                        <Card.Text>
                          {practice.status === 'Ready' && <Badge bg="primary" className="d-inline-block me-2"><CalendarCheck /> Ready</Badge>}
                          {practice.status === 'Draft' && <Badge bg="warning" className="d-inline-block me-2 text-dark"><Pencil /> Draft</Badge>}
                          {practiceIsPast && <Badge bg="past" className="d-inline-block me-2 text-dark"><CalendarX /> Past</Badge>}
                        </Card.Text>
                      </Card.Body>
                      <ListGroup className="list-group-flush">
                        <ListGroup.Item><CheckLg className="me-1" /> {practice.attendingCount} attending</ListGroup.Item>
                        <ListGroup.Item><XLg className="me-1" /> {practice.notAttendingCount} not attending</ListGroup.Item>
                        <ListGroup.Item><QuestionLg className="me-1" /> {practice.unconfirmedCount} unconfirmed</ListGroup.Item>
                        <ListGroup.Item><FileText className="me-1" /> {practice.setsCount} sets</ListGroup.Item>
                      </ListGroup>
                      <Card.Body className={`${isDark ? 'bg-dark' : 'bg-light'} d-flex justify-content-between`}>
                        {practiceIsPast ? "" : (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/practices/${practice.id}`);
                            }}
                          >
                            <Pencil className="me-1" />
                            Edit
                          </Button>
                        )}
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
