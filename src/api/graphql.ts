import { GRAPHQL_URL } from './config';

export const REQUEST_TIMEOUT = 15000; // ms

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
  // a server that never answers must not hang the app (AbortSignal.timeout is not in every React Native)
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  const response = await fetch(GRAPHQL_URL, {
    signal: controller.signal,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
    },
    body: JSON.stringify({ query, variables }),
  }).finally(() => clearTimeout(timer));
  const result: { data?: T; errors?: { message: string; extensions?: { code?: string } }[] } = await response.json();
  const error = result.errors?.[0];
  if (error) throw new ApiError(error.message, error.extensions?.code ?? 'INTERNAL_SERVER_ERROR');
  return result.data as T;
}
