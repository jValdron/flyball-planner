import { Container, Button, Card } from 'react-bootstrap'

function Practices() {
  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Practice Sessions</h1>
        <Button variant="primary">Schedule New Practice</Button>
      </div>

      <div className="row">
        <div className="col-md-4 mb-4">
          <Card>
            <Card.Header>Upcoming Practice</Card.Header>
            <Card.Body>
              <Card.Title>Team Practice</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">Saturday, 10:00 AM</Card.Subtitle>
              <Card.Text>
                Full team practice focusing on box turns and handoffs.
              </Card.Text>
              <Button variant="outline-primary" size="sm" className="me-2">Edit</Button>
              <Button variant="outline-danger" size="sm">Cancel</Button>
            </Card.Body>
          </Card>
        </div>

        <div className="col-md-4 mb-4">
          <Card>
            <Card.Header>Next Week</Card.Header>
            <Card.Body>
              <Card.Title>Box Loading Practice</Card.Title>
              <Card.Subtitle className="mb-2 text-muted">Wednesday, 6:00 PM</Card.Subtitle>
              <Card.Text>
                Specialized practice for box loaders and box dogs.
              </Card.Text>
              <Button variant="outline-primary" size="sm" className="me-2">Edit</Button>
              <Button variant="outline-danger" size="sm">Cancel</Button>
            </Card.Body>
          </Card>
        </div>
      </div>
    </Container>
  )
}

export default Practices
