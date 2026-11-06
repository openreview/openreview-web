import { unstable_cache } from 'next/cache'

const DOCS_URL = 'https://docs.openreview.net'
const DOCS_MCP_URL = process.env.DOCS_MCP_URL || `${DOCS_URL}/~gitbook/mcp`
const MAX_QUESTION_LENGTH = 500
const MAX_SOURCES = 5
const REQUEST_TIMEOUT_MS = 45000
const RATE_LIMIT_WINDOW_MS = 60000
const RATE_LIMIT_MAX_REQUESTS = 10
const ANSWER_REVALIDATE_SECONDS = 24 * 60 * 60

export const dynamic = 'force-dynamic'

const requestLog = new Map()

function normalizeQuestion(question) {
  return question.trim().replace(/\s+/g, ' ')
}

function isRateLimited(clientKey) {
  const now = Date.now()
  for (const [key, timestamps] of requestLog) {
    const recent = timestamps.filter((at) => now - at < RATE_LIMIT_WINDOW_MS)
    if (recent.length) requestLog.set(key, recent)
    else requestLog.delete(key)
  }

  const timestamps = requestLog.get(clientKey) ?? []
  if (timestamps.length >= RATE_LIMIT_MAX_REQUESTS) return true

  requestLog.set(clientKey, [...timestamps, now])
  return false
}

function parseEventStream(body) {
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
  if (path.startsWith('/')) return `${DOCS_URL}${path}`
  return path
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
    const response = await fetch(DOCS_MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/call',
        params: {
          name: 'askQuestion',
          arguments: { question },
        },
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (!response.ok) throw new Error(`Documentation search returned ${response.status}`)

    const body = await response.text()
    const message = parseEventStream(body).find((m) => m.result || m.error) ?? {}

    if (message.error) throw new Error(message.error.message ?? 'Documentation search failed')

    const text = message.result?.content
      ?.filter((item) => item.type === 'text')
      .map((item) => item.text)
      .join('\n\n')

    if (!text?.trim()) return { answer: '', sources: [] }

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

  const clientKey = (request.headers.get('x-forwarded-for') ?? 'unknown').split(',')[0].trim()
  if (isRateLimited(clientKey)) {
    return Response.json(
      {
        message:
          'Too many questions in a short time. Please wait a moment, browse the documentation, or submit a support request below.',
      },
      { status: 429 }
    )
  }

  try {
    return Response.json(await askDocumentation(normalizeQuestion(question)))
  } catch (error) {
    const timedOut = error.name === 'TimeoutError' || error.name === 'AbortError'
    return Response.json(
      {
        message: timedOut
          ? 'The documentation search took too long to respond. Please try again or submit a support request below.'
          : 'The documentation search is unavailable right now. Please browse the documentation or submit a support request below.',
      },
      { status: 502 }
    )
  }
}
