import CheckboxWidget from '../components/EditorComponents/CheckboxWidget'
import { renderWithEditorComponentContext, reRenderWithEditorComponentContext } from './util'
import { screen } from '@testing-library/react'
import { prettyDOM } from '@testing-library/dom'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { render } from '@testing-library/react'
import Signatures from '../components/Signatures'

jest.mock('../hooks/useLoginRedirect', () => {
  return () => ({ user: { profile: { id: '~Test_User1' } }, accessToken: 'some token' })
})

jest.mock('../components/EditorComponents/TagsWidget', () => () => <span>tags</span>)

describe('Signatures', () => {
  test('display constant signatures as tags widget', () => {
    const constSignaturesFieldDescription = ['${3/signatures}']

    render(<Signatures fieldDescription={constSignaturesFieldDescription} />)

    expect(screen.getByText('tags'))
  })

  test('display constant signatures as tags widget', () => {
    const constSignaturesFieldDescription = ['${3/signatures}']

    render(<Signatures fieldDescription={constSignaturesFieldDescription} />)

    expect(screen.getByText('tags'))
  })
})
