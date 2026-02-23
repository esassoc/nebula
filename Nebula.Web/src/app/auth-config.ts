import { environment } from "src/environments/environment";

const authExcludedApiRoutePrefixes = ['public/'];

export function getAuthConfig(): import("@auth0/auth0-angular").AuthConfig {
  return {
    domain: environment.auth0Configuration.domain,
    clientId: environment.auth0Configuration.clientId,
    useRefreshTokens: true,
    //useRefreshTokensFallback: true,  TODO
    cacheLocation: 'localstorage',
    authorizationParams: {
      redirect_uri: window.location.origin,
      audience: environment.auth0Configuration.audience,
      scope: "openid profile email offline_access",
    },
    httpInterceptor: {
      allowedList: [
        {
          uriMatcher: (uri) => {
            const fullUri = `https://${environment.mainAppApiUrl}`;
            if (authExcludedApiRoutePrefixes.some(prefix => uri.includes(prefix))) {
              return false;
            }
            // Only attach tokens to API requests that start with your API URL
            return uri.startsWith(environment.mainAppApiUrl) || uri.startsWith(fullUri);
          },
        },
      ],
    },
  };
}