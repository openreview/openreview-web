'use client'

/* globals promptError: false */
import React, { useEffect, useState } from 'react'
import { isEmpty } from 'lodash'
import { nanoid } from 'nanoid'
import SpinnerButton from '../../../components/SpinnerButton'
import { getProfileStateLabelClass, prettyField } from '../../../lib/utils'
import LoadingSpinner from '../../../components/LoadingSpinner'
import api from '../../../lib/api-client'

// #region components used by Compare (in renderField method)
const Names = ({ names, highlightValue }) => (
  <table>
    <tbody>
      {names &&
        names.map((name, index) => (
          <tr
            key={`${name.fullname}${name.preferred}${index}`}
            data-toggle={name.signatures && 'tooltip'}
            title={name.signature && `Edited by ${name.signatures}`}
            style={name.confirmed ? null : { color: '#8c1b13' }}
          >
            <td>
              <span className={highlightValue.includes(name.fullname) ? 'highlight ' : null}>
                {name.fullname}
              </span>{' '}
              {name.preferred && <small>(Preferred)</small>}
            </td>
          </tr>
        ))}
    </tbody>
  </table>
)

const History = ({ historys, highlightValue }) => (
  <table style={{ width: '100%' }}>
    <tbody>
      {historys &&
        historys.map((history) => (
          <tr
            key={nanoid()}
            data-toggle={history.signatures && 'tooltip'}
            title={history.signature && `Edited by ${history.signatures}`}
            style={history.confirmed ? null : { color: '#8c1b13' }}
          >
            <td className="position">
              <strong>{history.position}</strong>
            </td>
            <td className="institution">
              <span
                className={
                  highlightValue.includes(history.institution.name) ? 'highlight' : null
                }
              >
                {history.institution.name}
              </span>{' '}
              {history.institution.domain && (
                <small
                  className={
                    highlightValue.includes(history.institution.domain) ? 'highlight' : null
                  }
                >
                  {`(${history.institution.domain})`}
                </small>
              )}
            </td>
          </tr>
        ))}
    </tbody>
  </table>
)

const Relation = ({ relationships, highlightValue }) => (
  <table style={{ width: '100%' }}>
    <tbody>
      {relationships &&
        relationships.map((relationship) => (
          <tr
            key={`${relationship.name}${relationship.relation}${relationship.start}${relationship.end}`}
            data-toggle={relationship.signatures && 'tooltip'}
            title={relationship.signature && `Edited by ${relationship.signatures}`}
            style={relationship.confirmed ? null : { color: '#8c1b13' }}
          >
            <td>
              <strong
                className={highlightValue.includes(relationship.name) ? 'highlight' : null}
              >
                {relationship.name}
              </strong>
            </td>
            <td>
              <small
                className={highlightValue.includes(relationship.email) ? 'highlight' : null}
              >
                {relationship.email}
              </small>
            </td>
            <td>
              <span>{relationship.relation}</span>
            </td>
          </tr>
        ))}
    </tbody>
  </table>
)

const Expertise = ({ expertises, highlightValue }) => (
  <table>
    <tbody>
      {expertises &&
        expertises.map((expertise) => (
          <tr
            key={expertise.keywords}
            data-toggle={expertise.signatures && 'tooltip'}
            title={expertise.signature && `Edited by ${expertise.signatures}`}
            style={expertise.confirmed ? null : { color: '#8c1b13' }}
          >
            <td>
              <span
                className={
                  highlightValue.includes(expertise.keywords.join(', ')) ? 'highlight' : null
                }
              >
                {expertise.keywords.join(', ')}
              </span>
            </td>
          </tr>
        ))}
    </tbody>
  </table>
)

