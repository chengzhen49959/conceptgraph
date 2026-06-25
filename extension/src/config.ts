// Build-time constants, inlined by esbuild `define` (see build.mjs) with
// localhost dev defaults. Kept in one module so every other file imports plain
// strings and never touches the build machinery.
declare const __API_BASE__: string
declare const __APP_ORIGIN__: string
declare const __COGNITO_CLIENT_ID__: string
declare const __COGNITO_USER_POOL_ID__: string

export const API_BASE = __API_BASE__
export const APP_ORIGIN = __APP_ORIGIN__
export const COGNITO_CLIENT_ID = __COGNITO_CLIENT_ID__
export const COGNITO_USER_POOL_ID = __COGNITO_USER_POOL_ID__

// Cognito infers the region from the pool id ("us-east-1_abc" → "us-east-1");
// mirror that so we needn't configure the region twice.
export const COGNITO_REGION = COGNITO_USER_POOL_ID.split('_')[0] || 'us-east-1'
