import type { ResourcesConfig } from 'aws-amplify'

// Cognito User Pool wiring, shared by the browser client and the SSR adapter.
// Amplify infers the AWS region from the User Pool ID, so it isn't listed here.
export const authConfig: ResourcesConfig = {
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!,
    },
  },
}
