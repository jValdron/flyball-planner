import { useState, useEffect } from 'react'
import { Container, Button, Card, Spinner, Alert } from 'react-bootstrap'
import { practiceService } from '../services/practiceService'
import type { Practice } from '../services/practiceService'

function Practices() {
  const [practices, setPractices] = useState<Practice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadPractices()
  }, [])

  const loadPractices = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await practiceService.getPractices()
      setPractices(data)
    } catch (err) {
      setError('Failed to load practices')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to cancel this practice?')) {
      try {
        await practiceService.deletePractice(id)
        await loadPractices()
      } catch (err) {
        setError('Failed to delete practice')
        console.error(err)
      }
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
        <Button variant="primary">Schedule New Practice</Button>
      </div>

      <div className="row">
        {practices.map((practice) => (
          <div key={practice.id} className="col-md-4 mb-4">
            <Card>
              <Card.Header>{practice.type}</Card.Header>
              <Card.Body>
                <Card.Title>{practice.title}</Card.Title>
                <Card.Subtitle className="mb-2 text-muted">
                  {practice.date}, {practice.time}
                </Card.Subtitle>
                <Card.Text>{practice.description}</Card.Text>
                <Button variant="outline-primary" size="sm" className="me-2">
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
