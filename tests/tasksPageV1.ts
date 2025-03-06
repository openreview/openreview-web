import { Selector, Role } from 'testcafe'
import { hasTaskUser, hasNoTaskUser } from './utils/api-helper'

const hasTaskUserRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), hasTaskUser.email)
    .typeText(Selector('#password-input'), hasTaskUser.password)
    .click(Selector('button').withText('Login to OpenReview'))
})

// eslint-disable-next-line no-unused-expressions
fixture`Tasks PageV1`

test('should open tasks page and complete pending task', async (t) => {
  await t
    .useRole(hasTaskUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}`)
    .click(Selector('a').withText('Tasks'))
    // should see 1 task in testvenue 2020 conference
    .expect(Selector('div.tasks-container').find('ul.list-unstyled').nth(0).childElementCount)
    .eql(1)
    .click(Selector('span.task-count-message')) // perform the task
    .click(Selector('a').withText('Paper1 Official Review'))
    .typeText(Selector('input').withAttribute('name', 'title'), 'test title') // fill in comment title
    .typeText(Selector('textarea').withAttribute('name', 'review'), 'test comment') // fill in comment content
    .click(Selector('input').withAttribute('name', 'rating')) // fill in comment content
    .click(
      Selector('div.dropdown_content div').withText(
        '9: Top 15% of accepted papers, strong accept'
      )
    ) // fill in comment content
    .click(
      Selector('input')
        .withAttribute('name', 'confidence')
        .withAttribute(
          'value',
          '4: The reviewer is confident but not absolutely certain that the evaluation is correct'
        )
    ) // fill in comment content
    .click(Selector('button').withText('Submit')) // submit

    // should see 0 pending task and 1 completed
    .click(Selector('a').withText('Tasks')) // go tasks page
    .expect(Selector('span.task-count-message').innerText)
    .eql('Show 0 pending tasks and 1 completed task')
})

test('task should change when note is deleted and restored', async (t) => {
  await t
    .useRole(hasTaskUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/tasks`)
    .click(Selector('span.task-count-message'))
    .click(Selector('a').withText('Paper1 Official Review')) // go to forum page
    .wait(2000)
    .click(Selector('#note_children').find('button.trash_button'))
    .click(Selector('a').withText('Tasks'))
    .wait(2000)
    .expect(Selector('span.task-count-message').innerText)
    .eql('Show 1 pending task')
    .click(Selector('span.task-count-message'))
    .click(Selector('a').withText('Paper1 Official Review'))
    .click(Selector('.note_editor').find('button').withText('Cancel')) // don't add new comment
    .click(Selector('button').withText('Restore'))
    .click(Selector('a').withText('Tasks'))
    .expect(Selector('span.task-count-message').innerText)
    .eql('Show 0 pending tasks and 1 completed task')
})

test('user with no tasks should see an empty tasks page', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}`)
    // no task user login
    .click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), hasNoTaskUser.email)
    .typeText(Selector('#password-input'), hasNoTaskUser.password)
    .click(Selector('button').withText('Login to OpenReview'))
    .click(Selector('a').withText('Tasks'))
    // should see no task message
    .expect(Selector('p.empty-message').exists)
    .ok()
    .expect(Selector('p.empty-message').textContent)
    .eql('No current pending or completed tasks')
})

test('should not show referrer banner after navigation', async (t) => {
  await t
    .useRole(hasTaskUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/tasks`)
    .click(Selector('span.task-count-message'))
    .click(Selector('a').withText('Paper1 Official Review')) // go to the actual forum page
    .expect(Selector('.banner').find('a').withText('Back to Tasks').exists)
    .ok() // banner shows back to tasks
    .click(Selector('a.home.push-link')) // go to index page
    .expect(Selector('.banner').find('a').withText('Back to Tasks').exists)
    .notOk() // banner should not show back to tasks anymore
    .expect(
      Selector('.banner')
        .find('span.tagline')
        .withText('Open Peer Review. Open Publishing. Open Access.').exists
    )
    .ok()
})
