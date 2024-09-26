import { screen, render } from '@testing-library/react'
import TagsWidget from '../components/EditorComponents/TagsWidget'
import '@testing-library/jest-dom'

global.$ = jest.fn(() => ({
  tooltip: jest.fn(),
}))

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('TagsWidget', () => {
  test('display nothing when empty value is passed', () => {
    const { container, rerender } = render(<TagsWidget />)
    expect(container).toBeEmptyDOMElement()

    rerender(<TagsWidget values={null} />)
    expect(container).toBeEmptyDOMElement()

    rerender(<TagsWidget values={{ key: 'value' }} />)
    expect(container).toBeEmptyDOMElement()
  })

  test('display values passed', () => {
    const values = ['value 1', 'value 2', 'value 3']

    render(<TagsWidget values={values} />)

    expect(screen.getByText('value 1')).toBeInTheDocument()
    expect(screen.getByText('value 2')).toBeInTheDocument()
    expect(screen.getByText('value 3')).toBeInTheDocument()
  })

  test('display text between {} as emphasis', () => {
    const values = [
      'ICML.cc/2023/Conference',
      '${2/note/content/authorids/value}',
      '${3/signatures}',
      'ICML.cc/2023/Conference/Submission${2/note/number}/Authors',
      '${2/content/venue_id/value}',
    ]

    render(<TagsWidget values={values} />)
    expect(screen.getByText('ICML 2023 Conference')).toBeInTheDocument()
    expect(screen.getByText('authorids')).toHaveClass('emphasis')
    expect(screen.getByText('signatures')).toHaveClass('emphasis')
    expect(screen.getByText('number')).toHaveClass('emphasis')
    expect(screen.getByText('venue id')).toHaveClass('emphasis')
  })

  test('display tooltip based on id', () => {
    const values = [
      'ICML.cc/2023/Conference',
      '${2/note/content/authorids/value}',
      '${3/signatures}',
      'ICML.cc/2023/Conference/Submission${2/note/number}/Authors',
    ]

    render(<TagsWidget values={values} />)
    const textTag = screen.getByText('ICML 2023 Conference')
    const valueTag = screen.getByText('authorids').closest('div')
    const signaturesTag = screen.getByText('signatures').closest('div')
    const numberTag = screen.getByText('number').closest('div')
    expect(textTag).toHaveAttribute('title', 'ICML.cc/2023/Conference')
    expect(valueTag).toHaveAttribute(
      'title',
      `"authorids" will be replaced with the value of the field authorids`
    )
    expect(signaturesTag).toHaveAttribute(
      'title',
      `"signatures" will be replaced with the edit signature shown below.`
    )
    expect(numberTag).toHaveAttribute(
      'title',
      `"number" will be replaced with the paper number after the submission has been completed.`
    )
  })

  test('perform type conversion when non array values is passed', () => {
    render(<TagsWidget values="value 1,value 2,value 3" />)
    expect(screen.getByText('value 1')).toBeInTheDocument()
    expect(screen.getByText('value 2')).toBeInTheDocument()
    expect(screen.getByText('value 3')).toBeInTheDocument()
  })
})
