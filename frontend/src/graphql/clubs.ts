import { graphql } from './generated/gql';

export const GetClubs = graphql(`
  query GetClubs {
    clubs {
      id
      name
      nafaClubNumber
      defaultPracticeTime
    }
  }
`);

export const GetClubById = graphql(`
  query GetClubById($id: String!) {
    club(id: $id) {
      id
      name
      nafaClubNumber
      defaultPracticeTime
    }
  }
`);

export const GetLocationById = graphql(`
  query GetLocationById($id: String!) {
    location(id: $id) {
      id
      name
      isDefault
      isDoubleLane
      createdAt
      updatedAt
    }
  }
`);

export const GetLocationsByClub = graphql(`
  query GetLocationsByClub($clubId: ID!) {
    locationsByClub(clubId: $clubId) {
      id
      name
      isDefault
      isDoubleLane
    }
  }
`);

export const CreateLocation = graphql(`
  mutation CreateLocation($clubId: ID!, $name: String!, $isDefault: Boolean!, $isDoubleLane: Boolean!) {
    createLocation(clubId: $clubId, name: $name, isDefault: $isDefault, isDoubleLane: $isDoubleLane) {
      id
      name
      isDefault
      isDoubleLane
      createdAt
      updatedAt
    }
  }
`);

export const UpdateLocation = graphql(`
  mutation UpdateLocation($id: String!, $name: String, $isDefault: Boolean, $isDoubleLane: Boolean) {
    updateLocation(id: $id, name: $name, isDefault: $isDefault, isDoubleLane: $isDoubleLane) {
      id
      name
      isDefault
      isDoubleLane
      updatedAt
    }
  }
`);

export const DeleteLocation = graphql(`
  mutation DeleteLocation($id: String!) {
    deleteLocation(id: $id)
  }
`);

export const UpdateClub = graphql(`
  mutation UpdateClub($id: String!, $name: String, $nafaClubNumber: String, $defaultPracticeTime: String) {
    updateClub(id: $id, name: $name, nafaClubNumber: $nafaClubNumber, defaultPracticeTime: $defaultPracticeTime) {
      id
      name
      nafaClubNumber
      defaultPracticeTime
      updatedAt
    }
  }
`);
