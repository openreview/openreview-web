import { Selector } from 'testcafe'
import { baseGroupId, conferenceGroupId } from './utils/api-helper'

const activeVenues = Selector('#active-venues')
const openVenues = Selector('#open-venues')
const allVenues = Selector('#all-venues')

fixture`Home Page`
  .page`http://localhost:${process.env.NEXT_PORT}`
  .before(async ctx => (ctx))
  .after(async ctx => (ctx))

test('show active venues', async (t) => {
  await t
    // Active venues
    .expect(activeVenues.child.length).eql(2)
    .expect(activeVenues.find('a').nth(0).textContent).eql(baseGroupId)
    .expect(activeVenues.find('a').nth(1).textContent).eql(`Another${baseGroupId}`)

    // Open for submissions
    .expect(openVenues.child.length).eql(2)
    .expect(openVenues.find('a').nth(0).textContent).eql(conferenceGroupId.replace(/\//g, ' '))
    .expect(openVenues.find('a').nth(1).textContent).eql(`Another${conferenceGroupId}`.replace(/\//g, ' '))
    .expect(openVenues.find('span').withText('Due').count).eql(3)

    // All venues
    .expect(allVenues.child.length).eql(2)
    .expect(allVenues.find('a').nth(0).textContent).eql(baseGroupId)
    .expect(allVenues.find('a').nth(1).textContent).eql(`Another${baseGroupId}`)
})
