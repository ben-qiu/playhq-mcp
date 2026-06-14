import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { config } from './config.js'

function getOperationsDir(): string {
  // CJS bundle (dist/mcp.cjs): operations copied to dist/operations
  if (typeof __dirname !== 'undefined') {
    return join(__dirname, 'operations')
  }
  // ESM dev via tsx: run from project root
  return join(process.cwd(), 'operations')
}

const operationsDir = getOperationsDir()

export const loadQuery = (filename: string): string =>
  readFileSync(join(operationsDir, filename), 'utf8')

type GraphqlRequestOptions = {
  endpoint: string
  includeTenant?: boolean
}

async function graphqlRequest<TVariables extends Record<string, unknown>>(
  operationName: string,
  query: string,
  variables: TVariables,
  options: GraphqlRequestOptions,
): Promise<unknown> {
  const headers: Record<string, string> = {
    accept: '*/*',
    'content-type': 'application/json',
    origin: config.origin,
    'request-id': randomUUID(),
    'user-agent': config.userAgent,
  }

  if (options.includeTenant !== false) {
    headers.tenant = config.tenant
  }

  const response = await fetch(options.endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({ operationName, variables, query }),
  })

  const text = await response.text()
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${text}`)
  }

  return JSON.parse(text)
}

export async function graphql<TVariables extends Record<string, unknown>>(
  operationName: string,
  query: string,
  variables: TVariables,
): Promise<unknown> {
  return graphqlRequest(operationName, query, variables, {
    endpoint: config.endpoint,
    includeTenant: true,
  })
}

export async function searchGraphql<TVariables extends Record<string, unknown>>(
  operationName: string,
  query: string,
  variables: TVariables,
): Promise<unknown> {
  return graphqlRequest(operationName, query, variables, {
    endpoint: config.searchEndpoint,
    includeTenant: false,
  })
}
