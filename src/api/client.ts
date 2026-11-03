import { ApolloClient, ApolloLink, CombinedGraphQLErrors, HttpLink, InMemoryCache } from '@apollo/client';
import { SetContextLink } from '@apollo/client/link/context';
import { ErrorLink } from '@apollo/client/link/error';
import { from, switchMap } from 'rxjs';

import { getAccessToken, refreshAccessToken } from '@/auth/session';

import { GRAPHQL_URL } from './config';

// every request: the access token when logged in, refreshed first when it is about to expire
const authLink = new SetContextLink(async (prevContext) => {
  const token = await getAccessToken();
  return { headers: { ...prevContext.headers, ...(token && { Authorization: `Bearer ${token}` }) } };
});

// the server refused a token that was still valid by time (an admin changed the role, the password was changed
// on another device): refresh once and send the request again. If the refresh is refused too, this phone is logged out
const retryLink = new ErrorLink(({ error, operation, forward }) => {
  const unauthenticated =
    CombinedGraphQLErrors.is(error) && error.errors.some((e) => e.extensions?.code === 'UNAUTHENTICATED');
  const { headers, retried } = operation.getContext();
  if (!unauthenticated || retried || !headers?.Authorization) return;
  operation.setContext({ retried: true });
  return from(refreshAccessToken()).pipe(switchMap(() => forward(operation)));
});

export const apolloClient = new ApolloClient({
  link: ApolloLink.from([retryLink, authLink, new HttpLink({ uri: GRAPHQL_URL })]),
  cache: new InMemoryCache(),
});
