/* globals promptError: false */
import { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import WebFieldContext from '../../WebFieldContext'
import { prettyId } from '../../../lib/utils'
import { StatContainer } from '../ProgramChairConsole/Overview'
import LoadingSpinner from '../../LoadingSpinner'

const EthicsChairOverview = () => {
  const { venueId, ethicsChairsName, ethicsReviewersName } = useContext(WebFieldContext)
  const [recruitmentGroups, setRecruitmentGroups] = useState(null)
  const { accessToken } = useUser()
  const ethicsReviewersGroup = recruitmentGroups?.find(
    (group) => group.id === `${venueId}/${ethicsReviewersName}`
  )
  const invitedEthicsReviewersGroup = recruitmentGroups?.find(
    (group) => group.id === `${venueId}/${ethicsReviewersName}/Invited`
  )

  const loadRecruitmentGroups = async () => {
    try {
      const result = await api.getAll(
        '/groups',
        {
          prefix: `${venueId}/${ethicsReviewersName}`,
        },
        { accessToken, version: 2 }
      )
      setRecruitmentGroups(result)
    } catch (error) {
      promptError(error.message)
    }
  }

  useEffect(() => {
    loadRecruitmentGroups()
  }, [])
  return (
    <>
      <div className="row recruitment-stat-row">
        <StatContainer
          title="Ethics Reviewer Recruitment"
          hint="accepted / invited"
          value={
            recruitmentGroups ? (
              `${ethicsReviewersGroup?.members?.length ?? 'N/A'} / ${
                invitedEthicsReviewersGroup?.members?.length ?? 'N/A'
              }`
            ) : (
              <LoadingSpinner inline={true} text={null} />
            )
          }
        />
      </div>
      <hr className="spacer" />
      <div className="row recruitment-stat-row">
        <h4>Ethics Review Roles</h4>
        <ul>
          <li>
            <Link href={`/group/info?id=${venueId}/${ethicsChairsName}`}>
              <a>{prettyId(ethicsChairsName)}</a>
            </Link>
          </li>
          <li>
            <Link href={`/group/info?id=${venueId}/${ethicsReviewersName}`}>
              <a>{prettyId(ethicsReviewersName)}</a>
            </Link>{' '}
            (
            <Link href={`/group/info?id=${venueId}/${ethicsReviewersName}/Invited`}>
              <a>Invited</a>
            </Link>
            ,
            <Link href={`/group/info?id=${venueId}/${ethicsReviewersName}/Declined`}>
              <a>Declined</a>
            </Link>
            )
          </li>
        </ul>
      </div>
    </>
  )
}

export default EthicsChairOverview
