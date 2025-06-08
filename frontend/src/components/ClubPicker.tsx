import { Form } from 'react-bootstrap'
import { useEffect, useState } from 'react'
import { clubService, type Club } from '../services/clubService'
import { useClub } from '../contexts/ClubContext'

export function ClubPicker() {
  const { selectedClubId, setSelectedClubId, setSelectedClub } = useClub()
  const [clubs, setClubs] = useState<Club[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadClubs = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await clubService.getAllClubs()
        setClubs(data)
        // If no club is selected and we have clubs, select the first one
        if (!selectedClubId && data.length > 0) {
          const firstClub = data[0]
          setSelectedClubId(firstClub.ID)
          setSelectedClub(firstClub)
        }
      } catch (err) {
        setError('Failed to load clubs')
        console.error('Error loading clubs:', err)
      } finally {
        setLoading(false)
      }
    }
    loadClubs()
  }, [selectedClubId, setSelectedClubId, setSelectedClub])

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clubId = e.target.value
    setSelectedClubId(clubId)
    try {
      const club = await clubService.getClub(clubId)
      setSelectedClub(club)
    } catch (err) {
      console.error('Error loading club details:', err)
    }
  }

  if (loading) {
    return <div>Loading clubs...</div>
  }

  if (error) {
    return <div className="text-danger">{error}</div>
  }

  return (
    <Form.Select
      value={selectedClubId || ''}
      onChange={handleChange}
      aria-label="Select club"
      className="w-auto"
    >
      {clubs.map((club) => (
        <option key={club.ID} value={club.ID}>
          {club.Name}
        </option>
      ))}
    </Form.Select>
  )
}
