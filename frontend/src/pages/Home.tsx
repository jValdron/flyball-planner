import { Container } from 'react-bootstrap'

function Home() {
  return (
    <Container>
      <h1>Welcome to Flyball Practice Planner</h1>
      <p className="lead">
        Plan and manage your flyball team's practice sessions efficiently.
      </p>
      <div className="row mt-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Manage Dogs</h5>
              <p className="card-text">Add and manage your team's dogs, including their roles and skills.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Plan Practices</h5>
              <p className="card-text">Create and organize practice sessions for your team.</p>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-body">
              <h5 className="card-title">Track Progress</h5>
              <p className="card-text">Monitor your team's development and improvement over time.</p>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}

export default Home
