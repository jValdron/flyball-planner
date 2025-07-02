import { graphql } from './generated/gql';

export const LoginUser = graphql(`
  mutation LoginUser($username: String!, $password: String!) {
    loginUser(username: $username, password: $password) {
      token
      user {
        id
        username
        email
        firstName
        lastName
        clubs {
          id
          name
        }
      }
    }
  }
`);

export const GetCurrentUser = graphql(`
  query GetCurrentUser {
    currentUser {
      id
      username
      email
      firstName
      lastName
      clubs {
        id
        name
      }
    }
  }
`);

export const UpdateUser = graphql(`
  mutation UpdateUser($firstName: String, $lastName: String, $email: String) {
    updateUser(firstName: $firstName, lastName: $lastName, email: $email) {
      id
      username
      email
      firstName
      lastName
      clubs {
        id
        name
      }
    }
  }
`);

export const ChangePassword = graphql(`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`);
