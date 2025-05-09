import { screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { reRenderWithWebFieldContext, renderWithWebFieldContext } from './util'
import SeniorAreaChairConsole from '../components/webfield/SeniorAreaChairConsole'

let useUserReturnValue
let routerParams
let paperStatusProps
let acStatusProps
let sacTasksProps

jest.mock('nanoid', () => ({ nanoid: () => 'some id' }))
jest.mock('next/router', () => ({
  useRouter: () => ({
    replace: jest.fn((params) => {
      routerParams = params
      return {
        catch: jest.fn(),
      }
    }),
  }),
}))
jest.mock('../hooks/useUser', () => () => useUserReturnValue)
jest.mock('../components/webfield/SeniorAreaChairConsole/PaperStatus', () => (props) => {
  paperStatusProps(props)
  return <span>paper status</span>
})
jest.mock('../components/webfield/SeniorAreaChairConsole/AreaChairStatus', () => (props) => {
  acStatusProps(props)
  return <span>AC status</span>
})
jest.mock(
  '../components/webfield/SeniorAreaChairConsole/SeniorAreaChairTasks',
  () => (props) => {
    sacTasksProps(props)
    return <span>sac tasks</span>
  }
)

global.promptError = jest.fn()
global.DOMPurify = {
  sanitize: jest.fn(),
}
global.marked = jest.fn()
global.$ = jest.fn(() => ({ on: jest.fn(), off: jest.fn(), modal: jest.fn() }))

beforeEach(() => {
  useUserReturnValue = { user: { profile: { id: '~Test_User1' } }, accessToken: 'some token' }
  routerParams = null
  paperStatusProps = jest.fn()
  acStatusProps = jest.fn()
  sacTasksProps = jest.fn()
})

describe('SeniorAreaChairConsole', () => {
  test('show error message based on sac name when config is not complete', async () => {
    const providerProps = { value: { seniorAreaChairName: undefined } }
    const { rerender } = renderWithWebFieldContext(
      <SeniorAreaChairConsole
        appContext={{ setBannerContent: jest.fn(), setLayoutOptions: jest.fn() }}
      />,
      providerProps
    )
    expect(
      screen.getByText('Console is missing required properties', { exact: false })
    ).toBeInTheDocument()

    providerProps.value.seniorAreaChairName = 'Area_Chairs'
    reRenderWithWebFieldContext(
      rerender,
      <SeniorAreaChairConsole
        appContext={{ setBannerContent: jest.fn(), setLayoutOptions: jest.fn() }}
      />,
      providerProps
    )
    expect(
      screen.getByText('Area Chairs Console is missing required properties', {
        exact: false,
      })
    ).toBeInTheDocument()
  })

  test('show paper status, ac status and tasks tab', async () => {
    const providerProps = {
      value: {
        headr: { title: 'sac console', instructions: 'some instructions' },
      },
    }
    const { rerender } = renderWithWebFieldContext(
      <SeniorAreaChairConsole
        appContext={{ setBannerContent: jest.fn(), setLayoutOptions: jest.fn() }}
      />,
      providerProps
    )
    expect(
      screen.getByText('Console is missing required properties', { exact: false })
    ).toBeInTheDocument()

    providerProps.value.seniorAreaChairName = 'Area_Chairs'
    reRenderWithWebFieldContext(
      rerender,
      <SeniorAreaChairConsole
        appContext={{ setBannerContent: jest.fn(), setLayoutOptions: jest.fn() }}
      />,
      providerProps
    )
    expect(
      screen.getByText('Area Chairs Console is missing required properties', {
        exact: false,
      })
    ).toBeInTheDocument()
  })
})
