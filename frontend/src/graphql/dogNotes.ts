import { graphql } from './generated/gql';

export const GET_DOG_NOTES = graphql(`
  query GetDogNotes($dogId: ID!) {
    dogNotes(dogId: $dogId) {
      id
      content
      createdAt
      updatedAt
      dogId
      isPrivate
      createdBy {
        id
        firstName
        lastName
        username
      }
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
  query GetDogNotesByPractice($practiceId: ID!, $orderBy: String) {
    dogNotesByPractice(practiceId: $practiceId, orderBy: $orderBy) {
      id
      content
      createdAt
      updatedAt
      isPrivate
      createdBy {
        id
        firstName
        lastName
        username
      }
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
      isPrivate
    }
  }
`)

export const UPDATE_DOG_NOTE = graphql(`
  mutation UpdateDogNote($id: ID!, $content: String, $isPrivate: Boolean) {
    updateDogNote(id: $id, content: $content, isPrivate: $isPrivate) {
      id
      content
      createdAt
      updatedAt
      isPrivate
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
      isPrivate
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

export const DOG_NOTE_CHANGED = graphql(`
  subscription DogNoteChanged($dogId: String!) {
    dogNoteChanged(dogId: $dogId) {
      id
      content
      dogId
      eventType
      createdAt
      updatedAt
    }
  }
`)

export const PRACTICE_DOG_NOTE_CHANGED = graphql(`
  subscription PracticeDogNoteChanged($practiceId: String!) {
    practiceDogNoteChanged(practiceId: $practiceId) {
      id
      content
      practiceId
      setId
      dogIds
      eventType
    }
  }
`)
