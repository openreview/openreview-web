import { setup, teardown } from './test-utils'

let activeFixturesCount = 0
let context = null

export function registerFixture() {
  activeFixturesCount += 1
}

export async function before(ctx) {
  if (!context) {
    context = await setup()
  }
  ctx.superUserToken = context.superUserToken
  ctx.api = context.api
  return ctx
}

export function after(ctx) {
  activeFixturesCount -= 1

  if (!activeFixturesCount) {
    return teardown(ctx)
  }

  return Promise.resolve()
}
