import useUser from '../../hooks/useUser'
import useQuery from '../../hooks/useQuery'
import { useRouter } from 'next/router'
import { Tab, TabList, TabPanel, TabPanels, Tabs } from '../Tabs'
import Table from '../Table'
import { referrerLink, venueHomepageLink } from '../../lib/banner-links'
import api from '../../lib/api-client'
import WebFieldContext from '../WebFieldContext'
import { useContext, useEffect, useState } from 'react'
import BasicHeader from './BasicHeader'
import { inflect, prettyId } from '../../lib/utils'
import Link from 'next/link'

const StatContainer = ({ title, hint, value }) => {
  return (
    <div className="col-md-4 col-xs-6">
      <h4>{title}:</h4>
      {hint && <p className="hint">{hint}</p>}
      <h3>{value}</h3>
    </div>
  )
}

const RecruitmentStatsRow = ({ areaChairsId, seniorAreaChairsId }) => {
  return (
    <>
      <div className="row">
        <StatContainer
          title="Reviewer Recruitment"
          hint="accepted / invited"
          value="10441/3852"
        />
        {areaChairsId && (
          <StatContainer
            title="Area Chair Recruitment"
            hint="accepted / invited"
            value="10441/3852"
          />
        )}
        {seniorAreaChairsId && (
          <StatContainer
            title="Senior Area Chair Recruitment"
            hint="accepted / invited"
            value="10441/3852"
          />
        )}
      </div>
      <hr className="spacer" />
    </>
  )
}

const SubmissionsStatsRow = () => {
  return (
    <>
      <div className="row">
        <StatContainer title="Active Submissions" value="7661" />
        <StatContainer title="Withdrawn Submissions" value="7661" />
        <StatContainer title="Desk Rejected Submissions" value="7661" />
      </div>
      <hr className="spacer" />
    </>
  )
}

const BiddingStatsRow = ({
  areaChairsId,
  seniorAreaChairsId,
  reviewersId,
  bidEnabled,
  recommendationEnabled,
}) => {
  if (!bidEnabled && !recommendationEnabled) return null
  return (
    <>
      <div className="row">
        {bidEnabled && reviewersId && (
          <StatContainer
            title="Reviewer Bidding Progress"
            hint="% of ACs who have completed the required number of bids"
            value="7661"
          />
        )}
        {bidEnabled && areaChairsId && (
          <StatContainer
            title="AC Bidding Progress"
            hint="% of ACs who have completed the required number of bids"
            value="7661"
          />
        )}
        {recommendationEnabled && areaChairsId && (
          <StatContainer
            title="Recommendation Progress"
            hint="% of ACs who have completed the required number of reviewer recommendations"
            value="7661"
          />
        )}
        {bidEnabled && seniorAreaChairsId && (
          <StatContainer
            title="SAC Bidding Progress"
            hint="% of SACs who have completed the required number of bids"
            value="7661"
          />
        )}
      </div>
      <hr className="spacer" />
    </>
  )
}

const ReviewStatsRow = ({ paperReviewsCompleteThreshold }) => {
  return (
    <>
      <div className="row">
        <StatContainer
          title="Review Progress"
          hint="% of all assigned official reviews that have been submitted"
          value="7661"
        />
        <StatContainer
          title="Reviewer Progress"
          hint="% of reviewers who have reviewed all of their assigned papers"
          value="7661"
        />
        <StatContainer
          title="Paper Progress"
          hint={`% of papers that have received ${
            paperReviewsCompleteThreshold
              ? `at least ${inflect(paperReviewsCompleteThreshold, 'review', 'reviews', true)}`
              : 'reviews from all assigned reviewers'
          }`}
          value="7661"
        />
      </div>
      <hr className="spacer" />
    </>
  )
}

const MetaReviewStatsRow = ({ areaChairsId }) => {
  if (!areaChairsId) return null
  return (
    <>
      <div className="row">
        <StatContainer
          title="Meta-Review Progress"
          hint="% of papers that have received meta-reviews"
          value="7661"
        />
        <StatContainer
          title="AC Meta-Review Progress"
          hint="% of area chairs who have completed meta reviews for all their assigned papers"
          value="7661"
        />
      </div>
      <hr className="spacer" />
    </>
  )
}

