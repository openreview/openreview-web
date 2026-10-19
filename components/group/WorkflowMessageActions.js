/* globals $,DOMPurify,promptMessage: false */
import { Button, Select } from 'antd'
import { useEffect, useState } from 'react'
import api from '../../lib/api-client'
import { inflect, isValidEmail, prettyField, prettyId } from '../../lib/utils'
import BasicModal from '../BasicModal'
import MarkdownPreviewTab from '../MarkdownPreviewTab'

const messageModalId = 'message-committee'

// The committees a PC can message from Ongoing Actions, each with the per-paper names its filters
// need: its paper groups, anonymous groups and the note it submits (reviews, meta reviews).
const getMessageCommittees = (content) => {
  const value = (key) => content?.[key]?.value
  return [
    {
      key: 'authors',
      id: value('authors_id'),
      isAuthors: true,
    },
    {
      key: 'reviewers',
      id: value('reviewers_id'),
      paperRole: value('reviewers_name'),
      anonName: value('reviewers_anon_name'),
      noteName: value('review_name'),
    },
    {
      key: 'area_chairs',
      id: value('area_chairs_id'),
      paperRole: value('area_chairs_name'),
      anonName: value('area_chairs_anon_name'),
      noteName: value('meta_review_name'),
    },
    {
      key: 'senior_area_chairs',
      id: value('senior_area_chairs_id'),
      paperRole: value('senior_area_chairs_name'),
    },
  ]
    .filter((p) => p.id)
    .map((p) => ({ ...p, name: p.name ?? prettyId(p.id, true) }))
}

// Authors are messaged per paper (each paper's author group); filters follow its status and decision.
const getAuthorFilters = (submissions, content) => {
  const venueId = content.venue_id?.value
  const submissionName = content.submission_name?.value
  const authorsName = content.authors_name?.value
  const decisionName = content.decision_name?.value
  const decisionField = content.decision_field_name?.value ?? 'decision'
  const withdrawnVenueId = content.withdrawn_venue_id?.value
  const deskRejectedVenueId = content.desk_rejected_venue_id?.value

  const papers = submissions.map((note) => {
    const decisionNote = (note.details?.directReplies ?? []).find((reply) =>
      reply.invitations?.some((p) => p.endsWith(`/-/${decisionName}`))
    )
    const venueid = note.content?.venueid?.value
    return {
      id: `${venueId}/${submissionName}${note.number}/${authorsName}`,
      label: `Paper ${note.number}: ${note.content?.title?.value ?? ''}`,
      number: note.number,
      title: note.content?.title?.value ?? '',
      forum: note.forum,
      decision: decisionNote?.content?.[decisionField]?.value ?? null,
      isWithdrawn: venueid === withdrawnVenueId,
      isDeskRejected: venueid === deskRejectedVenueId,
    }
  })
  const activePapers = papers.filter((p) => !p.isWithdrawn && !p.isDeskRejected)
  const decisions = [...new Set(activePapers.map((p) => p.decision).filter(Boolean))].sort()
  return [
    { value: 'all', label: 'All active papers', recipients: activePapers },
    ...decisions.map((decision) => ({
      value: `decision:${decision}`,
      label: `Decision: ${decision}`,
      recipients: activePapers.filter((p) => p.decision === decision),
    })),
    {
      value: 'no-decision',
      label: 'No decision yet',
      recipients: activePapers.filter((p) => !p.decision),
    },
    {
      value: 'withdrawn',
      label: 'Withdrawn papers',
      recipients: papers.filter((p) => p.isWithdrawn),
    },
    {
      value: 'desk-rejected',
      label: 'Desk rejected papers',
      recipients: papers.filter((p) => p.isDeskRejected),
    },
  ].filter((p) => p.value === 'all' || p.recipients.length > 0)
}

