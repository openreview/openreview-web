import { redirect } from 'next/navigation'
import { stringify } from 'query-string'
import { uniq } from 'lodash'
import { Suspense } from 'react'
import serverAuth from '../../auth'
import styles from './Browse.module.scss'
import CommonLayout from '../../CommonLayout'
import { referrerLink } from '../../../lib/banner-links'
import {
  buildInvitationReplyArr,
  parseEdgeList,
  translateFieldSpec,
  translateSignatures,
} from '../../../lib/edge-utils'
import api from '../../../lib/api-client'
import EdgeBrowserHeader from '../../../components/browser/EdgeBrowserHeader'
import LoadingSpinner from '../../../components/LoadingSpinner'
import Browse from './Browse'
import Banner from '../../../components/Banner'

export const metadata = {
  title: 'Edge Browser | OpenReview',
}

export const dynamic = 'force-dynamic'

export default async function page({ searchParams }) {
  const query = await searchParams
  const { user, token: accessToken } = await serverAuth()
  if (!accessToken) redirect(`/login?redirect=/edge/browse?${stringify(query)}`)

  const banner = query.referrer ? referrerLink(query.referrer) : null

  const startInvitations = parseEdgeList(query.start, 'start')
  const traverseInvitations = parseEdgeList(query.traverse, 'traverse')
  const editInvitations = parseEdgeList(query.edit, 'edit')
  const browseInvitations = parseEdgeList(query.browse, 'browse')
  const hideInvitations = parseEdgeList(query.hide, 'hide')
  const allInvitations = traverseInvitations.concat(
    startInvitations,
    editInvitations,
    browseInvitations,
    hideInvitations
  )
  if (allInvitations.length === 0) {
    throw new Error('Could not load edge explorer. Invalid edge invitation.')
  }
  const apiVersion = Number.parseInt(query.version, 10)
  const idsToLoad = uniq(allInvitations.map((i) => i.id)).filter((id) => id !== 'staticList')

  const loadAllInvitationsP = api
    .get(
      '/invitations',
      {
        ids: idsToLoad.join(','),
        expired: true,
        type: apiVersion === 2 ? 'edge' : 'edges',
      },
      { accessToken, version: apiVersion }
    )
    .then((apiRes) => {
      if (!apiRes.invitations?.length) {
        throw new Error('Could not load edge explorer. Invalid edge invitation.')
      }
      allInvitations.forEach((invObj) => {
        const fullInvitation = apiRes.invitations.find((inv) => {
          // For static lists, use the properties of the first traverse invitation
          const invId = invObj.id === 'staticList' ? allInvitations[0].id : invObj.id
          return inv.id === invId
        })
        if (!fullInvitation) {
          // Filter out invalid edit or browse invitations, but don't fail completely
          if (invObj.category === 'edit' || invObj.category === 'browse') {
            // eslint-disable-next-line no-console
            console.error(
              `${invObj.category} invitation ${invObj.id} does not exist or is expired`
            )
            // eslint-disable-next-line no-param-reassign
            invObj.invalid = true
          } else {
            throw new Error(`Could not load edge explorer. Invitation not found: ${invObj.id}`)
          }
          return
        }

        const readers = buildInvitationReplyArr(fullInvitation, 'readers', user.profile.id)
        const writers =
          buildInvitationReplyArr(fullInvitation, 'writers', user.profile.id) || readers
        const signatures = translateSignatures(fullInvitation, apiVersion)
        const nonreaders = buildInvitationReplyArr(
          fullInvitation,
          'nonreaders',
          user.profile.id
        )
        Object.assign(invObj, {
          head: translateFieldSpec(fullInvitation, 'head', apiVersion),
          tail: translateFieldSpec(fullInvitation, 'tail', apiVersion),
          weight: translateFieldSpec(fullInvitation, 'weight', apiVersion),
          defaultWeight: translateFieldSpec(fullInvitation, 'weight', apiVersion)?.default,
          label: translateFieldSpec(fullInvitation, 'label', apiVersion),
          defaultLabel: translateFieldSpec(fullInvitation, 'label', apiVersion)?.default,
          readers,
          writers,
          signatures,
          nonreaders,
          domain: fullInvitation?.domain,
        })
      })

      const domainGroupId = apiRes.invitations.find(
        (p) => p.id === traverseInvitations[0].id
      )?.domain
      if (!domainGroupId) {
        return {
          startInvitation: startInvitations[0],
          traverseInvitations,
          editInvitations: editInvitations
            .filter((inv) => !inv.invalid)
            .map((p) => ({ ...p })),
          browseInvitations: browseInvitations.filter((inv) => !inv.invalid),
          hideInvitations,
          allInvitations: allInvitations.filter((inv) => !inv.invalid),
        }
      }
      return api
        .get('/groups', { id: domainGroupId, select: 'content' }, { accessToken })
        .then((response) => {
          const domainContent = response?.groups?.[0]?.content
          return {
            startInvitation: startInvitations[0],
            traverseInvitations,
            editInvitations: editInvitations
              .filter((inv) => !inv.invalid)
              .map((p) => ({ ...p, submissionName: domainContent?.submission_name?.value })),
            browseInvitations: browseInvitations.filter((inv) => !inv.invalid),
            hideInvitations,
            allInvitations: allInvitations.filter((inv) => !inv.invalid),
          }
        })
    })
    .catch((error) => {
      if (typeof error === 'object' && error.name) {
        if (error.name === 'NotFoundError') {
          throw new Error('Could not load edge explorer. Invitation not found.')
        } else if (error.name === 'ForbiddenError') {
          throw new Error('You do not have permission to view this invitation.')
        }
      } else if (typeof error === 'string' && error.startsWith('Invitation Not Found')) {
        throw new Error('Could not load edge explorer. Invitation not found.')
      }
      throw error
    })
  return (
    <CommonLayout banner={<Banner>{banner}</Banner>} fullWidth minimalFooter>
      <div className={styles.browse}>
        <EdgeBrowserHeader invitation={traverseInvitations[0]} />
        <Suspense fallback={<LoadingSpinner />}>
          <Browse
            loadAllInvitationsP={loadAllInvitationsP}
            version={apiVersion}
            maxColumns={Math.max(Number.parseInt(query.maxColumns, 10), -1) || -1}
            showCounter={query.showCounter ? query.showCounter === 'true' : true}
            user={user}
            accessToken={accessToken}
          />
        </Suspense>
      </div>
    </CommonLayout>
  )
}
