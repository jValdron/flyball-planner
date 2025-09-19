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
        plannedBy {
          id
          firstName
          lastName
          username
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
      shareCode
      isPrivate
      createdAt
      updatedAt
      plannedBy {
        id
        firstName
        lastName
        username
      }
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
        isWarmup
        rating
        createdAt
        updatedAt
        locationId
        location {
          id
          name
          isDoubleLane
        }
        dogs {
          id
          index
          lane
          dogId
          dog {
            id
            name
            crn
            trainingLevel
            owner {
              id
              givenName
              surname
            }
          }
        }
      }
    }
  }
`);

export const GetPublicPractice = graphql(`
  query GetPublicPractice($id: String!, $code: String!) {
    publicPractice(id: $id, code: $code) {
      id
      scheduledAt
      status
      clubId
      createdAt
      updatedAt
      club {
        id
        name
        nafaClubNumber
        locations {
          id
          name
          isDefault
          isDoubleLane
        }
      }
      sets {
        id
        index
        notes
        type
        typeCustom
        isWarmup
        createdAt
        updatedAt
        location {
          id
          name
          isDefault
          isDoubleLane
        }
        dogs {
          id
          index
          lane
          dogId
          dog {
            id
            name
          }
        }
      }
    }
  }
`);

export const CreatePractice = graphql(`
  mutation CreatePractice($clubId: String!, $scheduledAt: DateTimeISO!, $status: PracticeStatus!, $isPrivate: Boolean) {
    createPractice(clubId: $clubId, scheduledAt: $scheduledAt, status: $status, isPrivate: $isPrivate) {
      id
      scheduledAt
      status
      clubId
      isPrivate
    }
  }
`);

export const UpdatePractice = graphql(`
  mutation UpdatePractice($id: String!, $scheduledAt: DateTimeISO, $status: PracticeStatus, $isPrivate: Boolean) {
    updatePractice(id: $id, scheduledAt: $scheduledAt, status: $status, isPrivate: $isPrivate) {
      id
      scheduledAt
      status
      clubId
      isPrivate
    }
  }
`);

export const DeletePractice = graphql(`
  mutation DeletePractice($id: String!) {
    deletePractice(id: $id)
  }
`);
