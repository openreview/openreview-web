import * as packageVersion from '../../package.json'

export const dynamic = 'force-static'

export async function GET() {
  return Response.json({ version: packageVersion.version })
}
