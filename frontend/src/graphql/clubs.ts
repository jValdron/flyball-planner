import { gql } from '@apollo/client'

export const GetClubs = gql(`
  query GetClubs {
    clubs {
      id
      name
      nafaClubNumber
      defaultPracticeTime
    }
  }
`);

export const GetClubById = gql`
  query GetClubById($id: String!) {
    club(id: $id) {
      id
      name
      nafaClubNumber
      defaultPracticeTime
    }
  }
`

export const GetLocationById = gql`
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
`

export const GetLocationsByClub = gql`
  query GetLocationsByClub($clubId: ID!) {
    locationsByClub(clubId: $clubId) {
      id
      name
      isDefault
      isDoubleLane
    }
  }
`

export const CreateLocation = gql`
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
`

export const UpdateLocation = gql`
  mutation UpdateLocation($id: String!, $name: String, $isDefault: Boolean, $isDoubleLane: Boolean) {
    updateLocation(id: $id, name: $name, isDefault: $isDefault, isDoubleLane: $isDoubleLane) {
      id
      name
      isDefault
      isDoubleLane
      updatedAt
    }
  }
`

export const DeleteLocation = gql`
  mutation DeleteLocation($id: String!) {
    deleteLocation(id: $id)
  }
`

export const UpdateClub = gql`
  mutation UpdateClub($id: String!, $name: String, $nafaClubNumber: String, $defaultPracticeTime: String) {
    updateClub(id: $id, name: $name, nafaClubNumber: $nafaClubNumber, defaultPracticeTime: $defaultPracticeTime) {
      id
      name
      nafaClubNumber
      defaultPracticeTime
      updatedAt
    }
  }
`
