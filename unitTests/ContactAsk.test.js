/**
 * @jest-environment node
 */
import { GET, POST } from '../app/contact/ask/route'

jest.mock('next/cache', () => ({ unstable_cache: (fn) => fn }))

const toolResult = (text, extra = {}) => ({
  jsonrpc: '2.0',
  id: 1,
  result: { content: [{ type: 'text', text }], ...extra },
})

const askReply = (text, extra) =>
  `event: message\ndata: ${JSON.stringify(toolResult(text, extra))}\n\n`

const mockAsk = (body, ok = true) => {
  global.fetch = jest.fn(() => Promise.resolve({ ok, text: () => Promise.resolve(body) }))
}

const postQuestion = (question, clientIp = '10.0.0.1') =>
  POST(
    new Request('http://localhost/contact/ask', {
      method: 'POST',
      headers: { 'x-forwarded-for': clientIp },
      body: JSON.stringify({ question }),
    })
  )

describe('contact docs ask route', () => {
  test('ask the published documentation without any credentials', async () => {
    mockAsk(
      askReply(
        'See [Venue Pages](/getting-started/navigating-your-venue-pages).\n\n# Sources\n\n- [Venue Pages](/getting-started/navigating-your-venue-pages)\n'
      )
    )

    const data = await (await postQuestion('how   do I add a program chair')).json()

    expect(global.fetch).toHaveBeenCalledWith(
      'https://docs.openreview.net/~gitbook/mcp',
      expect.objectContaining({ method: 'POST' })
    )
    const [, options] = global.fetch.mock.calls[0]
    expect(options.headers.Authorization).toBeUndefined()
    expect(JSON.parse(options.body)).toMatchObject({
      method: 'tools/call',
      params: { name: 'askQuestion', arguments: { question: 'how do I add a program chair' } },
    })

    expect(data.answer).toBe(
      'See [Venue Pages](https://docs.openreview.net/getting-started/navigating-your-venue-pages).'
    )
    expect(data.sources).toEqual([
      {
        title: 'Venue Pages',
        url: 'https://docs.openreview.net/getting-started/navigating-your-venue-pages',
      },
    ])
  })

  test('parse a plain JSON response as well as an event stream', async () => {
    mockAsk(JSON.stringify(toolResult('Plain JSON answer.')))

    const data = await (await postQuestion('a plain json question')).json()
    expect(data.answer).toBe('Plain JSON answer.')
  })

  test('drop duplicate sources and cap the rest', async () => {
    const sources = [
      ...Array.from({ length: 9 }, (_, i) => `- [Page ${i}](/page-${i})`),
      '- [Page 0 again](/page-0)',
    ].join('\n')
    mockAsk(askReply(`Answer.\n\n# Sources\n\n${sources}`))

    const data = await (await postQuestion('a question with many sources')).json()
    expect(data.sources).toHaveLength(5)
    expect(data.sources.map((source) => source.url)).toEqual([
      'https://docs.openreview.net/page-0',
      'https://docs.openreview.net/page-1',
      'https://docs.openreview.net/page-2',
      'https://docs.openreview.net/page-3',
      'https://docs.openreview.net/page-4',
    ])
  })

  test('reject an empty or oversized question', async () => {
    expect((await postQuestion('   ')).status).toBe(400)
    expect((await postQuestion('a'.repeat(501))).status).toBe(400)
  })

  test('report a failing documentation search', async () => {
    mockAsk('', false)

    const response = await postQuestion('a question the docs search rejects')
    expect(response.status).toBe(502)
    expect((await response.json()).message).toMatch('unavailable right now')
  })

  test('report an error returned in place of a result', async () => {
    mockAsk(
      `data: ${JSON.stringify({ jsonrpc: '2.0', id: 1, error: { code: -32000, message: 'nope' } })}\n`
    )

    expect((await postQuestion('a question the tool rejects')).status).toBe(502)
  })

  test('reject a tool error instead of caching its text as an answer', async () => {
    mockAsk(askReply('tool blew up', { isError: true }))

    const response = await postQuestion('a question whose tool errors')
    expect(response.status).toBe(502)
    expect((await response.json()).message).toMatch('unavailable right now')
  })

  test('reject an unrecognized response body', async () => {
    mockAsk('<html>nope</html>')

    expect((await postQuestion('a question with a junk response')).status).toBe(502)
  })

  test('reject a response with no text content', async () => {
    mockAsk(askReply('   '))

    expect((await postQuestion('a question with empty content')).status).toBe(502)
  })

  test('report a timeout separately', async () => {
    global.fetch = jest.fn(() =>
      Promise.reject(Object.assign(new Error('timeout'), { name: 'TimeoutError' }))
    )

    const response = await postQuestion('a question that times out')
    expect(response.status).toBe(502)
    expect((await response.json()).message).toMatch('took too long')
  })

  test('rate limit a client asking too many questions', async () => {
    mockAsk(askReply('Answer.'))

    const statuses = []
    for (let i = 0; i < 11; i += 1) {
      statuses.push((await postQuestion(`question ${i}`, '10.0.0.50')).status)
    }
    expect(statuses.filter((status) => status === 200)).toHaveLength(10)
    expect(statuses.at(-1)).toBe(429)

    expect((await postQuestion('another client question', '10.0.0.51')).status).toBe(200)
  })

  test('warm the example questions on GET', async () => {
    mockAsk(askReply('Answer.'))

    const response = await GET()
    const data = await response.json()

    expect(data.warmed).toBe(4)
    expect(global.fetch).toHaveBeenCalledTimes(4)
  })
})
