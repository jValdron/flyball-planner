import { graphql } from './generated/gql';

export const GetPracticeAttendances = graphql(`
  query GetPracticeAttendances($practiceId: String!) {
    practiceAttendances(practiceId: $practiceId) {
      id
      dogId
      attending
      dog {
        id
        name
        ownerId
      }
    }
  }
`);

export const UpdateAttendances = graphql(`
  mutation UpdateAttendances($practiceId: String!, $updates: [AttendanceUpdate!]!) {
    updateAttendances(practiceId: $practiceId, updates: $updates) {
      id
      dogId
      attending
    }
  }
`);