// Committee members are messaged one by one; filters follow the PC console's: bids, assignments,
// and the notes each assigned paper still needs from them.
const getCommitteeFilters = (committee, data) => {
  const { members, bidCounts, paperGroups, submissions, content } = data
  const venueId = content.venue_id?.value
  const submissionName = content.submission_name?.value
  const paperPrefix = `${venueId}/${submissionName}`

  // "5/Reviewers" or "5/Reviewer_abcd"; deeper groups (5/Reviewers/Submitted) are not assignments
  const paperRoleGroups = paperGroups.flatMap((paperGroup) => {
    const parts = paperGroup.id.replace(paperPrefix, '').split('/')
    return parts.length === 2 ? [{ ...paperGroup, paper: parts[0], role: parts[1] }] : []
  })
  // An anonymous group (Submission5/Reviewer_abcd) stands for one committee member
  const anonMembers = {}
  paperRoleGroups.forEach((paperGroup) => {
    if (committee.anonName && paperGroup.role.startsWith(committee.anonName)) {
      anonMembers[paperGroup.id] = paperGroup.members[0]
    }
  })
  // A paper's committee group lists its members, or their anonymous groups
  const assignedPapers = {}
  paperRoleGroups.forEach((paperGroup) => {
    if (paperGroup.role !== committee.paperRole) return
    paperGroup.members.forEach((member) => {
      const person = anonMembers[member] ?? member
      assignedPapers[person] = [...(assignedPapers[person] ?? []), paperGroup.paper]
    })
  })
  const submittedPapers = {}
  if (committee.noteName) {
    submissions.forEach((note) => {
      ;(note.details?.directReplies ?? []).forEach((reply) => {
        if (!reply.invitations?.some((p) => p.endsWith(`/-/${committee.noteName}`))) return
        const author = anonMembers[reply.signatures?.[0]]
        if (author) submittedPapers[author] = [...(submittedPapers[author] ?? []), note.number]
      })
    })
  }

  const people = members.map((member) => ({
    id: member,
    label: member.startsWith('~') ? prettyId(member) : member,
    bids: bidCounts?.[member] ?? 0,
    assigned: assignedPapers[member]?.length ?? 0,
    submitted: submittedPapers[member]?.length ?? 0,
  }))
  const hasAssignments = people.some((p) => p.assigned > 0)
  const noteLabel = committee.noteName ? prettyField(committee.noteName).toLowerCase() : null
  return [
    { value: 'all', label: `All ${prettyId(committee.id, true)}`, recipients: people },
    bidCounts && {
      value: 'no-bids',
      label: 'No bids',
      recipients: people.filter((p) => p.bids === 0),
    },
    hasAssignments && {
      value: 'no-assignments',
      label: 'No assignments',
      recipients: people.filter((p) => p.assigned === 0),
    },
    hasAssignments &&
      noteLabel && {
        value: 'missing',
        label: `Missing ${noteLabel}s`,
        recipients: people.filter((p) => p.assigned > 0 && p.submitted < p.assigned),
      },
    hasAssignments &&
      noteLabel && {
        value: 'submitted',
        label: `Submitted ${noteLabel}s`,
        recipients: people.filter((p) => p.submitted > 0),
      },
  ].filter(Boolean)
}

// The API fills in who the email is to; anything about a paper the page fills in before sending,
// so authors get one message per paper.
const recipientPlaceholders = ['{{fullname}}', '{{firstname}}', '{{username}}']
const getPaperPlaceholders = (paper, submissionName) => {
  const prefix = submissionName.toLowerCase()
  return {
    [`{{${prefix}_number}}`]: String(paper.number),
    [`{{${prefix}_title}}`]: paper.title,
    '{{decision}}': paper.decision ?? 'No decision yet',
    '{{forum_link}}': `${window.location.origin}/forum?id=${paper.forum}`,
  }
}
const fillPlaceholders = (text, values) =>
  Object.entries(values).reduce((filled, [key, value]) => filled.replaceAll(key, value), text)
const getUnknownPlaceholders = (text, knownPlaceholders) =>
  [...new Set(text.match(/{{[^{}]+}}/g) ?? [])].filter((p) => !knownPlaceholders.includes(p))
