import { gql } from '@apollo/client'

export const GetSets = gql`
  query GetSets($practiceId: String!, $locationId: String!) {
    sets(practiceId: $practiceId, locationId: $locationId) {
      id
      index
      type
      typeCustom
      notes
      locationId
      setDogs {
        dogId
        index
        lane
      }
    }
  }
`

export const UpdateSet = gql`
  mutation UpdateSet($id: ID, $update: SetUpdate!) {
    updateSet(id: $id, update: $update) {
      id
      index
      type
      typeCustom
      notes
      locationId
      setDogs {
        dogId
        index
        lane
      }
    }
  }
`

export const DeleteSet = gql`
  mutation DeleteSet($id: String!) {
    deleteSet(id: $id)
  }
`
