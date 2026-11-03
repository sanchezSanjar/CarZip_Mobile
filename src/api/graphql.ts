import { GRAPHQL_URL } from './config';

/** the server answered with an error. message is written for people (API.md §3), code is e.g. UNAUTHENTICATED */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
  }
}

/**
 * One GraphQL request without Apollo: used for login and refresh, which must not go through the Apollo
 * links that add and refresh the token. Throws ApiError, or the fetch error when the network is down.
 */
export async function graphqlRequest<T>(query: string, variables: object = {}, accessToken?: string): Promise<T> {
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: JSON.stringify({ query, variables }),
  });
  const result: { data?: T; errors?: { message: string; extensions?: { code?: string } }[] } = await response.json();
  const error = result.errors?.[0];
  if (error) throw new ApiError(error.message, error.extensions?.code ?? 'INTERNAL_SERVER_ERROR');
  return result.data as T;
}
