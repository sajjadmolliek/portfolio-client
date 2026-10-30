import type { ContributionDay } from '@/components/GitHubActivity';

/**
 * Server-side GitHub proxy for the `GitHub Activity` card on /about.
 *
 * The personal access token lives only here (env `GITHUB_TOKEN`) — the browser
 * never sees it, it is never baked into a bundle, and the response is cached for
 * five minutes so a page view does not cost a GraphQL request.
 *
 *   GET /api/github        → { login, total, weeks: ContributionDay[][] }
 */

export const revalidate = 300;

const LOGIN = process.env.GITHUB_LOGIN || 'sajjadmolliek';

const QUERY = `
  query ($login: String!) {
    user(login: $login) {
      login
      avatarUrl
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
              color
            }
          }
        }
      }
    }
  }
`;

interface GraphQLError {
  message: string;
}

export async function GET(): Promise<Response> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return Response.json(
      { error: 'GITHUB_TOKEN is not configured on this deployment.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'portfolio-activity',
      },
      body: JSON.stringify({ query: QUERY, variables: { login: LOGIN } }),
    });

    if (!res.ok) {
      return Response.json(
        { error: `GitHub responded ${res.status}` },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const payload = (await res.json()) as {
      data?: {
        user?: {
          login: string;
          contributionsCollection: {
            contributionCalendar: {
              totalContributions: number;
              weeks: { contributionDays: ContributionDay[] }[];
            };
          };
        };
      };
      errors?: GraphQLError[];
    };

    const user = payload.data?.user;
    if (!user) {
      return Response.json(
        { error: payload.errors?.[0]?.message || 'GitHub user not found' },
        { status: 502, headers: { 'Cache-Control': 'no-store' } },
      );
    }

    const calendar = user.contributionsCollection.contributionCalendar;
    return Response.json(
      {
        login: user.login,
        total: calendar.totalContributions,
        weeks: calendar.weeks.map(w => w.contributionDays),
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=1200',
        },
      },
    );
  } catch (err) {
    return Response.json(
      { error: String((err as Error)?.message || err) },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    );
  }
}
