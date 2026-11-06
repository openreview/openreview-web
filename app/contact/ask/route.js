import { unstable_cache } from 'next/cache'

const exampleQuestions = [
  'Why is my profile limited and how do I activate it?',
  'How do I find a venue ID?',
  'How do I withdraw my submission?',
  'How do I recruit reviewers for my venue?',
]

const DOCS_URL = 'https://docs.openreview.net'
const ASK_URL = `${DOCS_URL}/~gitbook/mcp`
const MAX_QUESTION_LENGTH = 500
const MAX_SOURCES = 5
const REQUEST_TIMEOUT_MS = 45000
const RATE_LIMIT_WINDOW_MS = 60000
const RATE_LIMIT_MAX_REQUESTS = 10
const ANSWER_REVALIDATE_SECONDS = 24 * 60 * 60

export const dynamic = 'force-dynamic'

const requestLog = new Map()
let warmupPromise = null
let lastWarmupAt = 0
const WARMUP_COOLDOWN_MS = 60 * 60 * 1000

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

export async function GET() {
  const now = Date.now()
  if (now - lastWarmupAt < WARMUP_COOLDOWN_MS) {
    return Response.json({ warmed: 0 })
  }

  if (!warmupPromise) {
    lastWarmupAt = now
    warmupPromise = Promise.allSettled(
      exampleQuestions.map((question) => askDocumentation(normalizeQuestion(question)))
    ).finally(() => {
      warmupPromise = null
    })
  }

  const results = await warmupPromise
  const warmed = results.reduce(
    (count, result) => count + (result.status === 'fulfilled' ? 1 : 0),
    0
  )

  return Response.json({ warmed })
}

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
