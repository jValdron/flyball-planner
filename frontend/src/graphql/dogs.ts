import { graphql } from './generated/gql';

export const GetDogsByHandlersInClub = graphql(`
  query GetDogsByHandlersInClub($clubId: ID!) {
    dogsByHandlersInClub(clubId: $clubId) {
      id
      givenName
      surname
      dogs {
        id
        name
        crn
        status
        trainingLevel
      }
    }
  }
`);

export const GetDogById = graphql(`
  query GetDogById($id: String!) {
    dog(id: $id) {
      id
      name
      crn
      status
      trainingLevel
      ownerId
      updatedAt
      createdAt
    }
  }
`);

export const GetActiveDogsInClub = graphql(`
  query GetActiveDogsInClub($clubId: ID!) {
    activeDogsInClub(clubId: $clubId)
  }
`);

export const DeleteDog = graphql(`
  mutation DeleteDog($id: String!) {
    deleteDog(id: $id)
  }
`);

export const CreateDog = graphql(`
  mutation CreateDog(
    $name: String!
    $ownerId: String!
    $clubId: String!
    $trainingLevel: Float!
    $status: DogStatus!
    $crn: String
  ) {
    createDog(
      name: $name
      ownerId: $ownerId
      clubId: $clubId
      trainingLevel: $trainingLevel
      status: $status
      crn: $crn
    ) {
      id
      name
      crn
      status
      trainingLevel
      ownerId
    }
  }
`);

export const UpdateDog = graphql(`
  mutation UpdateDog(
    $id: String!
    $name: String
    $ownerId: String
    $clubId: String
    $trainingLevel: Float
    $status: DogStatus
    $crn: String
  ) {
    updateDog(
      id: $id
      name: $name
      ownerId: $ownerId
      clubId: $clubId
      trainingLevel: $trainingLevel
      status: $status
      crn: $crn
    ) {
      id
      name
      crn
      status
      trainingLevel
      ownerId
    }
  }
`);
