import { Selector } from 'testcafe'
import { baseGroupId, conferenceGroupId } from './utils/api-helper'

const activeVenues = Selector('#active-venues')
const openVenues = Selector('#open-venues')
const allVenues = Selector('#all-venues')

// eslint-disable-next-line no-unused-expressions
fixture`Home page`
  .page`http://localhost:${process.env.NEXT_PORT}`

test('show active venues', async (t) => {
  const conferenceGroupName = conferenceGroupId.replace(/\//g, ' ')
  await t
    // Active venues
    .expect(activeVenues.child.length).eql(2)
    .expect(activeVenues.find('a').nth(0).textContent).eql(conferenceGroupName)
    .expect(activeVenues.find('a').nth(1).textContent).eql(`Another${conferenceGroupName}`)
    .expect(activeVenues.find('a').nth(2).textContent).eql('ICLR 2021 Conference')

    // Open for submissions
    .expect(openVenues.child.length).eql(2)
    .expect(openVenues.find('a').nth(0).textContent).eql(conferenceGroupName)
    .expect(openVenues.find('a').nth(1).textContent).eql(`Another${conferenceGroupName}`)
    .expect(openVenues.find('a').nth(2).textContent).eql('ICLR 2021 Conference')
    .expect(openVenues.find('span').withText('Due').count).eql(3)

    // All venues
    .expect(allVenues.child.length).eql(2)
    .expect(allVenues.find('a').nth(0).textContent).eql(baseGroupId)
    .expect(allVenues.find('a').nth(1).textContent).eql(`Another${baseGroupId}`)
    .expect(allVenues.find('a').nth(2).textContent).eql('ICLR')
})
