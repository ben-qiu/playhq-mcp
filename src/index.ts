import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { config } from './config.js'
import { graphql, loadQuery, searchGraphql } from './graphql.js'
import { findOrganisation, organisations, resolveOrganisationId } from './organisations.js'

const server = new McpServer({
  name: 'playhq-dev',
  version: '1.0.0',
})

server.tool(
  'search_organisations',
  'Search PlayHQ organisations/clubs via search.playhq.com',
  {
    query: z.string().describe('Search text, e.g. "Example Club"'),
    types: z
      .array(z.enum(['CLUB', 'ASSOCIATION']))
      .optional()
      .describe('Organisation types to include (default: CLUB and ASSOCIATION)'),
    page: z.number().optional().describe('Page number (default: 1)'),
    limit: z.number().optional().describe('Results per page (default: 15)'),
    tenantSlug: z
      .string()
      .optional()
      .describe('Tenant slug (default: basketball-victoria)'),
  },
  async ({ query, types, page, limit, tenantSlug }) => {
    const data = await searchGraphql('Search', loadQuery('search.graphql'), {
      filter: {
        meta: {
          limit: limit ?? 15,
          page: page ?? 1,
        },
        organisation: {
          query,
          types: types ?? ['CLUB', 'ASSOCIATION'],
          tenantSlug: tenantSlug ?? config.tenant,
        },
      },
    })
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  'profile_search',
  'Search PlayHQ profiles by full name',
  {
    fullName: z.string().describe('Full name to search, e.g. "Jane Smith"'),
  },
  async ({ fullName }) => {
    const data = await graphql(
      'ProfileSearch',
      loadQuery('profile-search.graphql'),
      { fullName },
    )
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  'get_profile',
  'Look up a PlayHQ profile by ID, including statistics, teams, and milestones',
  {
    profileID: z
      .string()
      .describe('Profile UUID, e.g. "00000000-0000-0000-0000-000000000001"'),
  },
  async ({ profileID }) => {
    const data = await graphql('Profile', loadQuery('profile.graphql'), {
      profileID,
    })
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  'get_profile_teams',
  'List teams for a PlayHQ profile',
  {
    profileId: z
      .string()
      .describe('Profile UUID, e.g. "00000000-0000-0000-0000-000000000002"'),
  },
  async ({ profileId }) => {
    const data = await graphql(
      'ProfileTeams',
      loadQuery('profile-teams.graphql'),
      { profileId },
    )
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  'get_team',
  'Look up a team by ID, including organisation, grade, and season details',
  {
    teamID: z.string().describe('Team ID, e.g. "c64f3cb4"'),
  },
  async ({ teamID }) => {
    const data = await graphql('Team', loadQuery('team.graphql'), { teamID })
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  'get_team_fixture',
  'Look up a team fixture schedule by team ID',
  {
    teamID: z.string().describe('Team ID, e.g. "c64f3cb4"'),
  },
  async ({ teamID }) => {
    const data = await graphql(
      'TeamFixture',
      loadQuery('team-fixture.graphql'),
      { teamID },
    )
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  'get_form_guide_team_fixture',
  'Look up a team form guide fixture (game results summary by round)',
  {
    teamID: z.string().describe('Team ID, e.g. "6c7168da"'),
  },
  async ({ teamID }) => {
    const data = await graphql(
      'FormGuideTeamFixture',
      loadQuery('form-guide-team-fixture.graphql'),
      { teamID },
    )
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  'get_grade',
  'Look up a grade by ID (scores visibility, dates, season, external stats URLs)',
  {
    gradeId: z.string().describe('Grade ID, e.g. "72158406"'),
  },
  async ({ gradeId }) => {
    const data = await graphql(
      'DiscoverGrade',
      loadQuery('discover-grade.graphql'),
      { gradeId },
    )
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  'get_grade_fixtures',
  'Look up fixture rounds for a grade',
  {
    gradeId: z.string().describe('Grade ID, e.g. "72158406"'),
  },
  async ({ gradeId }) => {
    const data = await graphql(
      'Fixtures',
      loadQuery('fixtures.graphql'),
      { gradeId },
    )
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  'get_fixture_by_round',
  'Look up games and byes for a fixture round',
  {
    roundId: z.string().describe('Round ID, e.g. "e65c8a7a"'),
  },
  async ({ roundId }) => {
    const data = await graphql(
      'DiscoverFixtureByRound',
      loadQuery('discover-fixture-by-round.graphql'),
      { roundId },
    )
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  'get_grade_ladder',
  'Look up a grade ladder, optionally filtered to a team',
  {
    gradeID: z.string().describe('Grade ID, e.g. "f8da3523"'),
    teamID: z
      .string()
      .optional()
      .describe('Optional team ID to filter ladder, e.g. "c64f3cb4"'),
  },
  async ({ gradeID, teamID }) => {
    const data = await graphql(
      'GradeLadder',
      loadQuery('grade-ladder.graphql'),
      { gradeID, teamID },
    )
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  'get_game',
  'Look up a game by ID — box score, player stats, and player numbers',
  {
    gameID: z.string().describe('Game ID, e.g. "f4ffa9c0"'),
  },
  async ({ gameID }) => {
    const data = await graphql(
      'DiscoverGame',
      loadQuery('discover-game.graphql'),
      { gameID },
    )
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  'get_season',
  'Look up a season with grades (default) or club teams when isClub is true',
  {
    seasonId: z.string().describe('Season ID, e.g. "2ecfa56c"'),
    organisationId: z
      .string()
      .describe(
        'Organisation ID for team filter, e.g. "08f42de2". Names EDJBA/VJBL are resolved.',
      ),
    isClub: z
      .boolean()
      .optional()
      .describe(
        'If true, fetch club teams instead of grades (default: false)',
      ),
  },
  async ({ seasonId, organisationId, isClub }) => {
    const orgId = resolveOrganisationId(organisationId)
    const data = await graphql('Season', loadQuery('season.graphql'), {
      seasonId,
      isClub: isClub ?? false,
      filter: {
        seasonID: seasonId,
        organisationID: orgId,
      },
    })
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  'get_organisation',
  'Look up a PlayHQ organisation by organisationId (same value as GraphQL code). Names like EDJBA/VJBL are resolved to IDs first.',
  {
    organisationId: z
      .string()
      .describe(
        'Organisation ID, e.g. "08f42de2" (same as code in the API). Known names EDJBA/VJBL are resolved automatically.',
      ),
  },
  async ({ organisationId }) => {
    const id = resolveOrganisationId(organisationId)
    const data = await graphql(
      'Organisation',
      loadQuery('organisation.graphql'),
      { code: id, organisationID: id },
    )
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  'get_organisation_competitions',
  'List competitions and seasons for an organisation',
  {
    organisationId: z
      .string()
      .describe(
        'Organisation ID, e.g. "2b434ebe". Known names EDJBA/VJBL are resolved automatically.',
      ),
  },
  async ({ organisationId }) => {
    const id = resolveOrganisationId(organisationId)
    const data = await graphql(
      'OrganisationCompetitions',
      loadQuery('organisation-competitions.graphql'),
      { organisationId: id },
    )
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

server.tool(
  'list_organisations',
  'List known PlayHQ organisation IDs (EDJBA, VJBL). Optionally look up by name or organisationId.',
  {
    query: z
      .string()
      .optional()
      .describe('Optional name or organisationId filter, e.g. "EDJBA" or "0c8a84ea"'),
  },
  async ({ query }) => {
    const result = query ? findOrganisation(query) : organisations
    return {
      content: [{ type: 'text', text: JSON.stringify(result ?? [], null, 2) }],
    }
  },
)

server.tool(
  'get_outswing_version',
  'Fetch PlayHQ outswing version configuration for the tenant',
  {},
  async () => {
    const data = await graphql(
      'GetOutswingVersion',
      loadQuery('get-outswing-version.graphql'),
      {},
    )
    return {
      content: [{ type: 'text', text: JSON.stringify(data, null, 2) }],
    }
  },
)

async function main(): Promise<void> {
  if (config.transport === 'stdio') {
    await server.connect(new StdioServerTransport())
  } else {
    throw new Error(
      `Unsupported MCP_TRANSPORT="${config.transport}". Use "stdio" for Cursor. HTTP transport can be added later for ChatGPT.`,
    )
  }
}

main().catch((error: unknown) => {
  console.error(error)
  process.exit(1)
})
