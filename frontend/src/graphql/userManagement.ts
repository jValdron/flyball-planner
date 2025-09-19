import { gql } from '@apollo/client'

export const CREATE_USER_INVITE = gql`
  mutation CreateUserInvite($email: String!, $clubId: String!) {
    createUserInvite(email: $email, clubId: $clubId) {
      id
      code
      email
      clubId
      expiresAt
      usedAt
      isExpired
      isUsed
      isValid
      club {
        id
        name
      }
      invitedBy {
        id
        username
        firstName
        lastName
      }
    }
  }
`

export const USERS_BY_CLUB = gql`
  query UsersByClub($clubId: String!) {
    usersByClub(clubId: $clubId) {
      id
      username
      email
      firstName
      lastName
      createdAt
    }
  }
`

export const USER_INVITES_BY_CLUB = gql`
  query UserInvitesByClub($clubId: String!) {
    userInvitesByClub(clubId: $clubId) {
      id
      code
      email
      clubId
      expiresAt
      usedAt
      isExpired
      isUsed
      isValid
      createdAt
      invitedBy {
        id
        username
        firstName
        lastName
      }
      usedBy {
        id
        username
        firstName
        lastName
      }
    }
  }
`

export const REMOVE_USER_FROM_CLUB = gql`
  mutation RemoveUserFromClub($userId: String!, $clubId: String!) {
    removeUserFromClub(userId: $userId, clubId: $clubId)
  }
`

export const USER_INVITE_BY_CODE = gql`
  query UserInviteByCode($code: String!) {
    userInviteByCode(code: $code) {
      id
      code
      email
      clubId
      expiresAt
      isExpired
      isUsed
      isValid
      club {
        id
        name
      }
      invitedBy {
        id
        username
        firstName
        lastName
      }
    }
  }
`

export const ACCEPT_USER_INVITE = gql`
  mutation AcceptUserInvite(
    $code: String!
    $username: String!
    $password: String!
    $firstName: String!
    $lastName: String!
  ) {
    acceptUserInvite(
      code: $code
      username: $username
      password: $password
      firstName: $firstName
      lastName: $lastName
    ) {
      id
      username
      email
      firstName
      lastName
    }
  }
`
