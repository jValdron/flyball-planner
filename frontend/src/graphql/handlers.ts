import { graphql } from "./generated/gql";

export const GetHandlerById = graphql(`
    query GetHandlerById($id: String!) {
      handler(id: $id) {
        id
        givenName
        surname
        createdAt
        updatedAt
      }
    }
  `);

  export const CreateHandler = graphql(`
    mutation CreateHandler($givenName: String!, $surname: String!, $clubId: ID!) {
      createHandler(givenName: $givenName, surname: $surname, clubId: $clubId) {
        id
        givenName
        surname
      }
    }
  `);

  export const UpdateHandler = graphql(`
    mutation UpdateHandler($id: String!, $givenName: String, $surname: String) {
      updateHandler(id: $id, givenName: $givenName, surname: $surname) {
        id
        givenName
        surname
      }
    }
  `);

  export const DeleteHandler = graphql(`
    mutation DeleteHandler($id: String!) {
      deleteHandler(id: $id)
    }
  `);
