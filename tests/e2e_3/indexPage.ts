import { Selector } from 'testcafe'
import { baseGroupId, conferenceGroupId } from '../utils/api-helper'

const activeVenues = Selector('#active-venues').filterVisible()
const openVenues = Selector('#open-venues').filterVisible()
const allVenues = Selector('#all-venues').filterVisible()

// eslint-disable-next-line no-unused-expressions
fixture`Home page`.page`http://localhost:${process.env.NEXT_PORT}`

test('show active venues', async (t) => {
  const conferenceGroupName = conferenceGroupId.replace(/\//g, ' ')
  await t
    // Active venues
    .expect(activeVenues.find('li').count)
    .eql(5)
    .expect(activeVenues.find('a').withText(conferenceGroupName).exists)
    .ok()
    .expect(activeVenues.find('a').withText(`Another${conferenceGroupName}`).exists)
    .ok()
    .expect(activeVenues.find('a').withText('TestVenue 2023 Conference').exists)
    .ok()
    .expect(activeVenues.find('a').withText('ICLR 2021 Conference').exists)
    .ok()


    // Open for submissions
    .expect(openVenues.find('li').count)
    .eql(0)


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
