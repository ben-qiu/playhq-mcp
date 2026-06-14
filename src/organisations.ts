export type Organisation = {
  organisationId: string
  name: string
  aliases: string[]
  notes?: string
}

/** Known PlayHQ organisation IDs for basketball-victoria tenant. */
export const organisations: Organisation[] = [
  {
    organisationId: '0c8a84ea',
    name: 'EDJBA',
    aliases: ['Eastern District Junior Basketball Association', 'EDJBA'],
    notes: 'Junior district competition in Melbourne eastern suburbs.',
  },
  {
    organisationId: '08f42de2',
    name: 'VJBL',
    aliases: ['Victorian Junior Basketball League', 'VJBL'],
    notes: 'State junior representative/league competition in Victoria.',
  },
]

const organisationIdPattern = /^[0-9a-f]{8}$/i

export function findOrganisation(query: string): Organisation | undefined {
  const normalised = query.trim().toLowerCase()
  return organisations.find(
    (org) =>
      org.organisationId.toLowerCase() === normalised ||
      org.name.toLowerCase() === normalised ||
      org.aliases.some((alias) => alias.toLowerCase() === normalised),
  )
}

/** Resolve a name or ID to the PlayHQ organisationId (same value used as GraphQL `code`). */
export function resolveOrganisationId(input: string): string {
  const org = findOrganisation(input)
  if (org) {
    return org.organisationId
  }

  const trimmed = input.trim()
  if (organisationIdPattern.test(trimmed)) {
    return trimmed
  }

  throw new Error(
    `Unknown organisation "${input}". Pass an organisationId (e.g. "08f42de2"), not a name alone — or use a known name (EDJBA, VJBL). See list_organisations.`,
  )
}
