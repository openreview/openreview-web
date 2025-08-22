/* globals promptError: false */
import { useContext, useEffect, useState } from 'react'
import Link from 'next/link'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import WebFieldContext from '../../WebFieldContext'
import { getSingularRoleName, prettyField, prettyId } from '../../../lib/utils'
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
      const result = await api.get(
        '/groups',
        {
          prefix: `${venueId}/${ethicsReviewersName}`,
          stream: true,
          domain: venueId,
        },
        { accessToken }
      )
      setRecruitmentGroups(result.groups ?? [])
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
          title={`${getSingularRoleName(prettyField(ethicsReviewersName))} Recruitment`}
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
            <Link href={`/group/edit?id=${venueId}/${ethicsChairsName}`}>
              {prettyId(ethicsChairsName)}
            </Link>
          </li>
          <li>
            <Link href={`/group/edit?id=${venueId}/${ethicsReviewersName}`}>
              {prettyId(ethicsReviewersName)}
            </Link>{' '}
            (
            <Link href={`/group/edit?id=${venueId}/${ethicsReviewersName}/Invited`}>
              Invited
            </Link>
            ,
            <Link href={`/group/edit?id=${venueId}/${ethicsReviewersName}/Declined`}>
              Declined
            </Link>
            )
          </li>
        </ul>
      </div>
    </>
  )
}

export default EthicsChairOverview
