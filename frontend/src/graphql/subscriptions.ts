import { graphql } from './generated/gql';

export const CLUB_CHANGED_SUBSCRIPTION = graphql(`
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
`);

export const CLUB_BY_ID_SUBSCRIPTION = graphql(`
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
`);

export const DOG_CHANGED_SUBSCRIPTION = graphql(`
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
`);

export const HANDLER_CHANGED_SUBSCRIPTION = graphql(`
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
`);

export const LOCATION_CHANGED_SUBSCRIPTION = graphql(`
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
`);

export const PRACTICE_CHANGED_SUBSCRIPTION = graphql(`
  subscription PracticeChanged($practiceId: String!) {
    practiceChanged(practiceId: $practiceId) {
      practice {
        id
        scheduledAt
        status
        clubId
        createdAt
        updatedAt
      }
      eventType
    }
  }
`);

export const PRACTICE_ATTENDANCE_CHANGED_SUBSCRIPTION = graphql(`
  subscription PracticeAttendanceChanged($practiceId: String!) {
    practiceAttendanceChanged(practiceId: $practiceId) {
      attendance {
        id
        attending
        dogId
        practiceId
        createdAt
        updatedAt
      }
      eventType
    }
  }
`);

export const PRACTICE_SET_CHANGED_SUBSCRIPTION = graphql(`
  subscription PracticeSetChanged($practiceId: String!) {
    practiceSetChanged(practiceId: $practiceId) {
      set {
        id
        index
        notes
        type
        typeCustom
        isWarmup
        practiceId
        locationId
        createdAt
        updatedAt
        dogs {
          id
          index
          lane
          dogId
        }
      }
      eventType
    }
  }
`);

export const PRACTICE_SUMMARY_CHANGED_SUBSCRIPTION = graphql(`
  subscription PracticeSummaryChanged($clubId: String!) {
    practiceSummaryChanged(clubId: $clubId) {
      practice {
        id
        scheduledAt
        status
        isPrivate
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
      eventType
    }
  }
`);

export const PRACTICE_DOG_NOTE_CHANGED_SUBSCRIPTION = graphql(`
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
`);

export const PRACTICE_SET_RATING_CHANGED_SUBSCRIPTION = graphql(`
  subscription PracticeSetRatingChanged($practiceId: String!) {
    practiceSetRatingChanged(practiceId: $practiceId) {
      setId
      practiceId
      rating
      eventType
    }
  }
`);
