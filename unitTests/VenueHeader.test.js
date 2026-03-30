import VenueHeader from '../components/webfield/VenueHeader'
import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import dayjs from 'dayjs'

describe('VenueHeader', () => {
  test('not to show start date when there is no date', () => {
    const headerInfoProp = { noIcons: false, date: undefined }

    const { container } = render(<VenueHeader headerInfo={headerInfoProp} />)

    expect(container.querySelector('.glyphicon-calendar')).not.toBeInTheDocument()
  })

  test('show start date when start date is a string', () => {
    const headerInfoProp = { noIcons: false, date: 'some date anywhere on earth' }

    render(<VenueHeader headerInfo={headerInfoProp} />)

    expect(screen.getByText('some date anywhere on earth')).toBeInTheDocument()
  })

  test('show start date when start date is a unix timestamp', () => {
    const now = dayjs()
    const expectedDateStr = now.format('MMM DD YYYY')

    const headerInfoProp = { noIcons: false, date: now.valueOf() }

    render(<VenueHeader headerInfo={headerInfoProp} />)

    expect(screen.getByText(expectedDateStr)).toBeInTheDocument()
  })
})
