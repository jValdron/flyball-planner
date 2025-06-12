import { Form } from 'react-bootstrap'
import { useEffect } from 'react'
import { useClub } from '../contexts/ClubContext'
import { useQuery } from '@apollo/client'
import { GetClubs } from '../graphql/clubs'
import type { GetClubsQuery } from '../graphql/generated/graphql'

export function ClubPicker() {
  const { selectedClub, setSelectedClub } = useClub()
  const { loading, error, data } = useQuery<GetClubsQuery>(GetClubs)

  useEffect(() => {
    if (data?.clubs && !selectedClub && data.clubs.length > 0) {
      setSelectedClub(data.clubs[0])
    }
  }, [data, selectedClub, setSelectedClub])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const clubId = e.target.value
    const club = data?.clubs.find((c) => c.id === clubId)
    if (club) {
      setSelectedClub(club)
    }
  }

  if (loading) {
    return <div>Loading clubs...</div>
  }

  if (error) {
    return <div className="text-danger">Failed to load clubs</div>
  }

  return (
    <Form.Select
      value={selectedClub?.id || ''}
      onChange={handleChange}
      aria-label="Select club"
      className="w-auto"
    >
      {data?.clubs.map((club) => (
        <option key={club.id} value={club.id}>
          {club.name} ({club.nafaClubNumber})
        </option>
      ))}
    </Form.Select>
  )
}
