import { setup, teardown } from './test-utils'

let activeFixturesCount = 0
let initialized = false

export function registerFixture() {
  activeFixturesCount += 1
}

export function before() {
  if (!initialized) {
    initialized = true

    // perform initialization
    return setup()
  }

  return Promise.resolve()
}

export function after() {
  activeFixturesCount -= 1

  if (!activeFixturesCount) {
    // perform teardown
    return teardown()
  }

  return Promise.resolve()
}
