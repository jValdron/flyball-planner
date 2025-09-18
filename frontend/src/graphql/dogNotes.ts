import { graphql } from './generated/gql';

export const GET_DOG_NOTES = graphql(`
  query GetDogNotes($dogId: ID!) {
    dogNotes(dogId: $dogId) {
      id
      content
      createdAt
      updatedAt
      setDogNotes {
        id
        setDog {
          id
          dogId
          set {
            id
            index
            type
            typeCustom
            isWarmup
            notes
            location {
              id
              name
              isDoubleLane
            }
            practice {
              id
              scheduledAt
            }
            dogs {
              id
              index
              lane
              dogId
            }
          }
        }
      }
      setDogs {
        id
        dogId
      }
    }
  }
`)

export const GET_DOG_NOTES_BY_PRACTICE = graphql(`
  query GetDogNotesByPractice($practiceId: ID!) {
    dogNotesByPractice(practiceId: $practiceId) {
      id
      content
      createdAt
      updatedAt
      setId
      dogIds
    }
  }
`)

export const CREATE_DOG_NOTE = graphql(`
  mutation CreateDogNote($input: CreateDogNoteInput!) {
    createDogNote(input: $input) {
      id
      content
      createdAt
      updatedAt
    }
  }
`)

export const UPDATE_DOG_NOTE = graphql(`
  mutation UpdateDogNote($id: ID!, $content: String!) {
    updateDogNote(id: $id, content: $content) {
      id
      content
      createdAt
      updatedAt
    }
  }
`)

export const CREATE_SET_DOG_NOTE = graphql(`
  mutation CreateSetDogNote($input: CreateSetDogNoteInput!) {
    createSetDogNote(input: $input) {
      id
      content
      createdAt
      updatedAt
      setDogNotes {
        id
        setDog {
          id
          dogId
        }
      }
    }
  }
`)

export const DELETE_DOG_NOTE = graphql(`
  mutation DeleteDogNote($id: ID!) {
    deleteDogNote(id: $id)
  }
`)
