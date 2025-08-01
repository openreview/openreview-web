import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import LicenseWidget from '../components/EditorComponents/LicenseWidget'

global.$ = jest.fn(() => ({ tooltip: jest.fn() })) // for Tag
jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))

describe('LicenseWidget', () => {
  test('show nothing if there is no note license field', () => {
    const invitation = {
      edit: {
        note: {
          license: undefined,
          content: {},
        },
      },
    }
    const fieldDescription = invitation.edit.note.license
    const { container } = render(<LicenseWidget fieldDescription={fieldDescription} />)

    expect(container).toBeEmptyDOMElement()
  })

  test('show tag when license is a string with tooltip', () => {
    const fullLicenseName = 'Creative Commons Attribution 4.0 International'
    const invitation = {
      edit: {
        note: {
          license: 'CC BY 4.0',
          content: {},
        },
      },
    }
    const fieldDescription = invitation.edit.note.license
    render(<LicenseWidget fieldDescription={fieldDescription} />)

    expect(screen.getByText('CC BY 4.0')).toBeInTheDocument()
    expect(screen.getByText('CC BY 4.0')).toHaveAttribute('title', fullLicenseName)
  })

  test('show dropdown when license is enum', async () => {
    const invitation = {
      edit: {
        note: {
          license: {
            param: {
              enum: [
                {
                  // with description, known license value
                  value: 'CC BY 4.0',
                  description: 'description of CC BY 4.0',
                },
                {
                  // no description, known license value
                  // correct value is Creative Commons Attribution-NonCommercial 4.0 International
                  value: 'CC BY-NC 4.0',
                },
                {
                  // with description, unknown license value
                  value: 'some license',
                  description: 'description of some license',
                },
                {
                  // no description, unknown license value
                  value: 'another license 4.0',
                },
              ],
            },
          },
          content: {},
        },
      },
    }
    const fieldDescription = invitation.edit.note.license
    render(<LicenseWidget fieldDescription={fieldDescription} />)

    expect(screen.getByText('Select License...')).toBeInTheDocument()

    await userEvent.click(screen.getByText('Select License...'))
    expect(screen.getByText('description of CC BY 4.0')).toBeInTheDocument()
    expect(
      screen.getByText('Creative Commons Attribution-NonCommercial 4.0 International')
    ).toBeInTheDocument()
    expect(screen.getByText('description of some license')).toBeInTheDocument()
    expect(screen.getByText('another license 4.0')).toBeInTheDocument()
  })
})
