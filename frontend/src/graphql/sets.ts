import { gql } from '@apollo/client'

export const GetSets = gql`
  query GetSets($practiceId: String!) {
    sets(practiceId: $practiceId) {
      id
      index
      type
      typeCustom
      notes
      locationId
      dogs {
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

export const UpdateSets = gql`
  mutation UpdateSets($updates: [SetUpdate!]!) {
    updateSets(updates: $updates) {
      id
      index
      type
      typeCustom
      notes
      locationId
      dogs {
        dogId
        index
        lane
      }
    }
  }
`
