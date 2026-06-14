import { graphql, loadQuery, searchGraphql } from '../src/graphql.js'
import { resolveOrganisationId } from '../src/organisations.js'

type Result = { name: string; ok: boolean; detail: string }

const results: Result[] = []

async function check(
  name: string,
  fn: () => Promise<unknown>,
  assert?: (data: unknown) => void,
): Promise<unknown> {
  try {
    const data = await fn()
    const payload = data as { errors?: { message: string }[]; data?: unknown }
    if (payload.errors?.length) {
      results.push({
        name,
        ok: false,
        detail: payload.errors.map((e) => e.message).join('; '),
      })
      return undefined
    }
    assert?.(data)
    results.push({ name, ok: true, detail: 'ok' })
    return data
  } catch (error) {
    results.push({
      name,
      ok: false,
      detail: error instanceof Error ? error.message : String(error),
    })
    return undefined
  }
}

function hasData(data: unknown): void {
  const payload = data as { data?: Record<string, unknown> }
  if (!payload.data || Object.keys(payload.data).length === 0) {
    throw new Error('empty data')
  }
}

async function main(): Promise<void> {
  let teamID = 'c64f3cb4'
  let gradeID = '72158406'
  let roundId = 'e65c8a7a'
  let gameId = 'f4ffa9c0'
  let seasonId = '2ecfa56c'
  let profileId = process.env.SMOKE_PROFILE_ID ?? ''
  const edjbaId = resolveOrganisationId('EDJBA')
  const profileName = process.env.SMOKE_PROFILE_NAME ?? 'John Smith'

  await check('search_organisations (EDJBA ASSOCIATION)', () =>
    searchGraphql('Search', loadQuery('search.graphql'), {
      filter: {
        meta: { limit: 5, page: 1 },
        organisation: {
          query: 'EDJBA',
          types: ['ASSOCIATION'],
          tenantSlug: 'basketball-victoria',
        },
      },
    }),
  )

  await check('get_organisation (EDJBA)', () =>
    graphql('Organisation', loadQuery('organisation.graphql'), {
      code: edjbaId,
      organisationID: edjbaId,
    }),
    hasData,
  )

  await check('get_organisation_competitions (EDJBA)', () =>
    graphql(
      'OrganisationCompetitions',
      loadQuery('organisation-competitions.graphql'),
      { organisationId: edjbaId },
    ),
    hasData,
  )

  await check('get_outswing_version', () =>
    graphql(
      'GetOutswingVersion',
      loadQuery('get-outswing-version.graphql'),
      {},
    ),
    hasData,
  )

  const searchResult = await check('profile_search', () =>
    graphql('ProfileSearch', loadQuery('profile-search.graphql'), {
      fullName: profileName,
    }),
    hasData,
  )

  if (!profileId && searchResult) {
    const first = (
      searchResult as {
        data?: { profileSearch?: { result?: { id?: string }[] } }
      }
    ).data?.profileSearch?.result?.[0]?.id
    if (first) profileId = first
  }

  if (profileId) {
    await check('get_profile', () =>
      graphql('Profile', loadQuery('profile.graphql'), {
        profileID: profileId,
      }),
      hasData,
    )

    await check('get_profile_teams', () =>
      graphql('ProfileTeams', loadQuery('profile-teams.graphql'), {
        profileId,
      }),
      hasData,
    )
  } else {
    results.push({
      name: 'get_profile',
      ok: false,
      detail: 'skipped — no profile ID from profile_search',
    })
    results.push({
      name: 'get_profile_teams',
      ok: false,
      detail: 'skipped — no profile ID from profile_search',
    })
  }

  await check('get_team', () =>
    graphql('Team', loadQuery('team.graphql'), { teamID }),
    hasData,
  )

  await check('get_team_fixture', () =>
    graphql('TeamFixture', loadQuery('team-fixture.graphql'), { teamID }),
    hasData,
  )

  await check('get_form_guide_team_fixture', () =>
    graphql(
      'FormGuideTeamFixture',
      loadQuery('form-guide-team-fixture.graphql'),
      { teamID: '6c7168da' },
    ),
    hasData,
  )

  await check('get_grade', () =>
    graphql('DiscoverGrade', loadQuery('discover-grade.graphql'), {
      gradeId: gradeID,
    }),
    hasData,
  )

  const fixturesData = (await check('get_grade_fixtures', () =>
    graphql('Fixtures', loadQuery('fixtures.graphql'), { gradeId: gradeID }),
  )) as { data?: { discoverGrade?: { rounds?: { id: string }[] } } } | undefined

  if (fixturesData?.data?.discoverGrade?.rounds?.[0]?.id) {
    roundId = fixturesData.data.discoverGrade.rounds[0].id
  }

  await check('get_fixture_by_round', () =>
    graphql(
      'DiscoverFixtureByRound',
      loadQuery('discover-fixture-by-round.graphql'),
      { roundId },
    ),
    hasData,
  )

  await check('get_grade_ladder', () =>
    graphql('GradeLadder', loadQuery('grade-ladder.graphql'), {
      gradeID: 'f8da3523',
      teamID,
    }),
    hasData,
  )

  await check('get_season', () =>
    graphql('Season', loadQuery('season.graphql'), {
      seasonId,
      isClub: false,
      filter: { seasonID: seasonId, organisationID: '08f42de2' },
    }),
    hasData,
  )

  await check('get_game', () =>
    graphql('DiscoverGame', loadQuery('discover-game.graphql'), {
      gameID: gameId,
    }),
    hasData,
  )

  const failed = results.filter((r) => !r.ok)
  console.log('\n=== PlayHQ MCP smoke test ===\n')
  for (const r of results) {
    console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}`)
    if (!r.ok) console.log(`       ${r.detail}`)
  }
  console.log(`\n${results.length - failed.length}/${results.length} passed`)
  if (failed.length) process.exit(1)
}

main()
