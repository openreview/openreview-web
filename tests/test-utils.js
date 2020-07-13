/* eslint-disable no-use-before-define */

import api from '../lib/api-client'

export const circleciSuperUserName = 'openreview.net'

export async function setup() {
  const result1 = await api.put('/reset/openreview.net', { password: '1234' })
}

export function teardown() {
  console.log('TEARDOWN')
}

export async function addGroup(jsonToPost, adminToken) {
  const groupsUrl = '/groups'
  const result = await api.post(groupsUrl, { ...jsonToPost }, { accessToken: adminToken })
}

export async function addInvitation(jsonToPost, adminToken) {
  const invitationUrl = '/invitations'
  const result = await api.post(invitationUrl, { ...jsonToPost }, { accessToken: adminToken })
}

export async function getToken(id = circleciSuperUserName, password = '1234') {
  const loginUrl = '/login'
  try {
    const result = await api.post(loginUrl, { id, password })
    return result.token
  } catch (error) {
    await resetAdminPassword()
    return getToken()
  }
}

async function resetAdminPassword() {
  const result = await api.put(`/reset/${circleciSuperUserName}`, { password: '1234' })
}

export async function addMembersToGroup(groupId, membersList, adminToken) {
  const addMembersToGroupUrl = '/groups/members'
  const result = await api.put(addMembersToGroupUrl, { id: groupId, members: membersList }, { accessToken: adminToken })
}
