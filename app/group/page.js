import { redirect } from 'next/navigation'
import { stringify } from 'query-string'
import { headers } from 'next/headers'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import serverAuth from '../auth'
import CommonLayout from '../CommonLayout'
import styles from './Group.module.scss'
import CustomGroup from './CustomGroup'
import { groupModeToggle } from '../../lib/banner-links'
import EditBanner from '../../components/EditBanner'
import { generateGroupWebfieldCode, parseComponentCode } from '../../lib/webfield-utils'
import ComponentGroup from './ComponentGroup'
import ErrorDisplay from '../../components/ErrorDisplay'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ searchParams }) {
  const { id } = await searchParams
  const groupTitle = prettyId(id)
  if (groupTitle)
    return {
      title: `${groupTitle} | OpenReview`,
      description: `Welcome to the OpenReview homepage for ${groupTitle}`,
      openGraph: {
        title: groupTitle,
        description: `Welcome to the OpenReview homepage for ${groupTitle}`,
      },
    }
  return {
    title: `OpenReview`,
  }
}

export default async function page({ searchParams }) {
  const query = await searchParams
  const { id } = query
  if (!id) return <ErrorDisplay message="Group ID is required" />

  const { token: accessToken, user } = await serverAuth()

  let group

  const headersList = await headers()
  const remoteIpAddress = headersList.get('x-forwarded-for')

  try {
    const { groups } = await api.get('/groups', { id }, { accessToken, remoteIpAddress })
    group = groups?.length > 0 ? groups[0] : null
    if (!group) {
      return <ErrorDisplay message={`The Group ${id} was not found`} />
    }
  } catch (error) {
    console.log('Error in getGroups', {
      page: 'group',
      apiError: error,
      apiRequest: {
        endpoint: '/groups',
        params: { id },
      },
    })
    if (error.name === 'ForbiddenError') {
      if (!accessToken) {
        redirect(`/login?redirect=/group?${encodeURIComponent(stringify(query))}`)
      }
      return <ErrorDisplay message="You don't have permission to read this group" />
    }
    return <ErrorDisplay message={error.message} />
  }

  if (!group.web) {
    group.web = `// Webfield component
return {
  component: 'GroupDirectory',
  properties: {
    title: domain?.content?.title?.value,
    subtitle: domain?.content?.subtitle?.value,
  }
}`
  }

  if (group.web.includes('<script type="text/javascript">')) {
    return <ErrorDisplay message="This group is no longer accessible." />
  }

  const isWebfieldComponent = group.web.startsWith('// Webfield component')
  const isFullWidth = id.endsWith('Editors_In_Chief') || id.endsWith('Action_Editors')
  const editBanner = group.details?.writable ? (
    <EditBanner>{groupModeToggle('view', id)}</EditBanner>
  ) : null

  if (!isWebfieldComponent)
    return (
      <CommonLayout
        banner={null}
        editBanner={editBanner}
        fullWidth={isFullWidth}
        minimalFooter={isFullWidth}
      >
        <div className={styles.group}>
          <CustomGroup webfieldCode={generateGroupWebfieldCode(group, query)} user={user} />
        </div>
      </CommonLayout>
    )

  const componentObjP =
    group.domain !== group.id
      ? api
          .get('/groups', { id: group.domain }, { accessToken, remoteIpAddress })
          .then((apiRes) => {
            const domainGroup = apiRes.groups?.length > 0 ? apiRes.groups[0] : null
            return parseComponentCode(group, domainGroup, user, query, accessToken)
          })
          .catch((error) => parseComponentCode(group, null, user, query, accessToken))
      : parseComponentCode(group, group, user, query, accessToken)

  return <ComponentGroup componentObjP={componentObjP} editBanner={editBanner} />
}
