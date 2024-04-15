import { Selector, Role } from 'testcafe'
import { hasTaskUser, hasNoTaskUser } from './utils/api-helper'

const confirmDeleteModal = Selector('#confirm-delete-modal')
const hasTaskUserRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), 'test@mail.com')
    .typeText(Selector('#password-input'), hasTaskUser.password)
    .click(Selector('button').withText('Login to OpenReview'))
})

// eslint-disable-next-line no-unused-expressions
fixture`Tasks Page`

test('task should change when note is deleted and restored', async (t) => {
  await t
    .useRole(hasTaskUserRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/tasks`)
    .click(Selector('span.task-count-message'))
    .click(Selector('a').withText('Submission1 Official Review')) // go to forum page
    .wait(2000)
    .click(Selector('#forum-replies').find('button').withAttribute('type', 'button').nth(5))
    .expect(confirmDeleteModal.exists)
    .ok()
    .click(confirmDeleteModal.find('.modal-footer > button').withText('Delete'))
    .expect(confirmDeleteModal.exists)
    .notOk()
    .expect(Selector('.note').hasClass('deleted'))
    .ok()
    .click(Selector('a').withText('Tasks'))
    .wait(2000)
    .expect(Selector('span.task-count-message').innerText)
    .eql('Show 1 pending task')
    .click(Selector('span.task-count-message'))
    .click(Selector('a').withText('Submission1 Official Review'))
    .wait(2000)
    .click(Selector('#forum-replies').find('button').withAttribute('type', 'button').nth(4))
    .expect(confirmDeleteModal.exists)
    .ok()
    .click(confirmDeleteModal.find('.modal-footer > button').withText('Restore'))
    .expect(confirmDeleteModal.exists)
    .notOk()
    .expect(Selector('.note').hasClass('deleted'))
    .notOk()
    .click(Selector('a').withText('Tasks'))
    .expect(Selector('span.task-count-message').innerText)
    .eql('Show 0 pending tasks and 1 completed task')
})
