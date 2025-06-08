import { useState, useEffect } from 'react'
import { Container, Button, Card, Spinner, Alert } from 'react-bootstrap'
import { practiceService } from '../services/practiceService'
import type { Practice } from '../services/practiceService'
import { useClub } from '../contexts/ClubContext'
import { useNavigate } from 'react-router-dom'

function Practices() {
  const { selectedClubId } = useClub()
  const [practices, setPractices] = useState<Practice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    if (selectedClubId) {
      loadPractices()
    } else {
      setPractices([])
      setLoading(false)
    }
  }, [selectedClubId])

  const loadPractices = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await practiceService.getPractices(selectedClubId)
      setPractices(data)
    } catch (err) {
      setError('Failed to load practices')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to cancel this practice?')) {
      try {
        await practiceService.deletePractice(selectedClubId, id)
        await loadPractices()
      } catch (err) {
        setError('Failed to delete practice')
        console.error(err)
      }
    }
  }

  const formatDateTime = (dateTime: string | null) => {
    if (!dateTime) return 'Not scheduled'
    const date = new Date(dateTime)
    return date.toLocaleString()
  }

  if (!selectedClubId) {
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
        <Button variant="primary" onClick={() => navigate('/practices/new')}>Schedule New Practice</Button>
      </div>

      <div className="row">
        {practices.map((practice) => (
          <div key={practice.id} className="col-md-4 mb-4">
            <Card>
              <Card.Header>Practice</Card.Header>
              <Card.Body>
                <Card.Subtitle className="mb-2 text-muted">
                  {formatDateTime(practice.scheduledAt)}
                </Card.Subtitle>
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="me-2"
                  onClick={() => navigate(`/practices/${practice.id}`)}
                >
                  Edit
                </Button>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => handleDelete(practice.id)}
                >
                  Cancel
                </Button>
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    </Container>
  )
}

export default Practices
