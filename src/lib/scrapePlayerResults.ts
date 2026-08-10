export interface ScrapedResult {
  tournamentName: string
  eventDate: string | null
  position: string | null
  totalScore: number | null
  toPar: string | null
  earnings: string | null
}

interface NextDataQuery {
  queryKey: unknown[]
  state: { data?: { resultsData?: { data?: { fields?: string[] }[] }[] } }
}

function parseDate(raw: string): string | null {
  const match = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
  if (!match) return null
  const [, month, day, year] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

function cleanField(value: string | undefined): string | null {
  if (!value || value === '-') return null
  return value
}

// PGA Tour player pages embed their results table as JSON in a
// __NEXT_DATA__ script tag rather than exposing a documented API, so
// this parses that blob directly (same approach as scripts/scrape_schedules.py).
export async function fetchPlayerResults(playerUrl: string): Promise<ScrapedResult[]> {
  let url: URL
  try {
    url = new URL(playerUrl)
  } catch {
    throw new Error("That doesn't look like a valid URL.")
  }
  if (!url.hostname.endsWith('pgatour.com')) {
    throw new Error('Please paste a pgatour.com player page URL.')
  }

  const path = url.pathname.replace(/\/+$/, '')
  const resultsUrl = `${url.origin}${path.endsWith('/results') ? path : `${path}/results`}`

  const res = await fetch(resultsUrl)
  if (!res.ok) throw new Error(`Could not load that page (HTTP ${res.status}).`)
  const html = await res.text()

  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
  if (!match) throw new Error('Could not find results data on that page.')

  const parsed: { props?: { pageProps?: { dehydratedState?: { queries?: NextDataQuery[] } } } } =
    JSON.parse(match[1])
  const queries = parsed.props?.pageProps?.dehydratedState?.queries ?? []

  const resultsQuery = queries.find((q) => {
    const lastKey = q.queryKey[q.queryKey.length - 1]
    return (
      q.queryKey[0] === 'playerProfileResults' &&
      typeof lastKey === 'object' &&
      lastKey !== null &&
      'season' in lastKey
    )
  })

  const rows = resultsQuery?.state.data?.resultsData?.[0]?.data ?? []
  if (rows.length === 0) throw new Error('No results found for that player.')

  const results: ScrapedResult[] = []
  for (const row of rows) {
    const fields = row.fields
    if (!fields || fields.length < 12) continue
    results.push({
      eventDate: parseDate(fields[0]),
      tournamentName: fields[1],
      position: cleanField(fields[2]),
      totalScore: /^\d+$/.test(fields[7]) ? Number(fields[7]) : null,
      toPar: cleanField(fields[8]),
      earnings: cleanField(fields[11]),
    })
  }

  return results
}