const DecisionStatsRow = ({ decisionsByTypeCount = [] }) => {
  return (
    <>
      <div className="row">
        <StatContainer
          title="Decision Progress"
          hint="% of papers that have received a decision"
          value="7661"
        />
      </div>
      <div className="row">
        {decisionsByTypeCount.map((type) => {
          return <StatContainer title={type} value="7661" />
        })}
      </div>
      <hr className="spacer" />
    </>
  )
}

const DescriptionTimelineRow = ({ requestForm }) => {
  //TODO: invitation map to timeline
  if (!requestForm) return
  return (
    <div className="row">
      {requestForm && (
        <div className="col-md-4 col-xs-12">
          <h4>Description:</h4>
          <p>
            <span>
              {`Author And Reviewer Anonymity: ${requestForm.content['Author and Reviewer Anonymity']}`}
              <br />
              {requestForm.content['Open Reviewing Policy']}
              <br />
              {`Paper matching uses ${requestForm.content['Paper Matching'].join(', ')}`}
              {requestForm.content['Other Important Information'] && (
                <>
                  <br />
                  {note.content['Other Important Information']}
                </>
              )}
            </span>
            <br />
          </p>
        </div>
      )}
      <div className="col-md-8 col-xs-12">
        <h4>Timeline:</h4>
      </div>
    </div>
  )
}

