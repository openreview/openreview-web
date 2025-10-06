import * as packageVersion from '../../package.json'

export const dynamic = 'force-static'

// eslint-disable-next-line import/prefer-default-export
export async function GET() {
  return Response.json({ version: packageVersion.version })
}
