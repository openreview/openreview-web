import { useEffect, useState } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'
import uniqBy from 'lodash/uniqBy'
import ErrorDisplay from '../../components/ErrorDisplay'
import LoadingSpinner from '../../components/LoadingSpinner'
import GroupMetaEditor from '../../components/group/GroupMetaEditor'
import GroupEditor from '../../components/group/GroupEditor'
import GroupEditInvitationsSelector from '../../components/group/GroupEditInvitationsSelector'
import api from '../../lib/api-client'
import { prettyId } from '../../lib/utils'
import { isSuperUser } from '../../lib/auth'
import { groupModeToggle } from '../../lib/banner-links'
import useUser from '../../hooks/useUser'

export default function GroupEdit({ appContext }) {
  const { accessToken, userLoading, user } = useUser()
  const [group, setGroup] = useState(null)
  const [editInvitations, setEditInvitations] = useState(null)
  const [selectedInvitation, setSelectedInvitation] = useState(null)
  const [error, setError] = useState(null)

  const router = useRouter()
  const { setBannerHidden, setEditBanner } = appContext

  const metaInvitationId = `${group?.domain ?? ''}/-/Edit`

  const loadGroup = async (id) => {
    try {
      const { groups } = await api.get('/groups', { id }, { accessToken })
      if (groups?.length > 0) {
        if (groups[0].details?.writable) {
          // Get venue group to pass to pass to webfield component
          let domainGroup = null
          if (groups[0].domain && groups[0].domain !== groups[0].id) {
            try {
              const apiRes = await api.get(
                '/groups',
                { id: groups[0].domain },
                { accessToken }
              )
              domainGroup = apiRes.groups?.length > 0 ? apiRes.groups[0] : null
            } catch (e) {
              domainGroup = null
            }
          } else if (groups[0].domain) {
            domainGroup = group
          }
          setGroup({
            ...groups[0],
            details: { ...groups[0].details, domain: domainGroup },
          })
        } else if (!accessToken) {
          router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
        } else {
          // User is a reader, not a writer of the group, so redirect to info mode
          router.replace(`/group/info?id=${id}`)
        }
      } else {
        setError({ statusCode: 404, message: 'Group not found' })
      }
    } catch (apiError) {
      if (apiError.name === 'ForbiddenError') {
        if (!accessToken) {
          router.replace(`/login?redirect=${encodeURIComponent(router.asPath)}`)
        } else {
          setError({
            statusCode: 403,
            message: "You don't have permission to read this group",
          })
        }
        return
      }
      setError({ statusCode: apiError.status, message: apiError.message })
    }
  }

  const loadInviteeInvitations = async (groupId) => {
    const { invitations } = await api.get(
      '/invitations',
      { prefix: `${groupId}/-/`, invitee: true, type: 'group', expired: true },
      { accessToken, version: 2 }
    )
    return invitations ?? []
  }

  const loadGroupInvitations = async (groupInvitations) => {
    const { invitations } = await api.get(
      '/invitations',
      { ids: groupInvitations.join(','), invitee: true, expired: true },
      { accessToken, version: 2 }
    )
    return invitations ?? []
  }

  const isPostableInvitation = (inv) => {
    const invitationEnabled = inv.cdate > Date.now()
    const invitationExpired = inv.expdate && inv.expdate < Date.now()
    return (invitationEnabled && !invitationExpired) || inv.details?.writable
  }

  useEffect(() => {
    if (!router.isReady || userLoading) return

    if (!router.query.id) {
      setError({ statusCode: 400, message: 'Missing required parameter id' })
      return
    }

    loadGroup(router.query.id)
  }, [router.isReady, router.query, userLoading, accessToken])

  useEffect(() => {
    if (!group) return

    // Show edit mode banner
    setBannerHidden(true)
    setEditBanner(groupModeToggle('edit', group.id))

    // For v2 groups, load available group invitations, otherwise use meta editor
    if (group.invitations) {
      Promise.all([loadInviteeInvitations(group.id), loadGroupInvitations(group.invitations)])
        .then(([inviteeInvitations, groupInvitations]) => {
          const metaInvitation = isSuperUser(user) ? [{ id: metaInvitationId }] : []
          const allInvitations = uniqBy(
            [...inviteeInvitations, ...groupInvitations, ...metaInvitation],
            'id'
          ).filter(isPostableInvitation)
          setEditInvitations(allInvitations)
        })
        .catch((apiError) => {
          setError({ statusCode: apiError.status, message: apiError.message })
        })
    } else {
      setEditInvitations([])
      setSelectedInvitation({ id: metaInvitationId })
    }
  }, [group])

  useEffect(() => {
    if (!error) return

    setBannerHidden(false)
    setEditBanner(null)
  }, [error])

  if (error) return <ErrorDisplay statusCode={error.statusCode} message={error.message} />

  return (
    <>
      <Head>
        <title>{`Edit ${prettyId(router.query.id ?? '')} Group | OpenReview`}</title>
      </Head>

      <div id="header">
        <h1>{prettyId(router.query.id)}</h1>
      </div>

      {(!group || !editInvitations) && <LoadingSpinner />}

      <GroupEditInvitationsSelector
        invitations={editInvitations}
        selectedInvitation={selectedInvitation}
        setSelected={setSelectedInvitation}
      />

      {selectedInvitation?.id === metaInvitationId ? (
        <GroupMetaEditor
          group={group}
          profileId={user?.profile?.id}
          accessToken={accessToken}
          isSuperUser={isSuperUser(user)}
          reloadGroup={() => loadGroup(group.id)}
        />
      ) : (
        <GroupEditor
          group={group}
          invitation={selectedInvitation}
          profileId={user?.profile?.id}
          accessToken={accessToken}
        />
      )}
    </>
  )
}

GroupEdit.bodyClass = 'group'
