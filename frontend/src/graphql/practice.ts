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
      shareCode
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
        isWarmup
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
      attendances {
        id
        attending
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
        createdAt
        updatedAt
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
