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
          set {
            id
            index
            type
            typeCustom
            practice {
              id
              scheduledAt
            }
          }
        }
      }
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
        practice: {
          id: string
          scheduledAt: string
        }
      }
    }
  }>
}
