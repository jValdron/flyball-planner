import { Container, Form, Button, Alert, Spinner, Breadcrumb } from 'react-bootstrap'
import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { dogService, type Dog } from '../services/dogService'
import { ownerService, type Owner } from '../services/ownerService'
import { useClub } from '../contexts/ClubContext'

type DogFormData = Omit<Dog, 'ID' | 'CreatedAt' | 'UpdatedAt'>

function DogView() {
  const navigate = useNavigate()
  const { dogId } = useParams()
  const { selectedClubId } = useClub()
  const [dog, setDog] = useState<Dog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [owners, setOwners] = useState<Owner[]>([])
  const [formData, setFormData] = useState<DogFormData>({
    Name: '',
    CRN: '',
    TrainingLevel: 1,
    ClubID: selectedClubId || '',
    OwnerID: ''
  })

  useEffect(() => {
    if (dogId) {
      loadDog()
    } else {
      // New dog mode
      setLoading(false)
      setIsEditMode(true)
    }
    loadOwners()
  }, [dogId])

  const loadOwners = async () => {
    try {
      const data = await ownerService.getOwners()
      setOwners(data)
    } catch (err) {
      console.error('Error loading owners:', err)
    }
  }

  const loadDog = async () => {
    try {
      setLoading(true)
      setError(null)
      let data: Dog = await dogService.getDogByClub(selectedClubId, dogId!)
      setDog(data)
      setFormData({
        Name: data.Name,
        CRN: data.CRN,
        TrainingLevel: data.TrainingLevel,
        ClubID: data.ClubID,
        OwnerID: data.OwnerID
      })
    } catch (err) {
      setError('Failed to load dog details. Please try again later.')
      console.error('Error loading dog:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: name === 'TrainingLevel' ? parseInt(value) : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setError(null)
      if (dogId) {
        await ownerService.updateDog(formData.OwnerID, dogId, formData)
      } else {
        await ownerService.createDog(formData.OwnerID, {
          Name: formData.Name,
          CRN: formData.CRN,
          ClubID: formData.ClubID,
          TrainingLevel: formData.TrainingLevel,
          OwnerID: formData.OwnerID
        })
      }
      navigate('/dogs')
    } catch (err) {
      setError('Failed to save dog. Please try again later.')
      console.error('Error saving dog:', err)
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

  return (
    <Container>
      <Breadcrumb className="mt-3">
        <div className="breadcrumb-item" onClick={() => navigate('/dogs')} style={{ cursor: 'pointer' }}>Dogs</div>
        <Breadcrumb.Item active>
          {dogId ? (isEditMode ? 'Edit Dog' : 'View Dog') : 'Add New Dog'}
        </Breadcrumb.Item>
      </Breadcrumb>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{dogId ? (isEditMode ? 'Edit Dog' : 'View Dog') : 'Add New Dog'}</h1>
        {dogId && (
          <Button
            variant={isEditMode ? 'secondary' : 'primary'}
            onClick={() => setIsEditMode(!isEditMode)}
          >
            {isEditMode ? 'Cancel Edit' : 'Edit Dog'}
          </Button>
        )}
      </div>

      {error && (
        <Alert variant="danger" className="mb-4" onClose={() => setError(null)} dismissible>
          {error}
        </Alert>
      )}

      {!isEditMode && dog && (
        <div className="mb-4">
          <p><strong>Created:</strong> {new Date(dog.CreatedAt).toLocaleString()}</p>
          <p><strong>Last Updated:</strong> {new Date(dog.UpdatedAt).toLocaleString()}</p>
        </div>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Name</Form.Label>
          <Form.Control
            type="text"
            name="Name"
            value={formData.Name}
            onChange={handleInputChange}
            disabled={!isEditMode}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>CRN</Form.Label>
          <Form.Control
            type="text"
            name="CRN"
            value={formData.CRN}
            onChange={handleInputChange}
            disabled={!isEditMode}
            className="font-monospace"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Training Level</Form.Label>
          <Form.Select
            name="TrainingLevel"
            value={formData.TrainingLevel}
            onChange={handleInputChange}
            disabled={!isEditMode}
            required
          >
            <option value={1}>Beginner</option>
            <option value={2}>Novice</option>
            <option value={3}>Intermediate</option>
            <option value={4}>Advanced</option>
            <option value={5}>Solid</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Owner</Form.Label>
          <Form.Select
            name="OwnerID"
            value={formData.OwnerID}
            onChange={handleInputChange}
            disabled={!isEditMode}
            required
          >
            <option value="">Select an owner</option>
            {owners.map(owner => (
              <option key={owner.ID} value={owner.ID}>
                {`${owner.GivenName} ${owner.Surname}`}
              </option>
            ))}
          </Form.Select>
        </Form.Group>

        {isEditMode && (
          <div className="d-flex gap-2">
            <Button type="submit" variant="primary">
              {dogId ? 'Save Changes' : 'Create Dog'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/dogs')}
            >
              Cancel
            </Button>
          </div>
        )}
      </Form>
    </Container>
  )
}

export default DogView
