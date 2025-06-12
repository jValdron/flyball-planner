/* eslint-disable */
import * as types from './graphql';
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query GetPracticeAttendances($practiceId: String!) {\n    practiceAttendances(practiceId: $practiceId) {\n      id\n      dogId\n      attending\n      dog {\n        id\n        name\n        ownerId\n      }\n    }\n  }\n": typeof types.GetPracticeAttendancesDocument,
    "\n  mutation UpdateAttendances($practiceId: String!, $updates: [AttendanceUpdate!]!) {\n    updateAttendances(practiceId: $practiceId, updates: $updates) {\n      id\n      dogId\n      attending\n    }\n  }\n": typeof types.UpdateAttendancesDocument,
    "\n    query GetClubs {\n      clubs {\n        id\n        name\n        nafaClubNumber\n        defaultPracticeTime\n      }\n    }\n  ": typeof types.GetClubsDocument,
    "\n  query GetDogsByHandlersInClub($clubId: ID!) {\n    dogsByHandlersInClub(clubId: $clubId) {\n      id\n      givenName\n      surname\n      dogs {\n        id\n        name\n        crn\n        status\n        trainingLevel\n      }\n    }\n  }\n": typeof types.GetDogsByHandlersInClubDocument,
    "\n  query GetDogById($id: String!) {\n    dog(id: $id) {\n      id\n      name\n      crn\n      status\n      trainingLevel\n      ownerId\n      updatedAt\n      createdAt\n    }\n  }\n": typeof types.GetDogByIdDocument,
    "\n  query GetActiveDogsInClub($clubId: ID!) {\n    activeDogsInClub(clubId: $clubId)\n  }\n": typeof types.GetActiveDogsInClubDocument,
    "\n  mutation DeleteDog($id: String!) {\n    deleteDog(id: $id)\n  }\n": typeof types.DeleteDogDocument,
    "\n  mutation CreateDog(\n    $name: String!\n    $ownerId: String!\n    $clubId: String!\n    $trainingLevel: Float!\n    $status: DogStatus!\n    $crn: String\n  ) {\n    createDog(\n      name: $name\n      ownerId: $ownerId\n      clubId: $clubId\n      trainingLevel: $trainingLevel\n      status: $status\n      crn: $crn\n    ) {\n      id\n      name\n      crn\n      status\n      trainingLevel\n      ownerId\n    }\n  }\n": typeof types.CreateDogDocument,
    "\n  mutation UpdateDog(\n    $id: String!\n    $name: String\n    $ownerId: String\n    $clubId: String\n    $trainingLevel: Float\n    $status: DogStatus\n    $crn: String\n  ) {\n    updateDog(\n      id: $id\n      name: $name\n      ownerId: $ownerId\n      clubId: $clubId\n      trainingLevel: $trainingLevel\n      status: $status\n      crn: $crn\n    ) {\n      id\n      name\n      crn\n      status\n      trainingLevel\n      ownerId\n    }\n  }\n": typeof types.UpdateDogDocument,
    "\n    query GetHandlerById($id: String!) {\n      handler(id: $id) {\n        id\n        givenName\n        surname\n        createdAt\n        updatedAt\n      }\n    }\n  ": typeof types.GetHandlerByIdDocument,
    "\n    mutation CreateHandler($givenName: String!, $surname: String!, $clubId: ID!) {\n      createHandler(givenName: $givenName, surname: $surname, clubId: $clubId) {\n        id\n        givenName\n        surname\n      }\n    }\n  ": typeof types.CreateHandlerDocument,
    "\n    mutation UpdateHandler($id: String!, $givenName: String, $surname: String) {\n      updateHandler(id: $id, givenName: $givenName, surname: $surname) {\n        id\n        givenName\n        surname\n      }\n    }\n  ": typeof types.UpdateHandlerDocument,
    "\n    mutation DeleteHandler($id: String!) {\n      deleteHandler(id: $id)\n    }\n  ": typeof types.DeleteHandlerDocument,
    "\n    query GetPracticesByClub($clubId: String!) {\n      practicesByClub(clubId: $clubId) {\n        id\n        scheduledAt\n        status\n        attendances {\n          id\n          attending\n        }\n        sets {\n          id\n        }\n      }\n    }\n  ": typeof types.GetPracticesByClubDocument,
    "\n  query GetPractice($id: String!) {\n    practice(id: $id) {\n      id\n      scheduledAt\n      status\n      clubId\n    }\n  }\n": typeof types.GetPracticeDocument,
    "\n  mutation CreatePractice($clubId: String!, $scheduledAt: DateTimeISO!, $status: PracticeStatus!) {\n    createPractice(clubId: $clubId, scheduledAt: $scheduledAt, status: $status) {\n      id\n      scheduledAt\n      status\n      clubId\n    }\n  }\n": typeof types.CreatePracticeDocument,
    "\n  mutation UpdatePractice($id: String!, $clubId: String, $scheduledAt: DateTimeISO, $status: PracticeStatus) {\n    updatePractice(id: $id, clubId: $clubId, scheduledAt: $scheduledAt, status: $status) {\n      id\n      scheduledAt\n      status\n      clubId\n    }\n  }\n": typeof types.UpdatePracticeDocument,
    "\n  mutation DeletePractice($id: String!) {\n    deletePractice(id: $id)\n  }\n": typeof types.DeletePracticeDocument,
};
const documents: Documents = {
    "\n  query GetPracticeAttendances($practiceId: String!) {\n    practiceAttendances(practiceId: $practiceId) {\n      id\n      dogId\n      attending\n      dog {\n        id\n        name\n        ownerId\n      }\n    }\n  }\n": types.GetPracticeAttendancesDocument,
    "\n  mutation UpdateAttendances($practiceId: String!, $updates: [AttendanceUpdate!]!) {\n    updateAttendances(practiceId: $practiceId, updates: $updates) {\n      id\n      dogId\n      attending\n    }\n  }\n": types.UpdateAttendancesDocument,
    "\n    query GetClubs {\n      clubs {\n        id\n        name\n        nafaClubNumber\n        defaultPracticeTime\n      }\n    }\n  ": types.GetClubsDocument,
    "\n  query GetDogsByHandlersInClub($clubId: ID!) {\n    dogsByHandlersInClub(clubId: $clubId) {\n      id\n      givenName\n      surname\n      dogs {\n        id\n        name\n        crn\n        status\n        trainingLevel\n      }\n    }\n  }\n": types.GetDogsByHandlersInClubDocument,
    "\n  query GetDogById($id: String!) {\n    dog(id: $id) {\n      id\n      name\n      crn\n      status\n      trainingLevel\n      ownerId\n      updatedAt\n      createdAt\n    }\n  }\n": types.GetDogByIdDocument,
    "\n  query GetActiveDogsInClub($clubId: ID!) {\n    activeDogsInClub(clubId: $clubId)\n  }\n": types.GetActiveDogsInClubDocument,
    "\n  mutation DeleteDog($id: String!) {\n    deleteDog(id: $id)\n  }\n": types.DeleteDogDocument,
    "\n  mutation CreateDog(\n    $name: String!\n    $ownerId: String!\n    $clubId: String!\n    $trainingLevel: Float!\n    $status: DogStatus!\n    $crn: String\n  ) {\n    createDog(\n      name: $name\n      ownerId: $ownerId\n      clubId: $clubId\n      trainingLevel: $trainingLevel\n      status: $status\n      crn: $crn\n    ) {\n      id\n      name\n      crn\n      status\n      trainingLevel\n      ownerId\n    }\n  }\n": types.CreateDogDocument,
    "\n  mutation UpdateDog(\n    $id: String!\n    $name: String\n    $ownerId: String\n    $clubId: String\n    $trainingLevel: Float\n    $status: DogStatus\n    $crn: String\n  ) {\n    updateDog(\n      id: $id\n      name: $name\n      ownerId: $ownerId\n      clubId: $clubId\n      trainingLevel: $trainingLevel\n      status: $status\n      crn: $crn\n    ) {\n      id\n      name\n      crn\n      status\n      trainingLevel\n      ownerId\n    }\n  }\n": types.UpdateDogDocument,
    "\n    query GetHandlerById($id: String!) {\n      handler(id: $id) {\n        id\n        givenName\n        surname\n        createdAt\n        updatedAt\n      }\n    }\n  ": types.GetHandlerByIdDocument,
    "\n    mutation CreateHandler($givenName: String!, $surname: String!, $clubId: ID!) {\n      createHandler(givenName: $givenName, surname: $surname, clubId: $clubId) {\n        id\n        givenName\n        surname\n      }\n    }\n  ": types.CreateHandlerDocument,
    "\n    mutation UpdateHandler($id: String!, $givenName: String, $surname: String) {\n      updateHandler(id: $id, givenName: $givenName, surname: $surname) {\n        id\n        givenName\n        surname\n      }\n    }\n  ": types.UpdateHandlerDocument,
    "\n    mutation DeleteHandler($id: String!) {\n      deleteHandler(id: $id)\n    }\n  ": types.DeleteHandlerDocument,
    "\n    query GetPracticesByClub($clubId: String!) {\n      practicesByClub(clubId: $clubId) {\n        id\n        scheduledAt\n        status\n        attendances {\n          id\n          attending\n        }\n        sets {\n          id\n        }\n      }\n    }\n  ": types.GetPracticesByClubDocument,
    "\n  query GetPractice($id: String!) {\n    practice(id: $id) {\n      id\n      scheduledAt\n      status\n      clubId\n    }\n  }\n": types.GetPracticeDocument,
    "\n  mutation CreatePractice($clubId: String!, $scheduledAt: DateTimeISO!, $status: PracticeStatus!) {\n    createPractice(clubId: $clubId, scheduledAt: $scheduledAt, status: $status) {\n      id\n      scheduledAt\n      status\n      clubId\n    }\n  }\n": types.CreatePracticeDocument,
    "\n  mutation UpdatePractice($id: String!, $clubId: String, $scheduledAt: DateTimeISO, $status: PracticeStatus) {\n    updatePractice(id: $id, clubId: $clubId, scheduledAt: $scheduledAt, status: $status) {\n      id\n      scheduledAt\n      status\n      clubId\n    }\n  }\n": types.UpdatePracticeDocument,
    "\n  mutation DeletePractice($id: String!) {\n    deletePractice(id: $id)\n  }\n": types.DeletePracticeDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetPracticeAttendances($practiceId: String!) {\n    practiceAttendances(practiceId: $practiceId) {\n      id\n      dogId\n      attending\n      dog {\n        id\n        name\n        ownerId\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetPracticeAttendances($practiceId: String!) {\n    practiceAttendances(practiceId: $practiceId) {\n      id\n      dogId\n      attending\n      dog {\n        id\n        name\n        ownerId\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateAttendances($practiceId: String!, $updates: [AttendanceUpdate!]!) {\n    updateAttendances(practiceId: $practiceId, updates: $updates) {\n      id\n      dogId\n      attending\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateAttendances($practiceId: String!, $updates: [AttendanceUpdate!]!) {\n    updateAttendances(practiceId: $practiceId, updates: $updates) {\n      id\n      dogId\n      attending\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetClubs {\n      clubs {\n        id\n        name\n        nafaClubNumber\n        defaultPracticeTime\n      }\n    }\n  "): (typeof documents)["\n    query GetClubs {\n      clubs {\n        id\n        name\n        nafaClubNumber\n        defaultPracticeTime\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetDogsByHandlersInClub($clubId: ID!) {\n    dogsByHandlersInClub(clubId: $clubId) {\n      id\n      givenName\n      surname\n      dogs {\n        id\n        name\n        crn\n        status\n        trainingLevel\n      }\n    }\n  }\n"): (typeof documents)["\n  query GetDogsByHandlersInClub($clubId: ID!) {\n    dogsByHandlersInClub(clubId: $clubId) {\n      id\n      givenName\n      surname\n      dogs {\n        id\n        name\n        crn\n        status\n        trainingLevel\n      }\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetDogById($id: String!) {\n    dog(id: $id) {\n      id\n      name\n      crn\n      status\n      trainingLevel\n      ownerId\n      updatedAt\n      createdAt\n    }\n  }\n"): (typeof documents)["\n  query GetDogById($id: String!) {\n    dog(id: $id) {\n      id\n      name\n      crn\n      status\n      trainingLevel\n      ownerId\n      updatedAt\n      createdAt\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetActiveDogsInClub($clubId: ID!) {\n    activeDogsInClub(clubId: $clubId)\n  }\n"): (typeof documents)["\n  query GetActiveDogsInClub($clubId: ID!) {\n    activeDogsInClub(clubId: $clubId)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeleteDog($id: String!) {\n    deleteDog(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeleteDog($id: String!) {\n    deleteDog(id: $id)\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreateDog(\n    $name: String!\n    $ownerId: String!\n    $clubId: String!\n    $trainingLevel: Float!\n    $status: DogStatus!\n    $crn: String\n  ) {\n    createDog(\n      name: $name\n      ownerId: $ownerId\n      clubId: $clubId\n      trainingLevel: $trainingLevel\n      status: $status\n      crn: $crn\n    ) {\n      id\n      name\n      crn\n      status\n      trainingLevel\n      ownerId\n    }\n  }\n"): (typeof documents)["\n  mutation CreateDog(\n    $name: String!\n    $ownerId: String!\n    $clubId: String!\n    $trainingLevel: Float!\n    $status: DogStatus!\n    $crn: String\n  ) {\n    createDog(\n      name: $name\n      ownerId: $ownerId\n      clubId: $clubId\n      trainingLevel: $trainingLevel\n      status: $status\n      crn: $crn\n    ) {\n      id\n      name\n      crn\n      status\n      trainingLevel\n      ownerId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdateDog(\n    $id: String!\n    $name: String\n    $ownerId: String\n    $clubId: String\n    $trainingLevel: Float\n    $status: DogStatus\n    $crn: String\n  ) {\n    updateDog(\n      id: $id\n      name: $name\n      ownerId: $ownerId\n      clubId: $clubId\n      trainingLevel: $trainingLevel\n      status: $status\n      crn: $crn\n    ) {\n      id\n      name\n      crn\n      status\n      trainingLevel\n      ownerId\n    }\n  }\n"): (typeof documents)["\n  mutation UpdateDog(\n    $id: String!\n    $name: String\n    $ownerId: String\n    $clubId: String\n    $trainingLevel: Float\n    $status: DogStatus\n    $crn: String\n  ) {\n    updateDog(\n      id: $id\n      name: $name\n      ownerId: $ownerId\n      clubId: $clubId\n      trainingLevel: $trainingLevel\n      status: $status\n      crn: $crn\n    ) {\n      id\n      name\n      crn\n      status\n      trainingLevel\n      ownerId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetHandlerById($id: String!) {\n      handler(id: $id) {\n        id\n        givenName\n        surname\n        createdAt\n        updatedAt\n      }\n    }\n  "): (typeof documents)["\n    query GetHandlerById($id: String!) {\n      handler(id: $id) {\n        id\n        givenName\n        surname\n        createdAt\n        updatedAt\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation CreateHandler($givenName: String!, $surname: String!, $clubId: ID!) {\n      createHandler(givenName: $givenName, surname: $surname, clubId: $clubId) {\n        id\n        givenName\n        surname\n      }\n    }\n  "): (typeof documents)["\n    mutation CreateHandler($givenName: String!, $surname: String!, $clubId: ID!) {\n      createHandler(givenName: $givenName, surname: $surname, clubId: $clubId) {\n        id\n        givenName\n        surname\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation UpdateHandler($id: String!, $givenName: String, $surname: String) {\n      updateHandler(id: $id, givenName: $givenName, surname: $surname) {\n        id\n        givenName\n        surname\n      }\n    }\n  "): (typeof documents)["\n    mutation UpdateHandler($id: String!, $givenName: String, $surname: String) {\n      updateHandler(id: $id, givenName: $givenName, surname: $surname) {\n        id\n        givenName\n        surname\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    mutation DeleteHandler($id: String!) {\n      deleteHandler(id: $id)\n    }\n  "): (typeof documents)["\n    mutation DeleteHandler($id: String!) {\n      deleteHandler(id: $id)\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n    query GetPracticesByClub($clubId: String!) {\n      practicesByClub(clubId: $clubId) {\n        id\n        scheduledAt\n        status\n        attendances {\n          id\n          attending\n        }\n        sets {\n          id\n        }\n      }\n    }\n  "): (typeof documents)["\n    query GetPracticesByClub($clubId: String!) {\n      practicesByClub(clubId: $clubId) {\n        id\n        scheduledAt\n        status\n        attendances {\n          id\n          attending\n        }\n        sets {\n          id\n        }\n      }\n    }\n  "];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetPractice($id: String!) {\n    practice(id: $id) {\n      id\n      scheduledAt\n      status\n      clubId\n    }\n  }\n"): (typeof documents)["\n  query GetPractice($id: String!) {\n    practice(id: $id) {\n      id\n      scheduledAt\n      status\n      clubId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation CreatePractice($clubId: String!, $scheduledAt: DateTimeISO!, $status: PracticeStatus!) {\n    createPractice(clubId: $clubId, scheduledAt: $scheduledAt, status: $status) {\n      id\n      scheduledAt\n      status\n      clubId\n    }\n  }\n"): (typeof documents)["\n  mutation CreatePractice($clubId: String!, $scheduledAt: DateTimeISO!, $status: PracticeStatus!) {\n    createPractice(clubId: $clubId, scheduledAt: $scheduledAt, status: $status) {\n      id\n      scheduledAt\n      status\n      clubId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation UpdatePractice($id: String!, $clubId: String, $scheduledAt: DateTimeISO, $status: PracticeStatus) {\n    updatePractice(id: $id, clubId: $clubId, scheduledAt: $scheduledAt, status: $status) {\n      id\n      scheduledAt\n      status\n      clubId\n    }\n  }\n"): (typeof documents)["\n  mutation UpdatePractice($id: String!, $clubId: String, $scheduledAt: DateTimeISO, $status: PracticeStatus) {\n    updatePractice(id: $id, clubId: $clubId, scheduledAt: $scheduledAt, status: $status) {\n      id\n      scheduledAt\n      status\n      clubId\n    }\n  }\n"];
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  mutation DeletePractice($id: String!) {\n    deletePractice(id: $id)\n  }\n"): (typeof documents)["\n  mutation DeletePractice($id: String!) {\n    deletePractice(id: $id)\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;