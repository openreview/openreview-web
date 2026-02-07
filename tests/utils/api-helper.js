/* eslint-disable no-use-before-define */

import fetch from 'node-fetch-cjs'
import { loadEnvConfig } from '@next/env'
import api from '../../lib/api-client'

loadEnvConfig(process.cwd())

api.configure({ fetchFn: fetch })

// #region exported constants
export const superUserName = 'openreview.net'
export const strongPassword = 'Or$3cur3P@ssw0rd'
export const baseGroupId = 'TestVenue'
export const subGroupId = 'TestVenue/2020'
export const conferenceGroupId = 'TestVenue/2020/Conference'
export const conferenceSubmissionInvitationId = `${conferenceGroupId}/-/Submission`

export const hasTaskUser = {
  fullname: 'FirstA LastA',
  email: 'a@a.com',
  password: strongPassword,
  tildeId: '~FirstA_LastA1',
}
export const hasNoTaskUser = {
  fullname: 'FirstB LastB',
  email: 'b@b.com',
  password: strongPassword,
  tildeId: '~FirstB_LastB1',
}
export const inactiveUser = {
  fullname: 'FirstC LastC',
  email: 'c@c.com',
  password: strongPassword,
  activate: false,
}
export const inActiveUserNoPassword = {
  fullname: 'FirstD LastD',
  email: 'd@d.com',
  tildeId: '~FirstD_LastD1',
}
export const inActiveUserNoPasswordNoEmail = {
  fullname: 'FirstE LastE',
  tildeId: '~FirstE_LastE1',
}
export const mergeUser = {
  fullname: 'FirstF LastF',
  email: 'alternate@a.com',
  password: strongPassword,
  tildeId: '~FirstF_LastF1',
}
// #endregion

export async function setupRegister(superUserToken) {
  console.log('Setting up users...')
  // create inactive user
  await createUser(inactiveUser)
  console.log('Inactive user created')
  await createProfile(
    inActiveUserNoPassword.fullname,
    inActiveUserNoPassword.email,
    inActiveUserNoPassword.tildeId,
    superUserToken
  )
  console.log('Inactive user with no password created')
  await createEmptyProfile(
    inActiveUserNoPasswordNoEmail.fullname,
    inActiveUserNoPasswordNoEmail.tildeId,
    superUserToken
  )
  console.log('Inactive user with no password and no email created')
}

// #region API helper functions
export function createGroup(jsonToPost, userToken) {
  return api.post('/groups', jsonToPost, { accessToken: userToken, version: 1 })
}

export function createGroupEdit(jsonToPost, userToken) {
  return api.post('/groups/edits', jsonToPost, { accessToken: userToken, version: 2 })
}

export function createInvitation(jsonToPost, userToken) {
  return api.post('/invitations', jsonToPost, { accessToken: userToken, version: 1 })
}

export function createNote(jsonToPost, userToken) {
  return api.post('/notes', jsonToPost, { accessToken: userToken, version: 1 })
}

export function createNoteEdit(jsonToPost, userToken) {
  return api.post('/notes/edits', jsonToPost, { accessToken: userToken, version: 2 })
}

export function sendFile(data, userToken) {
  return api.put('/attachment', data, {
    accessToken: userToken,
    contentType: 'unset',
    version: 2,
  })
}

export function getToken(id, password) {
  return api.post('/login', { id, password }, { version: 2 }).then((apiRes) => apiRes.token)
}

export function addMembersToGroup(groupId, membersList, userToken, version) {
  if (version === 2) {
    return api.post(
      '/groups/edits',
      {
        invitation: 'openreview.net/-/Edit',
        signatures: ['~Super_User1'],
        group: {
          id: groupId,
          members: { append: membersList },
        },
      },
      { accessToken: userToken, version }
    )
  }
  return api.put(
    '/groups/members',
    { id: groupId, members: membersList },
    { accessToken: userToken, version: 1 }
  )
}

