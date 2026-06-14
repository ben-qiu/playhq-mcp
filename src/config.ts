/** PlayHQ API defaults — override via process.env or your MCP client `env` block. */
export const config = {
  endpoint: process.env.PLAYHQ_GRAPHQL_URL ?? 'https://api.playhq.com/graphql',
  searchEndpoint:
    process.env.PLAYHQ_SEARCH_GRAPHQL_URL ??
    'https://search.playhq.com/graphql',
  tenant: process.env.PLAYHQ_TENANT ?? 'basketball-victoria',
  origin: process.env.PLAYHQ_ORIGIN ?? 'https://www.playhq.com',
  userAgent:
    process.env.PLAYHQ_USER_AGENT ??
    'PlayHQ/1.45.2 Android/31 (Android SDK built for arm64)',
  transport: process.env.MCP_TRANSPORT ?? 'stdio',
  port: Number(process.env.PORT ?? 3001),
} as const
