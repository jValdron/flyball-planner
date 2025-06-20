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

export const DeleteSets = gql`
  mutation DeleteSets($ids: [String!]!) {
    deleteSets(ids: $ids)
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