export async function createUser({
  fullname,
  email,
  password,
  homepage = 'http://www.google.com',
  history = undefined,
  activate = true,
}) {
  // register
  const { id: tildeId } = await api.post('/register', {
    email,
    password,
    fullname,
  }, { version: 2 })

  // activate
  const defaultHistory = {
    position: 'Postdoc',
    start: 2000,
    end: new Date().getFullYear(),
    institution: {
      domain: 'umass.edu',
      name: 'University of Massachusetts, Amherst',
      country: 'US',
    },
  }
  const activateJson = {
    content: {
      names: [
        {
          fullname,
          username: tildeId,
          preferred: true,
        },
      ],
      gender: '',
      homepage,
      gscholar: '',
      dblp: '',
      orcid: '',
      linkedin: '',
      aclanthology: '',
      wikipedia: '',
      emails: [email],
      preferredEmail: email,
      history: [history || defaultHistory],
      relations: [],
      expertise: [],
    },
  }
  if (activate) {
    return api.put(`/activate/${email}`, activateJson, { version: 2 })
  }
  return null
}

export async function createProfile(fullname, email, tildeId, superUserToken) {
  // post tilde group
  const tildeGroupJson = {
    id: tildeId,
    signatures: ['openreview.net'],
    writers: ['openreview.net'],
    members: [email],
    readers: [tildeId],
    signatories: [tildeId],
  }
  await createGroupEdit({
        invitation: 'openreview.net/-/Edit',
        signatures: ['~Super_User1'],
        group: tildeGroupJson,
      }, superUserToken)
  // post email group
  const emailGroupJson = {
    id: email,
    signatures: ['openreview.net'],
    writers: ['openreview.net'],
    members: [tildeId],
    readers: [email],
    signatories: [email],
  }
  await createGroupEdit({
        invitation: 'openreview.net/-/Edit',
        signatures: ['~Super_User1'],
        group: emailGroupJson,
      }, superUserToken)
  // post profile
  const profileJson = {
    id: tildeId,
    invitation: '~/-/profiles',
    readers: ['openreview.net', tildeId],
    signatures: [tildeId],
    content: {
      emails: [email],
      preferredEmail: email,
      homepage: 'http://homepage.do',
      names: [
        {
          fullname,
          username: tildeId,
        },
      ],
      history: [
        {
          position: 'Postdoc',
          start: 2000,
          end: new Date().getFullYear(),
          institution: {
            domain: 'umass.edu',
            name: 'University of Massachusetts, Amherst',
            country: 'US',
          },
        },
      ],
    },
  }
  await api.post('/profiles', profileJson, { accessToken: superUserToken, version: 2 })
}

export async function createEmptyProfile(fullname, tildeId, superUserToken) {
  // post tilde group
  const tildeGroupJson = {
    id: tildeId,
    signatures: ['openreview.net'],
    writers: ['openreview.net'],
    members: [],
    readers: [tildeId],
    signatories: [tildeId],
  }
  await createGroupEdit({
        invitation: 'openreview.net/-/Edit',
        signatures: ['~Super_User1'],
        group: tildeGroupJson,
      }, superUserToken)
  // post profile
  const profileJson = {
    id: tildeId,
    invitation: '~/-/profiles',
    readers: ['openreview.net', tildeId],
    signatures: [tildeId],
    content: {
      dblp: 'https://dblp.org/pid/dummy',
      names: [
        {
          fullname,
          username: tildeId,
        },
      ],
      history: [
        {
          position: 'Postdoc',
          start: 2000,
          end: new Date().getFullYear(),
          institution: {
            domain: 'umass.edu',
            name: 'University of Massachusetts, Amherst',
            country: 'US',
          },
        },
      ],
    },
  }
  await api.post('/profiles', profileJson, { accessToken: superUserToken, version: 2 })
}
// #endregion

export function getMessages(params, token) {
  return api.get('/messages', params, { accessToken: token }).then((result) => result.messages)
}

export function getNotes(params, token, version = 1) {
  return api
    .get('/notes', params, { accessToken: token, version })
    .then((result) => result.notes)
}

export function getGroups(params, token, version = 1) {
  return api
    .get('/groups', params, { accessToken: token, version })
    .then((result) => result.groups)
}

export function getReferences(params, token) {
  return api
    .get('/references', params, { accessToken: token, version: 1 })
    .then((result) => result.references)
}

export function getNoteEdits(params, token) {
  return api
    .get('/notes/edits', params, { accessToken: token, version: 2 })
    .then((result) => result.edits)
}

export function getProcessLogs(id, token) {
  return api.get('/logs/process', { id }, { accessToken: token, version: 2 }).then((result) => result.logs)
}

export function getJobsStatus(token) {
  return api.get('/jobs/status', {}, { accessToken: token, version: 2 })
}
