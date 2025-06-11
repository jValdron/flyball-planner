import React, { useState, useEffect } from 'react'
import { Container, Button, Card, Spinner, Alert, Badge, Form } from 'react-bootstrap'
import { practiceService } from '../services/practiceService'
import type { Practice } from '../services/practiceService'
import { useClub } from '../contexts/ClubContext'
import { Link, useNavigate } from 'react-router-dom'
import DeleteConfirmationModal from '../components/DeleteConfirmationModal'
import { Pencil, PlusLg, Trash } from 'react-bootstrap-icons'
import { formatDateHeader, formatRelativeTime, isPastDay } from '../utils/dateUtils'

function Practices() {
  const { selectedClub } = useClub()
  const [practices, setPractices] = useState<Practice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [practiceToDelete, setPracticeToDelete] = useState<string | null>(null)
  const [showDraftsOnly, setShowDraftsOnly] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (selectedClub) {
      loadPractices()
    } else {
      setPractices([])
      setLoading(false)
    }
  }, [selectedClub])

  const loadPractices = async () => {
    try {
      setLoading(true)
      setError(null)
      if (!selectedClub) return
      const data = await practiceService.getPractices(selectedClub.ID)
      const now = new Date().getTime()
      const sortedData = data.sort((a, b) => {
        const dateA = a.ScheduledAt ? new Date(a.ScheduledAt).getTime() : 0
        const dateB = b.ScheduledAt ? new Date(b.ScheduledAt).getTime() : 0

        if (dateA >= now && dateB >= now) {
          return dateA - dateB
        }
        if (dateA < now && dateB < now) {
          return dateB - dateA
        }
        return dateA >= now ? -1 : 1
      })
      setPractices(sortedData)
    } catch (err) {
      setError('Failed to load practices')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (id: string) => {
    setPracticeToDelete(id)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!selectedClub || !practiceToDelete) return
    try {
      await practiceService.deletePractice(selectedClub.ID, practiceToDelete)
      setPractices(prev => prev.filter(p => p.ID !== practiceToDelete))
    } catch (err) {
      setError('Failed to delete practice')
      console.error(err)
    } finally {
      setShowDeleteModal(false)
      setPracticeToDelete(null)
    }
  }

  const filteredPractices = practices.filter(practice =>
    !showDraftsOnly || practice.Status === 'Draft'
  )

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
        <Alert variant="danger">{error}</Alert>
      </Container>
    )
  }

  return (
    <Container>
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

          <div className="row">
            {filteredPractices.map((practice, index) => {
              const practiceIsPast = isPastDay(practice.ScheduledAt)
              const previousPractice = index > 0 ? filteredPractices[index - 1] : null
              const showPastDivider = practiceIsPast && (!previousPractice || !isPastDay(previousPractice.ScheduledAt))

              return (
                <React.Fragment key={practice.ID}>
                  {showPastDivider && (
                    <div className="col-12 mb-4">
                      <hr className="border-secondary" />
                      <h3 className="text-secondary">Past Practices</h3>
                    </div>
                  )}
                  <div key={practice.ID} className="col-md-4 mb-4">
                    <Card
                      className={`${practiceIsPast ? 'border-secondary bg-light' : practice.Status === 'Draft' ? 'border-warning' : practice.Status === 'Ready' ? 'border-success' : ''} cursor-pointer`}
                      onClick={() => navigate(`/practices/${practice.ID}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      <Card.Header className={practiceIsPast ? 'bg-secondary text-white' : practice.Status === 'Draft' ? 'bg-warning' : 'bg-success text-white'}>
                        {formatDateHeader(practice.ScheduledAt)}
                        {!practiceIsPast && practice.Status === 'Draft' && (
                          <Badge bg="warning" className="ms-2 float-end">Draft</Badge>
                        )}
                      </Card.Header>
                      <Card.Body>
                        <Card.Subtitle className={`mb-2 ${practiceIsPast ? 'text-secondary' : 'text-muted'}`}>
                          {formatRelativeTime(practice.ScheduledAt)}
                        </Card.Subtitle>
                        {practiceIsPast ? "" : (
                          <Button
                            variant="outline-primary"
                            size="sm"
                            className="me-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/practices/${practice.ID}`);
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
                            handleDeleteClick(practice.ID);
                          }}
                        >
                          <Trash className="me-1" />
                          {practiceIsPast ? 'Delete' : 'Cancel'}
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
        title="Confirm Practice Cancellation"
        message="Are you sure you want to cancel this practice?"
        confirmButtonText="Cancel Practice"
      />
    </Container>
  )
}

export default Practices
