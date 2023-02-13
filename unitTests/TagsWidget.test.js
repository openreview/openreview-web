import TagsWidget from '../components/EditorComponents/TagsWidget'
import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { render, waitFor } from '@testing-library/react'
import { prettyDOM } from '@testing-library/dom'

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

  test.only('display text between {} as emphasis', () => {
    const values = [
      '${value1/in/curley/braces}',
      // 'value2/not/in/curley/braces',
      // '{valu3/in/curley/braces}',
    ]

    render(<TagsWidget values={values} />)
    console.log(prettyDOM())
    expect(screen.findByRole('emphasis', { description: 'braces' }))
  })
})
