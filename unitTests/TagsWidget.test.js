import TagsWidget from '../components/EditorComponents/TagsWidget'
import { screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'

global.$ = jest.fn(() => ({
  tooltip: jest.fn(),
}))

describe('TagsWidget', () => {
  test('display nothing when non array values is passed', () => {
    const { container, rerender } = render(<TagsWidget />)
    expect(container).toBeEmptyDOMElement()

    rerender(<TagsWidget values={null} />)
    expect(container).toBeEmptyDOMElement()

    rerender(<TagsWidget values={{ key: 'value' }} />)
    expect(container).toBeEmptyDOMElement()

    rerender(<TagsWidget values="some string value" />)
    expect(container).toBeEmptyDOMElement()
  })

  test('display values passed', () => {
    const values = ['value 1', 'value 2', 'value 3']

    render(<TagsWidget values={values} />)

    expect(screen.getByText('value 1'))
    expect(screen.getByText('value 2'))
    expect(screen.getByText('value 3'))
  })

  test('display text between {} as emphasis', () => {
    const values = [
      'ICML.cc/2023/Conference',
      '${2/note/content/authorids/value}',
      '${3/signatures}',
      'ICML.cc/2023/Conference/Submission${2/note/number}/Authors',
    ]

    render(<TagsWidget values={values} />)
    expect(screen.getByText('ICML 2023 Conference'))
    expect(screen.getByText('authorids')).toHaveClass('emphasis')
    expect(screen.getByText('signatures')).toHaveClass('emphasis')
    expect(screen.getByText('number')).toHaveClass('emphasis')
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
    const valueTag = screen.getByText('authorids').closest('span')
    const signaturesTag = screen.getByText('signatures').closest('span')
    const numberTag = screen.getByText('number').closest('span')
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
})
