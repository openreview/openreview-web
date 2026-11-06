/**
 * @jest-environment node
 */
import { POST } from '../app/contact/ask/route'

// unstable_cache needs a Next request context; the caching itself is Next's and
// is exercised against a running server, so unwrap it here
jest.mock('next/cache', () => ({ unstable_cache: (fn) => fn }))

const mcpReply = (text) =>
  `event: message\ndata: ${JSON.stringify({
    jsonrpc: '2.0',
    id: 1,
    result: { content: [{ type: 'text', text }] },
  })}\n\n`

const postQuestion = (question, clientIp = '10.0.0.1') =>
  POST(
    new Request('http://localhost/contact/ask', {
      method: 'POST',
      headers: { 'x-forwarded-for': clientIp },
      body: JSON.stringify({ question }),
    })
  )

describe('contact docs ask route', () => {
  test('return the answer with absolute links and its sources', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            mcpReply(
              'See [Navigating your Venue Pages](/getting-started/navigating-your-venue-pages).\n\n# Sources\n\n- [Add a Program Chair](https://docs.openreview.net/faq/add-a-program-chair)\n- [Add a Program Chair](https://docs.openreview.net/faq/add-a-program-chair)\n- [Venue Pages](/getting-started/navigating-your-venue-pages)\n'
            )
          ),
      })
    )

    const data = await (await postQuestion('how do I add a program chair')).json()

    expect(global.fetch).toHaveBeenCalledWith(
      'https://docs.openreview.net/~gitbook/mcp',
      expect.objectContaining({ method: 'POST' })
    )
    expect(JSON.parse(global.fetch.mock.calls[0][1].body)).toMatchObject({
      method: 'tools/call',
      params: { name: 'askQuestion', arguments: { question: 'how do I add a program chair' } },
    })
    expect(data.answer).toBe(
      'See [Navigating your Venue Pages](https://docs.openreview.net/getting-started/navigating-your-venue-pages).'
    )
    expect(data.sources).toEqual([
      {
        title: 'Add a Program Chair',
        url: 'https://docs.openreview.net/faq/add-a-program-chair',
      },
      {
        title: 'Venue Pages',
        url: 'https://docs.openreview.net/getting-started/navigating-your-venue-pages',
      },
    ])
  })

  test('cap the number of sources', async () => {
    const sources = Array.from(
      { length: 9 },
      (_, i) => `- [Page ${i}](https://docs.openreview.net/page-${i})`
    ).join('\n')
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () => Promise.resolve(mcpReply(`Answer.\n\n# Sources\n\n${sources}`)),
      })
    )

    const data = await (await postQuestion('a question with many sources')).json()
    expect(data.sources).toHaveLength(5)
  })

  test('reject an empty or oversized question', async () => {
    expect((await postQuestion('   ')).status).toBe(400)
    expect((await postQuestion('a'.repeat(501))).status).toBe(400)
  })

  test('report an error returned by the documentation search', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        text: () =>
          Promise.resolve(
            `data: ${JSON.stringify({ jsonrpc: '2.0', id: 1, error: { code: -32000, message: 'nope' } })}\n`
          ),
      })
    )

    const response = await postQuestion('a question the docs search rejects')
    expect(response.status).toBe(502)
    expect((await response.json()).message).toMatch('unavailable right now')
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
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, text: () => Promise.resolve(mcpReply('Answer.')) })
    )

    const statuses = []
    for (let i = 0; i < 11; i += 1) {
      // oxlint-disable-next-line no-await-in-loop
      statuses.push((await postQuestion(`question ${i}`, '10.0.0.50')).status)
    }
    expect(statuses.filter((status) => status === 200)).toHaveLength(10)
    expect(statuses.at(-1)).toBe(429)

    // the limit is per client
    expect((await postQuestion('another client question', '10.0.0.51')).status).toBe(200)
  })
})
