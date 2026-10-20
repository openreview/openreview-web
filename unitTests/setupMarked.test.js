import $ from 'jquery'
import { marked } from 'marked'

let view

beforeAll(() => {
  global.$ = $
  global.marked = marked

  view = require('../client/view')
  view.setupMarked()
})

describe('marked custom renderer setup', () => {
  test('render valid html tag as text', () => {
    const generatedHtml = global.marked('<div>some test text</div>')

    expect(generatedHtml).toEqual('&lt;div&gt;some test text&lt;/div&gt;')
  })

  test('render invalid html tag as text', () => {
    const generatedHtml = global.marked(
      '# Itemized list\n1. <blah blah blah>\n2. <well well well>\n3. <yada yada yada>\n4. <etc etc etc>'
    )

    expect(generatedHtml).toEqual(
      '<h1>Itemized list</h1>\n<ol>\n<li>&lt;blah blah blah&gt;</li>\n<li>&lt;well well well&gt;</li>\n<li>&lt;yada yada yada&gt;</li>\n<li>&lt;etc etc etc&gt;</li>\n</ol>\n'
    )
  })

  test('renders checkbox as square bracket', () => {
    const generatedHtml = global.marked('- [x] checked\n- [ ] unchecked')

    expect(generatedHtml).toContain('[x]')
    expect(generatedHtml).toContain('[ ]')
  })
})