// Official Committee, Registration Forms, Bids & Recommendation
const OtherConfigInfoRow = ({
  venueId,
  requestForm,
  programChairsId,
  seniorAreaChairsId,
  areaChairsId,
  authorsId,
  registrationForms,
  bidEnabled,
  recommendationEnabled,
}) => {
  const sacRoles = requestForm?.content?.['senior_area_chair_roles'] ?? ['Senior_Area_Chairs']
  const acRoles = requestForm?.content?.['area_chair_roles'] ?? ['Area_Chairs']
  const hasEthicsChairs =
    requestForm?.content?.['ethics_chairs_and_reviewers']?.includes('Yes')
  const reviewerRoles = requestForm?.content?.['reviewer_roles'] ?? ['Reviewers']
  return (
    <div className="row">
      <div className="col-md-4 col-xs-6">
        <h4>Venue Roles:</h4>
        <ul>
          <li>
            <Link href={`/group/edit?id=${programChairsId}`}>
              <a>Program Chairs</a>
            </Link>
          </li>
          {seniorAreaChairsId &&
            sacRoles.map((role) => {
              return (
                <li>
                  <Link href={`/group/edit?id=${venueId}/${role}`}>
                    <a>{prettyId(role)}</a>
                  </Link>
                  (
                  <Link href={`/group/edit?id=${venueId}/${role}/Invited`}>
                    <a>Invited</a>
                  </Link>
                  ,
                  <Link href={`/group/edit?id=${venueId}/${role}/Declined`}>
                    <a>Declined</a>
                  </Link>
                  )
                </li>
              )
            })}
          {areaChairsId &&
            acRoles.map((role) => {
              return (
                <li>
                  <Link href={`/group/edit?id=${venueId}/${role}`}>
                    <a>{prettyId(role)}</a>
                  </Link>
                  (
                  <Link href={`/group/edit?id=${venueId}/${role}/Invited`}>
                    <a>Invited</a>
                  </Link>
                  ,
                  <Link href={`/group/edit?id=${venueId}/${role}/Declined`}>
                    <a>Declined</a>
                  </Link>
                  )
                </li>
              )
            })}
          {hasEthicsChairs && (
            <>
              <li>
                <Link href={`/group/edit?id=${venueId}/Ethics_Chairs`}>
                  <a>Ethics_Chairs</a>
                </Link>
                (
                <Link href={`/group/edit?id=${venueId}/Ethics_Chairs/Invited`}>
                  <a>Invited</a>
                </Link>
                ,
                <Link href={`/group/edit?id=${venueId}/Ethics_Chairs/Declined`}>
                  <a>Declined</a>
                </Link>
                )
              </li>
              <li>
                <Link href={`/group/edit?id=${venueId}/Ethics_Reviewers`}>
                  <a>Ethics_Reviewers</a>
                </Link>
                (
                <Link href={`/group/edit?id=${venueId}/Ethics_Reviewers/Invited`}>
                  <a>Invited</a>
                </Link>
                ,
                <Link href={`/group/edit?id=${venueId}/Ethics_Reviewers/Declined`}>
                  <a>Declined</a>
                </Link>
                )
              </li>
            </>
          )}
          {reviewerRoles.map((role) => {
            return (
              <li>
                <Link href={`/group/edit?id=${venueId}/${role}`}>
                  <a>{prettyId(role)}</a>
                </Link>
                (
                <Link href={`/group/edit?id=${venueId}/${role}/Invited`}>
                  <a>Invited</a>
                </Link>
                ,
                <Link href={`/group/edit?id=${venueId}/${role}/Declined`}>
                  <a>Declined</a>
                </Link>
                )
              </li>
            )
          })}
          <li>
            <Link href={`/group/edit?id=${authorsId}`}>
              <a>Authors</a>
            </Link>
            (
            <Link href={`/group/edit?id=${authorsId}/Accepted`}>
              <a>Accepted</a>
            </Link>
            )
          </li>
        </ul>
      </div>
      {registrationForms && registrationForms.length !== 0 && (
        <div className="col-md-4 col-xs-6">
          <h4>Registration Forms:</h4>
          <ul>
            {registrationForms.map((form) => {
              return (
                <li>
                  <Link href={`/forum?id=${form.id}`}>
                    <a>{form.content.title}</a>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      )}
      {bidEnabled && (
        <div className="col-md-4 col-xs-6">
          <h4>Bids & Recommendations:</h4>
          <ul>
            <li>
              <Link href="TODO:edge browser url">
                <a>Reviewer Bids</a>
              </Link>
            </li>
            {seniorAreaChairsId && (
              <li>
                <Link href="TODO:edge browser url">
                  <a>Senior Area Chair Bids</a>
                </Link>
              </li>
            )}
            {areaChairsId && (
              <>
                <li>
                  <Link href="TODO:edge browser url">
                    <a>Area Chair Bid</a>
                  </Link>
                </li>
                {recommendationEnabled && (
                  <li>
                    <Link href="TODO:edge browser url">
                      <a>Area Chair Reviewer Recommendations</a>
                    </Link>
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

const OverviewTab = ({
  areaChairsId,
  seniorAreaChairsId,
  reviewersId,
  programChairsId,
  authorsId,
  bidEnabled,
  recommendationEnabled,
  paperReviewsCompleteThreshold,
  requestForm,
}) => {
  return (
    <>
      <RecruitmentStatsRow
        areaChairsId={areaChairsId}
        seniorAreaChairsId={seniorAreaChairsId}
      />
      <SubmissionsStatsRow />
      <BiddingStatsRow
        areaChairsId={areaChairsId}
        seniorAreaChairsId={seniorAreaChairsId}
        reviewersId={reviewersId}
        bidEnabled={bidEnabled}
        recommendationEnabled={recommendationEnabled}
      />
      <ReviewStatsRow paperReviewsCompleteThreshold={paperReviewsCompleteThreshold} />
      <MetaReviewStatsRow areaChairsId={areaChairsId} />
      <DecisionStatsRow />
      <DescriptionTimelineRow requestForm={requestForm} />
    </>
  )
}

const ProgramChairConsole = ({ appContext }) => {
  const {
    header,
    entity: group,
    venueId,
    apiVersion,
    areaChairsId,
    seniorAreaChairsId,
    reviewersId,
    programChairsId,
    authorsId,
    paperReviewsCompleteThreshold,
  } = useContext(WebFieldContext)
  const { setBannerContent } = appContext
  const { user, accessToken, userLoading } = useUser()
  const router = useRouter()
  const query = useQuery()
  const [activeTabId, setActiveTabId] = useState('venue-configuration')

  const loadData = async () => {
    try {
      // #region getInvitationMap
      const conferenceInvitationsP = api.getAll(
        '/invitations',
        {
          prefix: `${venueId}/-/.*`,
          expired: true,
          type: 'all',
        },
        { accessToken, version: apiVersion }
      )
      const reviewerInvitationsP = api.getAll(
        '/invitations',
        {
          prefix: `${reviewersId}/-/.*`,
          expired: true,
          type: 'all',
        },
        { accessToken, version: apiVersion }
      )
      const acInvitationsP = areaChairsId
        ? api.getAll(
            '/invitations',
            {
              prefix: `${areaChairsId}/-/.*`,
              expired: true,
              type: 'all',
            },
            { accessToken, version: apiVersion }
          )
        : Promise.resolve([])
      const sacInvitationsP = seniorAreaChairsId
        ? api.getAll(
            '/invitations',
            {
              prefix: `${seniorAreaChairsId}/-/.*`,
              expired: true,
              type: 'all',
            },
            { accessToken, version: apiVersion }
          )
        : Promise.resolve([])
      const invitationResults = await Promise.all([
        conferenceInvitationsP,
        reviewerInvitationsP,
        acInvitationsP,
        sacInvitationsP,
      ])
      console.log('invitationResults', invitationResults)
      // #endregion
    } catch (error) {
      promptError(`loading data: ${error.message}`)
    }
  }

  useEffect(() => {
    if (!query) return

    if (query.referrer) {
      setBannerContent(referrerLink(query.referrer))
    } else {
      setBannerContent(venueHomepageLink(venueId))
    }
  }, [query, venueId])

  useEffect(() => {
    if (!userLoading && (!user || !user.profile || user.profile.id === 'guest')) {
      router.replace(
        `/login?redirect=${encodeURIComponent(
          `${window.location.pathname}${window.location.search}${window.location.hash}`
        )}`
      )
    }
  }, [user, userLoading])

  useEffect(() => {
    if (userLoading || !user || !group || !venueId) return
    loadData()
  }, [user, userLoading, group])

  return (
    <>
      <BasicHeader title={header?.title} instructions={header.instructions} />
      <Tabs>
        <TabList>
          <Tab id="venue-configuration" active>
            Overview
          </Tab>
          <Tab id="paper-status" onClick={() => setActiveTabId('paper-status')}>
            Paper Status
          </Tab>
          {areaChairsId && (
            <Tab id="areachair-status" onClick={() => setActiveTabId('areachair-status')}>
              Area Chair Status
            </Tab>
          )}
          {seniorAreaChairsId && (
            <Tab
              id="seniorareachair-status"
              onClick={() => setActiveTabId('seniorareachair-status')}
            >
              Senior Area Chair Status
            </Tab>
          )}
          <Tab id="reviewer-status" onClick={() => setActiveTabId('reviewer-status')}>
            Reviewer Status
          </Tab>
          <Tab
            id="deskrejectwithdrawn-status"
            onClick={() => setActiveTabId('deskrejectwithdrawn-status')}
          >
            Desk Rejected/Withdrawn Papers
          </Tab>
        </TabList>

        <TabPanels>
          <TabPanel id="venue-configuration">
            {/* <OverviewTab
              areaChairsId={areaChairsId}
              seniorAreaChairsId={seniorAreaChairsId}
              reviewersId={reviewersId}
              bidEnabled={bidEnabled}
              recommendationEnabled={recommendationEnabled}
              paperReviewsCompleteThreshold={paperReviewsCompleteThreshold}
            /> */}
          </TabPanel>
          <TabPanel id="paper-status">{activeTabId === 'paper-status' && <>2</>}</TabPanel>
          {areaChairsId && activeTabId === 'areachair-status' && (
            <TabPanel id="areachair-status">
              <>3</>
            </TabPanel>
          )}
          {seniorAreaChairsId && activeTabId === 'seniorareachair-status' && (
            <TabPanel id="seniorareachair-status">
              <>4</>
            </TabPanel>
          )}
          <TabPanel id="reviewer-status">
            {activeTabId === 'reviewer-status' && <>5</>}
          </TabPanel>
          <TabPanel id="deskrejectwithdrawn-status">
            {activeTabId === 'deskrejectwithdrawn-status' && <>6</>}
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  )
}

export default ProgramChairConsole
