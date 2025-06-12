import { graphql } from "./generated/gql";

export const GetClubs = graphql(`
    query GetClubs {
      clubs {
        id
        name
        nafaClubNumber
        defaultPracticeTime
      }
    }
  `);
