import { graphql } from './generated/gql';

export const GetPracticesByClub = graphql(`
    query GetPracticesByClub($clubId: String!) {
      practiceSummariesByClub(clubId: $clubId) {
        id
        scheduledAt
        status
        setsCount
        attendingCount
        notAttendingCount
        unconfirmedCount
      }
    }
  `);

export const GetPractice = graphql(`
  query GetPractice($id: String!) {
    practice(id: $id) {
      id
      scheduledAt
      status
      clubId
      createdAt
      updatedAt
      attendances {
        id
        attending
        dogId
        createdAt
        updatedAt
      }
      sets {
        id
        index
        notes
        type
        typeCustom
        createdAt
        updatedAt
        locationId
        dogs {
          id
          index
          lane
          dogId
        }
      }
    }
  }
`);

export const CreatePractice = graphql(`
  mutation CreatePractice($clubId: String!, $scheduledAt: DateTimeISO!, $status: PracticeStatus!) {
    createPractice(clubId: $clubId, scheduledAt: $scheduledAt, status: $status) {
      id
      scheduledAt
      status
      clubId
    }
  }
`);

export const UpdatePractice = graphql(`
  mutation UpdatePractice($id: String!, $scheduledAt: DateTimeISO, $status: PracticeStatus) {
    updatePractice(id: $id, scheduledAt: $scheduledAt, status: $status) {
      id
      scheduledAt
      status
      clubId
    }
  }
`);

export const DeletePractice = graphql(`
  mutation DeletePractice($id: String!) {
    deletePractice(id: $id)
  }
`);
