import { gql } from '@apollo/client';

export const CLUB_CHANGED_SUBSCRIPTION = gql`
  subscription ClubChanged {
    clubChanged {
      club {
        id
        name
        nafaClubNumber
        defaultPracticeTime
        createdAt
        updatedAt
      }
      eventType
    }
  }
`;

export const CLUB_BY_ID_SUBSCRIPTION = gql`
  subscription ClubById($clubId: String) {
    clubById(clubId: $clubId) {
      club {
        id
        name
        nafaClubNumber
        defaultPracticeTime
        createdAt
        updatedAt
      }
      eventType
    }
  }
`;

export const DOG_CHANGED_SUBSCRIPTION = gql`
  subscription DogChanged($clubId: String) {
    dogChanged(clubId: $clubId) {
      dog {
        id
        name
        crn
        status
        trainingLevel
        ownerId
        clubId
        createdAt
        updatedAt
        owner {
          id
          givenName
          surname
        }
        club {
          id
          name
        }
      }
      eventType
    }
  }
`;

export const HANDLER_CHANGED_SUBSCRIPTION = gql`
  subscription HandlerChanged($clubId: String) {
    handlerChanged(clubId: $clubId) {
      handler {
        id
        givenName
        surname
        clubId
        createdAt
        updatedAt
        club {
          id
          name
        }
        dogs {
          id
          name
          status
          trainingLevel
        }
      }
      eventType
    }
  }
`;

export const LOCATION_CHANGED_SUBSCRIPTION = gql`
  subscription LocationChanged($clubId: String) {
    locationChanged(clubId: $clubId) {
      location {
        id
        name
        isDefault
        isDoubleLane
        clubId
        createdAt
        updatedAt
        club {
          id
          name
        }
      }
      eventType
    }
  }
`;
