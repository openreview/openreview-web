import { Selector } from 'testcafe'
import { hasTaskUser, hasNoTaskUser } from './test-utils'
require('dotenv').config()

fixture`tasks page`
test('hastask user', async t => {
  await t.navigateTo(`http://localhost:${process.env.NEXT_PORT}`)
    //has task user login
    .click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), hasTaskUser.email)
    .typeText(Selector('#password-input'), hasTaskUser.password)
    .click(Selector('button').withText('Login to OpenReview'))
    .click(Selector('a').withText('Tasks'))
    //should see 1 task in testvenue 2020 conference
    .expect(Selector('div.tasks-container').find('ul.list-unstyled').nth(0).childElementCount).eql(1) //has 1 task
    //perform the task
    .click(Selector('a.show-tasks'))
    .click(Selector('a').withText('Comment'))
    .typeText(Selector('input').withAttribute('name','title'),'test title') //fill in comment title
    .typeText(Selector('input').withAttribute('name','comment'),'test comment') //fill in comment content
    .click(Selector('input').withAttribute('placeholder','signatures'))
    .click(Selector('div.dropdown_content').child().nth(0)) //select signature
    .click(Selector('button').withText('Submit')) //submit
    // should see 0 pending task and 1 completed
    .click(Selector('a').withText('Tasks')) //go tasks page
    .expect(Selector('a.show-tasks').innerText).eql('Show 0 pending tasks and 1 completed task')
})
test('no task user', async t => {
  await t.navigateTo(`http://localhost:${process.env.NEXT_PORT}`)
    //no task user login
    .click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), hasNoTaskUser.email)
    .typeText(Selector('#password-input'), hasNoTaskUser.password)
    .click(Selector('button').withText('Login to OpenReview'))
    .click(Selector('a').withText('Tasks'))
    //should see no task message
    .expect(Selector('p.empty-message').exists).ok()
    .expect(Selector('p.empty-message').textContent).eql('No current pending or completed tasks')
})
