import { Selector } from 'testcafe'
import { baseGroupId, conferenceGroupId } from './utils/api-helper'

const activeVenues = Selector('#active-venues')
const openVenues = Selector('#open-venues')
const allVenues = Selector('#all-venues')

// eslint-disable-next-line no-unused-expressions
fixture`Home page`.page`http://localhost:${process.env.NEXT_PORT}`

test('show active venues', async (t) => {
  const conferenceGroupName = conferenceGroupId.replace(/\//g, ' ')
  await t
    // Active venues
    .expect(activeVenues.find('li').count)
    .eql(4)
    .expect(activeVenues.find('a').nth(0).textContent)
    .eql(conferenceGroupName)
    .expect(activeVenues.find('a').nth(1).textContent)
    .eql(`Another${conferenceGroupName}`)
    .expect(activeVenues.find('a').nth(2).textContent)
    .eql('ICLR 2021 Conference')
    .expect(activeVenues.find('a').nth(3).textContent)
    .eql('TestVenue 2023 Conference')

    // Open for submissions
    .expect(openVenues.find('li').count)
    .eql(3)
    .expect(openVenues.find('a').nth(0).textContent)
    .eql(conferenceGroupName)
    .expect(openVenues.find('a').nth(1).textContent)
    .eql(`Another${conferenceGroupName}`)
    .expect(openVenues.find('a').nth(2).textContent)
    .eql('ICLR 2021 Conference')
    .expect(openVenues.find('p').withText('Due').count)
    .eql(3)

    // All venues
    .expect(allVenues.find('li').count)
    .eql(3)
    .expect(allVenues.find('a').nth(0).textContent)
    .eql(`Another${baseGroupId}`)
    .expect(allVenues.find('a').nth(1).textContent)
    .eql('ICLR')
    .expect(allVenues.find('a').nth(2).textContent)
    .eql(baseGroupId)
})
