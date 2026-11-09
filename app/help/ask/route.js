import { unstable_cache } from 'next/cache'

const DOCS_URL = 'https://docs.openreview.net'
const ASK_URL = `${DOCS_URL}/~gitbook/mcp`
const MAX_QUESTION_LENGTH = 500
const MAX_SOURCES = 5
const REQUEST_TIMEOUT_MS = 45000
const ANSWER_REVALIDATE_SECONDS = 24 * 60 * 60

export const dynamic = 'force-dynamic'

function normalizeQuestion(question) {
  return question.trim().replace(/\s+/g, ' ')
}

function parseMessages(body) {
  if (body.trimStart().startsWith('{')) {
    try {
      return [JSON.parse(body)]
    } catch {
      return []
    }
  }

  return body
    .split('\n')
    .filter((line) => line.startsWith('data:'))
    .map((line) => {
      try {
        return JSON.parse(line.slice(5).trim())
      } catch {
        return null
      }
    })
    .filter(Boolean)
}

function toAbsoluteDocsUrl(path) {
  if (/^https?:\/\//.test(path)) return path
  return path.startsWith('/') ? `${DOCS_URL}${path}` : path
}

function splitSources(text) {
  const [answer, sourcesSection] = text.split(/\n#+\s*Sources\s*\n/)
  const sources = []
  const seen = new Set()

  for (const match of (sourcesSection ?? '').matchAll(
    /^\s*[-*]\s*\[([^\]]+)\]\(([^)]+)\)/gm
  )) {
    const url = toAbsoluteDocsUrl(match[2].trim())
    if (seen.has(url)) continue
    seen.add(url)
    sources.push({ title: match[1].trim(), url })
    if (sources.length === MAX_SOURCES) break
  }

  return { answer: answer.trim(), sources }
}

function absolutizeMarkdownLinks(markdown) {
  return markdown.replace(/\]\((\/[^)\s]*)\)/g, (_, path) => `](${DOCS_URL}${path})`)
}

const askDocumentation = unstable_cache(
  async (question) => {
    const response = await fetch(ASK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: { name: 'askQuestion', arguments: { question } },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) throw new Error(`Documentation search returned ${response.status}`)

    const message = parseMessages(await response.text()).find((m) => m?.result || m?.error)
    if (!message) throw new Error('Documentation search returned an unrecognized response')

    if (message.error || message.result?.isError) {
      throw new Error(message.error?.message ?? 'Documentation search failed')
    }

    const text = message.result?.content
      ?.filter((item) => item.type === 'text')
      .map((item) => item.text)
      .join('\n\n')

    if (!text?.trim()) throw new Error('Documentation search returned no content')

    const { answer, sources } = splitSources(text)
    return { answer: absolutizeMarkdownLinks(answer), sources }
  },
  ['contact-docs-ask'],
  { revalidate: ANSWER_REVALIDATE_SECONDS }
)

export async function POST(request) {
  let question
  try {
    ;({ question } = await request.json())
  } catch {
    return Response.json({ message: 'Invalid request.' }, { status: 400 })
  }

  if (typeof question !== 'string' || !question.trim()) {
    return Response.json({ message: 'Please enter a question.' }, { status: 400 })
  }
  if (question.length > MAX_QUESTION_LENGTH) {
    return Response.json(
      { message: `Please keep your question under ${MAX_QUESTION_LENGTH} characters.` },
      { status: 400 }
    )
  }

  try {
    return Response.json(await askDocumentation(normalizeQuestion(question)))
  } catch (error) {
    const timedOut = error.name === 'TimeoutError' || error.name === 'AbortError'
    return Response.json(
      {
        message: timedOut
          ? 'The documentation search took too long to respond. Please try again or contact us below.'
          : 'There was an error searching the documentation. Please try again or contact us below.',
      },
      { status: 502 }
    )
  }
}
