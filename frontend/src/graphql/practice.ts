import { graphql } from './generated/gql';

export const GetPracticesByClub = graphql(`
    query GetPracticesByClub($clubId: String!) {
      practicesByClub(clubId: $clubId) {
        id
        scheduledAt
        status
        attendances {
          id
          attending
        }
        sets {
          id
        }
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
  mutation UpdatePractice($id: String!, $clubId: String, $scheduledAt: DateTimeISO, $status: PracticeStatus) {
    updatePractice(id: $id, clubId: $clubId, scheduledAt: $scheduledAt, status: $status) {
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
