export async function GET() {
  try {
    const apiHealthyResult = await fetch(`${process.env.API_V2_URL}/profiles`)
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
