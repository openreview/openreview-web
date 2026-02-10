'use client'

import { useEffect, useState } from 'react'
import EdgeBrowser from '../../../components/browser/EdgeBrowser'
import ErrorDisplay from '../../../components/ErrorDisplay'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'
import {
  buildInvitationReplyArr,
  translateFieldSpec,
  translateSignatures,
} from '../../../lib/edge-utils'
import CommonLayout from '../../CommonLayout'
import Banner from '../../../components/Banner'
import EdgeBrowserHeader from '../../../components/browser/EdgeBrowserHeader'
import styles from './Browse.module.scss'

export default function Browse({
  traverseInvitations,
  startInvitations,
  editInvitations,
  browseInvitations,
  hideInvitations,
  allInvitations,
  idsToLoad,
  version,
  maxColumns,
  showCounter,
  user,
  banner,
}) {
  const [invitations, setInvitations] = useState(null)
  const [error, setError] = useState(null)

  const loadAllInvitations = async () => {
    await api
      .get(
        '/invitations',
        {
          ids: idsToLoad.join(','),
          expired: true,
          type: version === 2 ? 'edge' : 'edges',
        },
        { version }
      )
      .then(async (apiRes) => {
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
              // eslint-disable-next-line no-param-reassign
              invObj.invalid = true
            } else {
              throw new Error(
                `Could not load edge explorer. Invitation not found: ${invObj.id}`
              )
            }
            return
          }

          const readers = buildInvitationReplyArr(fullInvitation, 'readers', user.profile.id)
          const writers =
            buildInvitationReplyArr(fullInvitation, 'writers', user.profile.id) || readers
          const signatures = translateSignatures(fullInvitation, version)
          const nonreaders = buildInvitationReplyArr(
            fullInvitation,
            'nonreaders',
            user.profile.id
          )
          Object.assign(invObj, {
            head: translateFieldSpec(fullInvitation, 'head', version),
            tail: translateFieldSpec(fullInvitation, 'tail', version),
            weight: translateFieldSpec(fullInvitation, 'weight', version),
            defaultWeight: translateFieldSpec(fullInvitation, 'weight', version)?.default,
            label: translateFieldSpec(fullInvitation, 'label', version),
            defaultLabel: translateFieldSpec(fullInvitation, 'label', version)?.default,
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
          setInvitations({
            startInvitation: startInvitations[0],
            traverseInvitations,
            editInvitations: editInvitations
              .filter((inv) => !inv.invalid)
              .map((p) => ({ ...p })),
            browseInvitations: browseInvitations.filter((inv) => !inv.invalid),
            hideInvitations,
            allInvitations: allInvitations.filter((inv) => !inv.invalid),
          })
        } else {
          await api
            .get('/groups', { id: domainGroupId, select: 'content' })
            .then((response) => {
              const domainContent = response?.groups?.[0]?.content
              setInvitations({
                startInvitation: startInvitations[0],
                traverseInvitations,
                editInvitations: editInvitations
                  .filter((inv) => !inv.invalid)
                  .map((p) => ({
                    ...p,
                    submissionName: domainContent?.submission_name?.value,
                  })),
                browseInvitations: browseInvitations.filter((inv) => !inv.invalid),
                hideInvitations,
                allInvitations: allInvitations.filter((inv) => !inv.invalid),
              })
            })
        }
      })
      .catch((apiError) => {
        if (typeof apiError === 'object' && apiError.name) {
          if (apiError.name === 'NotFoundError') {
            setError('Could not load edge explorer. Invitation not found.')
            return
          }
          if (apiError.name === 'ForbiddenError') {
            setError('You do not have permission to view this invitation.')
            return
          }
        } else if (
          typeof apiError === 'string' &&
          apiError.startsWith('Invitation Not Found')
        ) {
          setError('Could not load edge explorer. Invitation not found.')
          return
        }
        setError(apiError.message)
      })
  }

  useEffect(() => {
    loadAllInvitations()
  }, [allInvitations])

  if (error) return <ErrorDisplay message={error} />
  if (!invitations) return <LoadingSpinner />

  return (
    <CommonLayout banner={<Banner>{banner}</Banner>} fullWidth minimalFooter>
      <div className={styles.browse}>
        <EdgeBrowserHeader invitation={traverseInvitations[0]} />
        <EdgeBrowser
          version={version}
          startInvitation={invitations.startInvitation}
          traverseInvitations={invitations.traverseInvitations}
          editInvitations={invitations.editInvitations}
          browseInvitations={invitations.browseInvitations}
          hideInvitations={invitations.hideInvitations}
          maxColumns={maxColumns}
          showCounter={showCounter}
          userInfo={{ userId: user?.id }}
        />
      </div>
    </CommonLayout>
  )
}