const Publications = ({ publications, highlightValue }) => (
  <table style={{ width: '100%' }}>
    <tbody>
      {publications &&
        publications.map((publication, publicationIndex) => (
          <React.Fragment key={`${publication.forum}-${publicationIndex}`}>
            <tr key={`${publication.title}1`}>
              <td>
                <a href={`/forum?id=${publication.forum}`} target="_blank" rel="noreferrer">
                  <strong
                    className={highlightValue.includes(publication.title) ? 'highlight' : null}
                  >
                    {publication.title}
                  </strong>
                </a>
              </td>
            </tr>
            <tr>
              <td>
                {publication.authors.map((author) => (
                  <React.Fragment key={author}>
                    <span className={highlightValue.includes(author) ? 'highlight' : null}>
                      {author}
                    </span>
                    <span>, </span>
                  </React.Fragment>
                ))}
              </td>
            </tr>
            <tr>
              <td style={{ paddingBottom: '.75rem' }}>
                {publication.authorids.map((authorid, index) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <a
                    key={index}
                    href={`/group?id=${authorid}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span className={highlightValue.includes(authorid) ? 'highlight' : null}>
                      {authorid}
                    </span>
                    <span>, </span>
                  </a>
                ))}
              </td>
            </tr>
          </React.Fragment>
        ))}
    </tbody>
  </table>
)

const Others = ({ fieldContent, highlightValue, isEmailSection }) => {
  if (typeof fieldContent === 'string') {
    if (fieldContent.startsWith('http')) {
      return (
        <a href={fieldContent.value} target="_blank" rel="noreferrer">
          <span className={highlightValue.includes(fieldContent) ? 'highlight' : null}>
            {fieldContent}
          </span>
        </a>
      )
    }
    return (
      <span className={highlightValue.includes(fieldContent) ? 'highlight' : null}>
        {fieldContent}
      </span>
    )
  }
  return (
    <table>
      <tbody>
        {fieldContent &&
          fieldContent.map((content, i) => (
            <tr
              // eslint-disable-next-line react/no-array-index-key
              key={`${content.value}-${i}`}
              data-toggle={content.signatures && 'tooltip'}
              title={content.signature && `Edited by ${content.signatures}`}
              style={content.confirmed ? null : { color: '#8c1b13' }}
            >
              <td>
                {content.value?.startsWith('http') ? (
                  <a href={content.value} target="_blank" rel="noreferrer">
                    <span
                      className={highlightValue.includes(content.value) ? 'highlight' : null}
                    >
                      {content.value}
                    </span>
                  </a>
                ) : (
                  <>
                    <span
                      className={highlightValue.includes(content.value) ? 'highlight' : null}
                    >
                      {content.value}
                    </span>
                    {isEmailSection && content.isConfirmedEmail && <small> (Confirmed)</small>}
                  </>
                )}
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  )
}
// #endregion

const renderField = (profile, fieldName, highlightValue) => {
  switch (fieldName) {
    case 'state':
      return <span className={getProfileStateLabelClass(profile.state)}>{profile.state}</span>
    case 'names':
      return <Names names={profile.names} highlightValue={highlightValue} />
    case 'history':
      return <History historys={profile.history} highlightValue={highlightValue} />
    case 'relations':
      return <Relation relationships={profile.relations} highlightValue={highlightValue} />
    case 'expertise':
      return <Expertise expertises={profile.expertise} highlightValue={highlightValue} />
    case 'publications':
      return (
        <Publications publications={profile.publications} highlightValue={highlightValue} />
      )
    default:
      return (
        <Others
          fieldContent={profile[fieldName]}
          highlightValue={highlightValue}
          isEmailSection={fieldName === 'emails'}
        />
      )
  }
}

const renderEdgeLink = (count, headTail, id) => {
  if (count === 0) return `no ${headTail} edge`
  return (
    <>
      <a
        href={`${process.env.API_URL}/edges?${headTail}=${id}`}
        target="_blank"
        rel="noreferrer"
      >
        {count}
      </a>{' '}
      {headTail} edges
    </>
  )
}

const renderTagLink = (count, id) => {
  if (count === 0) return 'no tag'
  return (
    <>
      <a
        href={`${process.env.API_V2_URL}/tags?profile=${id}`}
        target="_blank"
        rel="noreferrer"
      >
        {count} tags
      </a>
    </>
  )
}

const getHighlightValue = (withSignatureProfile) => {
  const compareFields = []
  Object.entries(withSignatureProfile).forEach(([key, value]) => {
    if (!value) return

    if (typeof value === 'string') {
      compareFields.push(value)
      return
    }
    if (key === 'names') {
      value.forEach((name) => {
        compareFields.push(name?.fullname)
      })
      return
    }
    if (key === 'history') {
      value.forEach((history) => {
        compareFields.push(history?.institution?.name)
        compareFields.push(history?.institution?.domain)
      })
      return
    }
    if (key === 'relations') {
      value.forEach((relation) => {
        compareFields.push(relation?.name)
        compareFields.push(relation?.email)
      })
      return
    }
    if (key === 'expertise') {
      value.forEach((expertise) => {
        compareFields.push(expertise?.keywords?.join(', '))
      })
      return
    }
    if (key === 'publications') {
      value.forEach((publication) => {
        compareFields.push(publication?.title)
        // eslint-disable-next-line no-unused-expressions
        publication?.authors?.forEach((author) => {
          compareFields.push(author)
        })
        // eslint-disable-next-line no-unused-expressions
        publication?.authorids?.forEach((authorids) => {
          compareFields.push(authorids)
        })
      })
      return
    }
    if (Array.isArray(value)) {
      value.forEach((p) => {
        compareFields.push(p.value)
      })
    }
  })
  return compareFields.filter((p) => p)
}

export default function Compare({ profiles, accessToken, loadProfiles }) {
  const [highlightValues, setHighlightValues] = useState(null)
  const [fields, setFields] = useState(null)
  const [edgeCounts, setEdgeCounts] = useState(null)
  const [tags, setTags] = useState(null)
  const [loadingEdges, setLoadingEdges] = useState(false)
  const [loadingTags, setLoadingTags] = useState(false)

  const getEdges = async () => {
    if (!profiles.left?.id || !profiles.right?.id || profiles.left.id === profiles.right.id)
      return
    try {
      const leftHeadP = api.get('/edges', { head: profiles.left.id }, { accessToken })
      const leftTailP = api.get('/edges', { tail: profiles.left.id }, { accessToken })
      const rightHeadP = api.get('/edges', { head: profiles.right.id }, { accessToken })
      const rightTailP = api.get('/edges', { tail: profiles.right.id }, { accessToken })
      const results = await Promise.all([leftHeadP, leftTailP, rightHeadP, rightTailP])
      setEdgeCounts({
        leftHead: results[0].count,
        leftTail: results[1].count,
        rightHead: results[2].count,
        rightTail: results[3].count,
      })
    } catch (error) {
      promptError(error.message)
    }
  }

  const getTags = async () => {
    if (!profiles.left?.id || !profiles.right?.id || profiles.left.id === profiles.right.id)
      return
    try {
      const leftTagsP = api.get(
        '/tags',
        {
          profile: profiles.left.id,
        },
        { accessToken }
      )
      const rightTagsP = api.get(
        '/tags',
        {
          profile: profiles.right.id,
        },
        { accessToken }
      )
      const results = await Promise.all([leftTagsP, rightTagsP])
      setTags({
        left: results[0].count,
        right: results[1].count,
      })
    } catch (error) {
      promptError(error.message)
    }
  }

  const mergeProfile = (from, to) => {
    const fromProfile = {
      id: profiles[from].id,
      active: profiles[from].active,
      state: profiles[from].state,
    }
    const toProfile = {
      id: profiles[to].id,
      active: ['Active Institutional', 'Active Automatic', 'Active'].includes(
        profiles[to].state
      ),
      state: profiles[to].state,
    }
    const postMerge = async () => {
      try {
        await api.post(
          '/profiles/merge',
          { from: fromProfile.id, to: toProfile.id },
          { accessToken }
        )
        await loadProfiles()
        setEdgeCounts(null)
        setTags(null)
      } catch (apiError) {
        promptError(apiError.message)
      }
    }

    if (toProfile.active === false && fromProfile.active === true) {
      if (
        // eslint-disable-next-line no-alert
        window.confirm(
          `You are merging an ${fromProfile.state} profile into an ${toProfile.state} profile. Are you sure you want to proceed?`
        )
      ) {
        postMerge()
      }
    } else {
      postMerge()
    }
  }

  const mergeEdge = async (from, to) => {
    setLoadingEdges(true)
    try {
      await api.post(
        '/edges/rename',
        { currentId: profiles[from].id, newId: profiles[to].id },
        { accessToken }
      )
      await getEdges()
    } catch (apiError) {
      promptError(apiError.message)
    }
    setLoadingEdges(false)
  }

  const mergeTag = async (from, to) => {
    setLoadingTags(true)
    try {
      await api.post(
        '/tags/rename',
        { currentId: profiles[from].id, newId: profiles[to].id },
        { accessToken }
      )
      await getTags()
    } catch (error) {
      promptError(error.message)
    }
    setLoadingTags(false)
  }

  useEffect(() => {
    if (!profiles) return

    setFields(
      Array.from(
        new Set([
          ...Object.keys(profiles.left).filter(
            (key) => !isEmpty(profiles.left[key]) && key !== 'id'
          ),
          ...Object.keys(profiles.right).filter(
            (key) => !isEmpty(profiles.right[key]) && key !== 'id'
          ),
        ])
      )
    )

    setHighlightValues({
      left: getHighlightValue(profiles.left),
      right: getHighlightValue(profiles.right),
    })

    getEdges()
    getTags()
  }, [profiles])

  return (
    <table className="table">
      <thead>
        <tr>
          <th style={{ width: '110px', verticalAlign: 'middle' }}>Merge Direction</th>
          <th style={{ width: '300px', textAlign: 'center', verticalAlign: 'middle' }}>
            <a href={`/profile?id=${profiles.left?.id}`} target="_blank" rel="noreferrer">
              {profiles.left?.id}
            </a>
          </th>
          <th colSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
            <button
              type="button"
              className="btn merge-btn-left mb-2"
              disabled={profiles.left?.id && profiles.right?.id ? null : true}
              onClick={() => mergeProfile('right', 'left')}
            >
              &laquo;
            </button>
            <br />
            <button
              type="button"
              className="btn merge-btn-right"
              disabled={profiles.left?.id && profiles.right?.id ? null : true}
              onClick={() => mergeProfile('left', 'right')}
            >
              &raquo;
            </button>
          </th>
          <th style={{ width: '300px', textAlign: 'center', verticalAlign: 'middle' }}>
            <a href={`/profile?id=${profiles.right?.id}`} target="_blank" rel="noreferrer">
              {profiles.right?.id}
            </a>
          </th>
        </tr>
      </thead>

      <tbody>
        {fields ? (
          fields.map((field) => (
            <tr key={field}>
              <td>
                <strong>{prettyField(field)}</strong>
              </td>
              <td colSpan="2">{renderField(profiles?.left, field, highlightValues.right)}</td>
              <td colSpan="2">{renderField(profiles?.right, field, highlightValues.left)}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td>
              <LoadingSpinner />
            </td>
          </tr>
        )}
        {edgeCounts && (
          <tr>
            <td>
              <strong>Edges</strong>
            </td>
            <td>
              {renderEdgeLink(edgeCounts.leftHead, 'head', profiles.left.id)}
              {', '}
              {renderEdgeLink(edgeCounts.leftTail, 'tail', profiles.left.id)}
            </td>
            <td colSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
              <SpinnerButton
                type="button"
                className="mb-2"
                loading={loadingEdges}
                disabled={!(edgeCounts.rightHead || edgeCounts.rightTail) || loadingEdges}
                onClick={() => mergeEdge('right', 'left')}
              >
                &laquo;
              </SpinnerButton>
              <br />
              <SpinnerButton
                type="button"
                loading={loadingEdges}
                disabled={!(edgeCounts.leftHead || edgeCounts.leftTail) || loadingEdges}
                onClick={() => mergeEdge('left', 'right')}
              >
                &raquo;
              </SpinnerButton>
            </td>
            <td>
              {renderEdgeLink(edgeCounts.rightHead, 'head', profiles.right.id)}
              {', '}
              {renderEdgeLink(edgeCounts.rightTail, 'tail', profiles.right.id)}
            </td>
          </tr>
        )}
        {tags && (
          <tr>
            <td>
              <strong>Tags</strong>
            </td>
            <td>
              <div className="tags-container">
                {renderTagLink(tags.left, profiles.left.id)}
              </div>
            </td>
            <td colSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
              <SpinnerButton
                type="button"
                className="mb-2"
                loading={loadingTags}
                disabled={!tags.right.length || loadingTags}
                onClick={() => mergeTag('right', 'left')}
              >
                {loadingTags ? '' : '«'}
              </SpinnerButton>
              <br />

              <SpinnerButton
                type="button"
                loading={loadingTags}
                disabled={!tags.left.length || loadingTags}
                onClick={() => mergeTag('left', 'right')}
              >
                {loadingTags ? '' : '»'}
              </SpinnerButton>
            </td>
            <td>
              <div className="tags-container">
                {renderTagLink(tags.right, profiles.right.id)}
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
