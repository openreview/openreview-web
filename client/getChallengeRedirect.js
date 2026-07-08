// Given a failed jQuery ajax XHR and the current page path, returns the URL of
// the Turnstile challenge page a guest should be sent to when blocked by the
// scraping challenge gate, or null when the error is not a challenge requirement.
// Legacy $.ajax requests bypass the api-client checkStatus handler, so
// client/globals.js uses this to redirect blocked guests.
module.exports = function getChallengeRedirect(jqXhr, currentPath) {
  if (jqXhr?.status !== 403) return null

  let errorName = jqXhr.responseJSON?.name
  if (!errorName && jqXhr.responseText) {
    try {
      errorName = JSON.parse(jqXhr.responseText)?.name
    } catch {
      errorName = null
    }
  }

  if (errorName !== 'ChallengeRequiredError') return null
  return '/challenge?redirect=' + encodeURIComponent(currentPath)
}
