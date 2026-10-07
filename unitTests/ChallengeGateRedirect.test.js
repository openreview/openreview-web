import getChallengeRedirect from '../client/getChallengeRedirect'

// Legacy webfield/view code makes requests via jQuery $.ajax, which bypasses the
// api-client checkStatus handler. client/globals.js installs a global ajaxError
// handler that uses getChallengeRedirect to send guests blocked by the scraping
// challenge gate to the Turnstile page. These tests cover that decision logic:
// which XHR errors trigger a redirect and how the return URL is built.

const currentPath = '/group?id=ICLR.cc/2021/Conference'
const expectedRedirect = `/challenge?redirect=${encodeURIComponent(currentPath)}`

describe('getChallengeRedirect', () => {
  it('returns the challenge URL for a 403 ChallengeRequiredError (responseJSON)', () => {
    const jqXhr = { status: 403, responseJSON: { name: 'ChallengeRequiredError' } }
    expect(getChallengeRedirect(jqXhr, currentPath)).toBe(expectedRedirect)
  })

  it('falls back to responseText when responseJSON is not populated', () => {
    const jqXhr = { status: 403, responseText: JSON.stringify({ name: 'ChallengeRequiredError' }) }
    expect(getChallengeRedirect(jqXhr, currentPath)).toBe(expectedRedirect)
  })

  it('returns null for a 403 ForbiddenError (handled elsewhere as login)', () => {
    const jqXhr = { status: 403, responseJSON: { name: 'ForbiddenError' } }
    expect(getChallengeRedirect(jqXhr, currentPath)).toBeNull()
  })

  it('returns null for a non-403 error even if the name matches', () => {
    const jqXhr = { status: 500, responseJSON: { name: 'ChallengeRequiredError' } }
    expect(getChallengeRedirect(jqXhr, currentPath)).toBeNull()
  })

  it('returns null when responseText is not valid JSON', () => {
    const jqXhr = { status: 403, responseText: 'gateway timeout' }
    expect(getChallengeRedirect(jqXhr, currentPath)).toBeNull()
  })

  it('returns null when the XHR is missing', () => {
    expect(getChallengeRedirect(undefined, currentPath)).toBeNull()
  })
})