const sendBatchSize = 100

const MessageCommitteeModal = ({ target, venueId, content, onClose }) => {
  const submissionName = content.submission_name?.value ?? 'Submission'
  const [sentCount, setSentCount] = useState(null)
  const shortPhrase = content.subtitle?.value ?? prettyId(venueId)
  const [step, setStep] = useState(1)
  const [subject, setSubject] = useState('')
  const [replyTo, setReplyTo] = useState(content.contact?.value ?? '')
  const [message, setMessage] = useState('')
  const [error, setError] = useState(null)
  const [isSending, setIsSending] = useState(false)

  useEffect(() => {
    if (!target) return
    setStep(1)
    setSubject(`[${shortPhrase}] `)
    setMessage('')
    setError(null)
    setSentCount(null)
  }, [target, shortPhrase])

  const recipients = target?.filter.recipients ?? []
  const isPerPaper = !!target?.committee.isAuthors
  const paperPlaceholderKeys = Object.keys(
    getPaperPlaceholders({ number: 0, title: '', forum: '' }, submissionName)
  )
  const knownPlaceholders = [
    ...recipientPlaceholders,
    ...(isPerPaper ? paperPlaceholderKeys : []),
  ]
  const fillForPaper = (text, paper) =>
    fillPlaceholders(text, getPaperPlaceholders(paper, submissionName))

  const sendPerPaper = async () => {
    const failed = []
    let sent = 0
    setSentCount(0)
    for (let start = 0; start < recipients.length; start += sendBatchSize) {
      const batch = recipients.slice(start, start + sendBatchSize)
      // eslint-disable-next-line no-await-in-loop
      const results = await Promise.allSettled(
        batch.map((paper) =>
          api.post('/messages', {
            invitation: `${target.committee.id}/-/Message`,
            signature: venueId,
            groups: [paper.id],
            subject: fillForPaper(subject.trim(), paper),
            message: DOMPurify.sanitize(fillForPaper(message, paper)),
            parentGroup: target.committee.id,
            ...(replyTo.trim() && { replyTo: replyTo.trim() }),
          })
        )
      )
      results.forEach((result, index) => {
        if (result.status === 'rejected') failed.push(batch[index])
        else sent += 1
      })
      setSentCount(sent)
    }
    return { sent, failed }
  }

  let primaryButtonText = 'Confirm & Send Messages'
  if (step === 1) primaryButtonText = 'Next'
  else if (isSending && isPerPaper) {
    primaryButtonText = `Sending ${sentCount ?? 0} of ${recipients.length}…`
  }

  const send = async () => {
    if (step === 1) {
      if (!subject.trim() || !message.trim()) {
        setError('Email Subject and Body are required.')
        return
      }
      const unknown = getUnknownPlaceholders(`${subject} ${message}`, knownPlaceholders)
      if (unknown.length) {
        setError(
          `${unknown.join(', ')} ${unknown.length === 1 ? "isn't a placeholder" : "aren't placeholders"} this message can use. Use: ${knownPlaceholders.join(', ')}.`
        )
        return
      }
      if (replyTo.trim() && !isValidEmail(replyTo.trim())) {
        setError('Reply to email is invalid.')
        return
      }
      setError(null)
      setStep(2)
      return
    }
    setIsSending(true)
    if (isPerPaper) {
      const { sent, failed } = await sendPerPaper()
      setIsSending(false)
      if (failed.length) {
        setError(
          `Sent to the authors of ${inflect(sent, 'paper', 'papers', true)}. Sending failed for ${failed.map((p) => `Paper ${p.number}`).join(', ')}.`
        )
        return
      }
      $(`#${messageModalId}`).modal('hide')
      promptMessage(`Sent to the authors of ${inflect(sent, 'paper', 'papers', true)}.`)
      return
    }
    try {
      await api.post('/messages', {
        invitation: `${target.committee.id}/-/Message`,
        signature: venueId,
        groups: recipients.map((p) => p.id),
        subject: subject.trim(),
        message: DOMPurify.sanitize(message),
        parentGroup: target.committee.id,
        ...(replyTo.trim() && { replyTo: replyTo.trim() }),
      })
      $(`#${messageModalId}`).modal('hide')
      promptMessage(
        `Sending ${inflect(recipients.length, 'message', 'messages', true)} to ${target.filter.label.toLowerCase()} (${target.committee.name}).`
      )
    } catch (apiError) {
      setError(apiError.message)
    }
    setIsSending(false)
  }

  return (
    <BasicModal
      id={messageModalId}
      title={target ? `Message ${target.committee.name}: ${target.filter.label}` : null}
      primaryButtonText={primaryButtonText}
      onPrimaryButtonClick={send}
      primaryButtonDisabled={isSending || !recipients.length}
      isLoading={isSending}
      onClose={onClose}
      options={{ useSpinnerButton: true }}
    >
      {error && <div className="alert alert-danger">{error}</div>}
      {step === 1 ? (
        <>
          <p>
            Write a message for {inflect(recipients.length, 'recipient', 'recipients', true)}.
            You will see the full list before anything is sent.
          </p>
          <div className="form-group">
            <label htmlFor="message-committee-subject">Email Subject</label>
            <input
              id="message-committee-subject"
              type="text"
              className="form-control"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label htmlFor="message-committee-replyto">Reply To</label>
            <input
              id="message-committee-replyto"
              type="text"
              className="form-control"
              value={replyTo}
              onChange={(e) => setReplyTo(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Email Body</label>
            <p className="hint">
              {'{{fullname}}'} is replaced with each recipient&apos;s name.
              {isPerPaper &&
                ` Each paper's authors get their own message, so you can also use ${paperPlaceholderKeys.join(', ')}.`}{' '}
              Markdown is supported; use Preview to see how the email will look.
            </p>
            <MarkdownPreviewTab
              value={message}
              onValueChanged={setMessage}
              placeholder="Message"
            />
          </div>
        </>
      ) : (
        <>
          <p>
            {target?.committee.isAuthors
              ? `The authors of ${inflect(recipients.length, 'paper', 'papers', true)} will receive this message:`
              : `${inflect(recipients.length, 'person', 'people', true)} will receive this message:`}
          </p>
          <ul className="well message-committee-recipients">
            {recipients.map((p) => (
              <li key={p.id}>{p.label}</li>
            ))}
          </ul>
          {isPerPaper && recipients[0] && (
            <div className="message-committee-preview">
              <p>
                <strong>{`How Paper ${recipients[0].number}'s email will read`}</strong> (
                {'{{fullname}}'} is filled in for each author):
              </p>
              <div className="well">
                <p>
                  <strong>{fillForPaper(subject.trim(), recipients[0])}</strong>
                </p>
                <div className="message-committee-preview-body">
                  {fillForPaper(message, recipients[0])}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </BasicModal>
  )
}

const MessageActionRow = ({ committee, filters, onWrite }) => {
  const [filterValue, setFilterValue] = useState('all')
  const filter = filters.find((p) => p.value === filterValue) ?? filters[0]
  const { name } = committee
  return (
    <div className="rec-action-row">
      <div className="rec-action-head">
        <span className="rec-action-name">{`Message ${name}`}</span>
        {/* Who to write to sits right beside the button that writes to them */}
        <div className="rec-actions inline">
          <span className="rec-action-primary">
            <Select
              className="message-filter"
              size="small"
              aria-label={`Which ${name} to message`}
              popupMatchSelectWidth={false}
              value={filter.value}
              onChange={setFilterValue}
              options={filters.map((p) => ({
                value: p.value,
                label: `${p.label} (${p.recipients.length})`,
              }))}
            />
          </span>
          <span className="rec-action-secondary">
            <Button
              size="small"
              type="primary"
              disabled={!filter.recipients.length}
              onClick={() => onWrite({ committee, filter })}
            >
              Write message
            </Button>
          </span>
        </div>
      </div>
    </div>
  )
}

// Ongoing Actions: message a committee, or the part of it a filter picks out.
const WorkflowMessageActions = ({ group }) => {
  const content = { ...group.content, venue_id: { value: group.id } }
  const [data, setData] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [target, setTarget] = useState(null)
  const committees = getMessageCommittees(content)

  useEffect(() => {
    const loadData = async () => {
      const venueId = group.id
      const submissionName = content.submission_name?.value
      const bidName = content.bid_name?.value
      try {
        const messageInvitationIds = committees.map((p) => `${p.id}/-/Message`)
        const [
          submissions,
          committeeGroups,
          paperGroupsResult,
          bidResults,
          messageInvitations,
        ] = await Promise.all([
          api.getAll('/notes', {
            invitation: content.submission_id?.value,
            details: 'directReplies',
            domain: venueId,
          }),
          Promise.all(
            committees.map((p) =>
              api
                .get('/groups', { id: p.id, select: 'id,members', domain: venueId })
                .then((result) => result.groups?.[0]?.members ?? [])
            )
          ),
          api.get('/groups', {
            prefix: `${venueId}/${submissionName}.*`,
            stream: true,
            select: 'id,members',
            domain: venueId,
          }),
          Promise.all(
            committees.map((p) =>
              p.isAuthors || !bidName
                ? Promise.resolve(null)
                : api
                    .getAll(
                      '/edges',
                      {
                        invitation: `${p.id}/-/${bidName}`,
                        groupBy: 'tail',
                        select: 'count',
                        domain: venueId,
                      },
                      { resultsKey: 'groupedEdges' }
                    )
                    .then((edges) =>
                      Object.fromEntries(edges.map((edge) => [edge.id.tail, edge.count]))
                    )
                    .catch(() => null)
            )
          ),
          Promise.all(
            messageInvitationIds.map((id) =>
              api
                .get('/invitations', { id, domain: venueId })
                .then((result) => !!result.invitations?.length)
                .catch(() => false)
            )
          ),
        ])
        setData({
          submissions,
          paperGroups: paperGroupsResult.groups ?? [],
          byCommittee: Object.fromEntries(
            committees.map((p, index) => [
              p.key,
              {
                members: committeeGroups[index],
                // A bid invitation with no bids at all is not one this committee used
                bidCounts:
                  bidResults[index] && Object.keys(bidResults[index]).length
                    ? bidResults[index]
                    : null,
                canMessage: messageInvitations[index],
              },
            ])
          ),
        })
      } catch (error) {
        setLoadError(error.message)
      }
    }

    loadData()
    // committees and content come from the venue group, which group.id identifies
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [group.id])

  if (loadError) {
    return <p className="rec-body">Messages could not be loaded: {loadError}</p>
  }
  if (!data) return <p className="rec-body">Loading…</p>

  const rows = committees
    .filter((committee) => data.byCommittee[committee.key]?.canMessage)
    .map((committee) => {
      const committeeData = data.byCommittee[committee.key]
      const filters = committee.isAuthors
        ? getAuthorFilters(data.submissions, content)
        : getCommitteeFilters(committee, {
            ...committeeData,
            paperGroups: data.paperGroups,
            submissions: data.submissions,
            content,
          })
      return { committee, filters }
    })
  if (!rows.length) return null

  return (
    <>
      {rows.map(({ committee, filters }) => (
        <MessageActionRow
          key={committee.key}
          committee={committee}
          filters={filters}
          onWrite={(nextTarget) => {
            setTarget(nextTarget)
            setTimeout(() => $(`#${messageModalId}`).modal('show'), 0)
          }}
        />
      ))}
      <MessageCommitteeModal
        target={target}
        venueId={group.id}
        content={content}
        onClose={() => setTarget(null)}
      />
    </>
  )
}

export default WorkflowMessageActions
