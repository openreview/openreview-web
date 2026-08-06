import DOMPurify from 'isomorphic-dompurify'
import { allowedHtmlTags } from '../lib/utils'

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

// setup as in appinit
DOMPurify.setConfig({ ALLOWED_TAGS: allowedHtmlTags })
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }

  node.removeAttribute?.('style')
  node.removeAttribute?.('action')
  node.removeAttribute?.('formaction')
})

describe('DOMPurify config', () => {
  test('passes through allowed html tags', () => {
    const clean = DOMPurify.sanitize('<strong>bold</strong> <em>italic</em>')
    expect(clean).toContain('<strong>bold</strong>')
    expect(clean).toContain('<em>italic</em>')
  })

  test('strips inline styles', () => {
    const clean = DOMPurify.sanitize(
      '<div style="position:fixed;inset:0;z-index:9999">x</div>'
    )
    expect(clean).not.toMatch(/style=/i)
    expect(clean).toContain('<div>x</div>')
  })
})
