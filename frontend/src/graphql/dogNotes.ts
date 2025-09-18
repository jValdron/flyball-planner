import { gql } from '@apollo/client'

export const GET_DOG_NOTES = gql`
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
`

export const GET_DOG_NOTES_BY_PRACTICE = gql`
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
`

export const CREATE_DOG_NOTE = gql`
  mutation CreateDogNote($input: CreateDogNoteInput!) {
    createDogNote(input: $input) {
      id
      content
      createdAt
      updatedAt
    }
  }
`

export const UPDATE_DOG_NOTE = gql`
  mutation UpdateDogNote($id: ID!, $content: String!) {
    updateDogNote(id: $id, content: $content) {
      id
      content
      createdAt
      updatedAt
    }
  }
`

export const CREATE_SET_DOG_NOTE = gql`
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
`

export const DELETE_DOG_NOTE = gql`
  mutation DeleteDogNote($id: ID!) {
    deleteDogNote(id: $id)
  }
`

export type DogNote = {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  setDogNotes: Array<{
    id: string
    setDog: {
      id: string
      set: {
        id: string
        index: number
        type: string | null
        typeCustom: string | null
        isWarmup: boolean
        notes: string | null
        location: {
          id: string
          name: string
          isDoubleLane: boolean
        }
        practice: {
          id: string
          scheduledAt: string
        }
        dogs: Array<{
          id: string
          index: number
          lane: string | null
          dogId: string
          dog: {
            id: string
            name: string
            crn: string | null
            trainingLevel: string
            owner: {
              id: string
              givenName: string
              surname: string
            } | null
          }
        }>
      }
    }
  }>
  setDogs: Array<{
    id: string
    dogId: string
  }>
}

export type PracticeDogNote = {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  setId: string
  dogIds: string[]
}
