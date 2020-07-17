/* global fixture */
/* global test */

import { Selector } from 'testcafe'
import { baseGroupId, conferenceGroupId } from './test-utils'
import { registerFixture, before, after } from './hooks'

require('dotenv').config()

registerFixture()

fixture`home page`
  .before(async ctx => before())
  .after(async ctx => after())

test('show active venues', async (t) => {
  await t.navigateTo(`http://localhost:${process.env.NEXT_PORT}`)
    // active venue has 2 items
    .expect(Selector('#active-venues').child.length).eql(2)
    .expect(Selector('#active-venues').find('a').nth(0).textContent)
    .eql(baseGroupId)
    .expect(Selector('#active-venues').find('a').nth(1).textContent)
    .eql(`Another${baseGroupId}`)
    // open for submission has 2 items
    .expect(Selector('#open-venues').child.length)
    .eql(2)
    .expect(Selector('#open-venues').find('a').nth(0).textContent)
    .eql(conferenceGroupId.replace(/\//g, ' '))
    .expect(Selector('#open-venues').find('a').nth(1).textContent)
    .eql(`Another${conferenceGroupId}`.replace(/\//g, ' '))
    .expect(Selector('span').withText('Due').count)
    .eql(2)
    // all venues has 2 items
    .expect(Selector('#all-venues').child.length)
    .eql(2)
    .expect(Selector('#all-venues').find('a').nth(0).textContent)
    .eql(baseGroupId)
    .expect(Selector('#all-venues').find('a').nth(1).textContent)
    .eql(`Another${baseGroupId}`)
})
