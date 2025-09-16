import { graphql } from './generated/gql';

export const GetSets = graphql(`
  query GetSets($practiceId: String!) {
    sets(practiceId: $practiceId) {
      id
      index
      type
      typeCustom
      notes
      isWarmup
      locationId
      dogs {
        dogId
        index
        lane
      }
    }
  }
`);

export const DeleteSets = graphql(`
  mutation DeleteSets($ids: [String!]!) {
    deleteSets(ids: $ids)
  }
`);

export const UpdateSets = graphql(`
  mutation UpdateSets($updates: [SetUpdate!]!) {
    updateSets(updates: $updates) {
      id
      index
      type
      typeCustom
      notes
      isWarmup
      locationId
      rating
      dogs {
        dogId
        index
        lane
      }
    }
  }
`);

export const UPDATE_SET_RATING = graphql(`
  mutation UpdateSetRating($updates: [SetUpdate!]!) {
    updateSets(updates: $updates) {
      id
      rating
    }
  }
`);
