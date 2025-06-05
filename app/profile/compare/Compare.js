'use client'

/* globals promptError: false */
import React, { useEffect, useState } from 'react'
import { isEmpty } from 'lodash'
import { useRouter } from 'next/navigation'
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
            key={`${history.position}${history.institution.name}${history.start}${history.end}`}
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

export default function Compare({ profilesWithEdgeCounts, accessToken }) {
  const { withSignatureProfiles, edgeCounts } = profilesWithEdgeCounts
  const [highlightValues, setHighlightValues] = useState(null)
  const [fields, setFields] = useState(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const mergeProfile = (from, to) => {
    const fromProfile = {
      id: withSignatureProfiles[from].id,
      active: withSignatureProfiles[from].active,
      state: withSignatureProfiles[from].state,
    }
    const toProfile = {
      id: withSignatureProfiles[to].id,
      active: ['Active Institutional', 'Active Automatic', 'Active'].includes(
        withSignatureProfiles[to].state
      ),
      state: withSignatureProfiles[to].state,
    }
    const postMerge = async () => {
      try {
        await api.post(
          '/profiles/merge',
          { from: fromProfile.id, to: toProfile.id },
          { accessToken }
        )
        router.refresh()
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
    setLoading(true)
    try {
      await api.post(
        '/edges/rename',
        { currentId: withSignatureProfiles[from].id, newId: withSignatureProfiles[to].id },
        { accessToken }
      )
      router.refresh()
    } catch (apiError) {
      promptError(apiError.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!withSignatureProfiles) return

    setFields(
      Array.from(
        new Set([
          ...Object.keys(withSignatureProfiles.left).filter(
            (key) => !isEmpty(withSignatureProfiles.left[key]) && key !== 'id'
          ),
          ...Object.keys(withSignatureProfiles.right).filter(
            (key) => !isEmpty(withSignatureProfiles.right[key]) && key !== 'id'
          ),
        ])
      )
    )

    setHighlightValues({
      left: getHighlightValue(withSignatureProfiles.left),
      right: getHighlightValue(withSignatureProfiles.right),
    })
  }, [withSignatureProfiles])

  return (
    <table className="table">
      <thead>
        <tr>
          <th style={{ width: '110px', verticalAlign: 'middle' }}>Merge Direction</th>
          <th style={{ width: '300px', textAlign: 'center', verticalAlign: 'middle' }}>
            <a
              href={`/profile?id=${withSignatureProfiles.left?.id}`}
              target="_blank"
              rel="noreferrer"
            >
              {withSignatureProfiles.left?.id}
            </a>
          </th>
          <th colSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
            <button
              type="button"
              className="btn merge-btn-left mb-2"
              disabled={
                withSignatureProfiles.left?.id && withSignatureProfiles.right?.id ? null : true
              }
              onClick={() => mergeProfile('right', 'left')}
            >
              &laquo;
            </button>
            <br />
            <button
              type="button"
              className="btn merge-btn-right"
              disabled={
                withSignatureProfiles.left?.id && withSignatureProfiles.right?.id ? null : true
              }
              onClick={() => mergeProfile('left', 'right')}
            >
              &raquo;
            </button>
          </th>
          <th style={{ width: '300px', textAlign: 'center', verticalAlign: 'middle' }}>
            <a
              href={`/profile?id=${withSignatureProfiles.right?.id}`}
              target="_blank"
              rel="noreferrer"
            >
              {withSignatureProfiles.right?.id}
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
              <td colSpan="2">
                {renderField(withSignatureProfiles?.left, field, highlightValues.right)}
              </td>
              <td colSpan="2">
                {renderField(withSignatureProfiles?.right, field, highlightValues.left)}
              </td>
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
              {renderEdgeLink(edgeCounts.leftHead, 'head', withSignatureProfiles.left.id)}
              {', '}
              {renderEdgeLink(edgeCounts.leftTail, 'tail', withSignatureProfiles.left.id)}
            </td>
            <td colSpan="2" style={{ textAlign: 'center', verticalAlign: 'middle' }}>
              <SpinnerButton
                type="button"
                className="mb-2"
                loading={loading}
                disabled={!(edgeCounts.rightHead || edgeCounts.rightTail) || loading}
                onClick={() => mergeEdge('right', 'left')}
              >
                &laquo;
              </SpinnerButton>
              <br />
              <SpinnerButton
                type="button"
                loading={loading}
                disabled={!(edgeCounts.leftHead || edgeCounts.leftTail) || loading}
                onClick={() => mergeEdge('left', 'right')}
              >
                &raquo;
              </SpinnerButton>
            </td>
            <td>
              {renderEdgeLink(edgeCounts.rightHead, 'head', withSignatureProfiles.right.id)}
              {', '}
              {renderEdgeLink(edgeCounts.rightTail, 'tail', withSignatureProfiles.right.id)}
            </td>
          </tr>
        )}
      </tbody>
    </table>
  )
}
