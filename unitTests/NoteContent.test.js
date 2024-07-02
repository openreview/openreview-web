import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import { NoteContentV2 } from '../components/NoteContent'

beforeEach(() => {
  global.DOMPurify = {
    sanitize: jest.fn(),
  }
  global.marked = jest.fn()
})

describe('NoteContentV2', () => {
  test('show submission number when there is no content to display', () => {
    const props = {
      id: 'noteId',
      content: {},
      number: 1,
      presentation: [],
    }

    const { container } = render(<NoteContentV2 {...props} />)
    expect(container.querySelector('.note-content').childElementCount).toEqual(1)
    expect(container.querySelector('.note-content').childNodes[0]).toHaveTextContent(
      'Submission Number: 1'
    )
  })

  test('prefer presentation to content', () => {
    const props = {
      id: 'noteId',
      content: {
        code: { value: 'test code' },
        abstract: { value: 'test abstract' },
        keyword: { value: 'test keyword' },
      },
      number: 1,
      presentation: [
        // presentation is in opposite sequence
        { name: 'keyword', order: 1, input: 'text', markdown: false },
        { name: 'abstract', order: 2, input: 'textarea', markdown: true },
        { name: 'code', order: 100, input: 'text', markdown: false },
        { name: 'code', order: 100, input: 'text', markdown: false },
      ],
    }

    const { container } = render(<NoteContentV2 {...props} />)
    expect(container.querySelector('.note-content').childElementCount).toEqual(4)
    expect(container.querySelector('.note-content').childNodes[0]).toHaveTextContent(
      'Keyword: test keyword'
    )
    expect(container.querySelector('.note-content').childNodes[1]).toHaveTextContent(
      'Abstract: test abstract'
    )
    expect(container.querySelector('.note-content').childNodes[2]).toHaveTextContent(
      'Code: test code'
    )
    expect(container.querySelector('.note-content').childNodes[3]).toHaveTextContent(
      'Submission Number: 1'
    )
  })

  test('filter out null description in presentation correctly', () => {
    const props = {
      id: 'noteId',
      content: {
        some_field: { value: ['Value 1', 'Value 2', 'Value 3'] },
      },
      number: 1,
      presentation: [
        {
          name: 'some_field',
          order: 1,
          input: 'select',
          value: ['Value 1', 'Value 2', 'Value 3'],
          description: ['description of value 1', null, 'description of value 3'], // value 2 has no description
        },
      ],
    }

    const { container } = render(<NoteContentV2 {...props} />)
    expect(container.querySelector('.note-content').childNodes[0]).toHaveTextContent(
      'Some Field: description of value 1, description of value 3'
    )
  })

  test('sanitize value no matter if it is markdown field', () => {
    global.marked = jest.fn((_) => 'markdown output')
    const props = {
      id: 'noteId',
      content: {
        keyword: { value: '<image/src/onerror=prompt(document.domain)>' },
        abstract: { value: '<image/src/onerror=prompt(document.domain)>' },
        title: { value: 'test title' }, // omitted field
      },
      number: 1,
      presentation: [
        { name: 'keyword', order: 1, input: 'text', markdown: false },
        { name: 'abstract', order: 2, input: 'textarea', markdown: true },
        { name: 'title', order: 3, input: 'text', markdown: false },
      ],
    }

    render(<NoteContentV2 {...props} />)

    expect(global.marked).toHaveBeenCalledTimes(1)
    expect(global.marked).toHaveBeenCalledWith('<image/src/onerror=prompt(document.domain)>')

    expect(global.DOMPurify.sanitize).toHaveBeenCalledTimes(3) // 2 fields + submission number
    expect(global.DOMPurify.sanitize).toHaveBeenNthCalledWith(
      1,
      '<image/src/onerror=prompt(document.domain)>'
    )
    expect(global.DOMPurify.sanitize).toHaveBeenNthCalledWith(2, 'markdown output')
  })
})
