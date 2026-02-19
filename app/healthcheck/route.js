// eslint-disable-next-line import/prefer-default-export
export async function GET() {
  try {
    const apiHealthyResult = await fetch(`${process.env.GUEST_API_URL}/healthcheck/api`)
    if (apiHealthyResult.ok) {
      return Response.json({ healthy: true })
    }
    console.log('Error in page', {
      page: 'Web Instance Healthcheck',
      response: apiHealthyResult,
    })
  } catch (error) {
    console.log('Error in page', {
      page: 'Web Instance Healthcheck',
      error,
    })
  }
  return Response.json({ healthy: false }, { status: 503 })
}
