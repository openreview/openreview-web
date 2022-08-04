// modified from noteReviewStatus.hbs handlebar template

import Link from 'next/link'

// modified from noteReviewStatus.hbs handlebar template
// eslint-disable-next-line import/prefer-default-export
export const ReviewerConsoleNoteReviewStatus = ({
  editUrl,
  paperRating,
  review,
  invitationUrl,
}) => (
  <div>
    {editUrl ? (
      <>
        <h4>Your Ratings:</h4>
        <p>{paperRating}</p>
        <h4>Your Review:</h4>
        <p>{review}</p>
        <p>
          <Link href={editUrl}>
            <a>Edit Official Review</a>
          </Link>
        </p>
      </>
    ) : (
      invitationUrl && (
        <h4>
          <Link href={invitationUrl}>
            <a>Submit Official Review</a>
          </Link>
        </h4>
      )
    )}
  </div>
)

// modified from noteReviewers.hbs handlebar template
export const AcConsoleNoteReviewStatus = ({ reviewers, officialReviews }) => {
  return (
    <div className="reviewer-progress">
      <h4>
        {officialReviews.length} of {reviewers.length} Reviews Submitted
      </h4>
    </div>
  )
}
{
  /* <div id="{{paperNumber}}-reviewer-progress" class="reviewer-progress" data-paper-forum="{{noteId}}">
  <h4>{{numSubmittedReviews}} of {{numReviewers}} Reviews Submitted</h4>
  {{#if numSubmittedRecommendations}}<h4>{{numSubmittedRecommendations}} of {{numReviewers}} Recommendations Submitted</h4>{{/if}}

  {{#if enableReviewerReassignment}}
    <a href="#{{noteId}}-reviewers" class="collapse-btn{{#unless expandReviewerList}} collapsed{{/unless}}" role="button" data-toggle="collapse" aria-expanded="{{#if expandReviewerList}}true{{else}}false{{/if}}">{{#if expandReviewerList}}Hide reviewers{{else}}Show reviewers{{/if}}</a>
  {{else}}
    {{#unless (isEmpty reviewers)}}
      <a href="#{{noteId}}-reviewers" class="collapse-btn{{#unless expandReviewerList}} collapsed{{/unless}}" role="button" data-toggle="collapse" aria-expanded="{{#if expandReviewerList}}true{{else}}false{{/if}}">{{#if expandReviewerList}}Hide reviewers{{else}}Show reviewers{{/if}}</a>
    {{/unless}}
  {{/if}}
  <div id="{{noteId}}-reviewers" class="collapse{{#if expandReviewerList}} in{{/if}}">
    <table class="table table-condensed table-minimal">
      <tbody>
        {{#each reviewers as |user reviewerNum|}}
          <tr>
            <td style="width: 40px;"><strong>{{reviewerNum}}</strong></td>
            <td>
              {{user.name}} <span class="text-muted">&lt;{{user.email}}&gt;</span>
              {{#if user.status}}
                {{#each user.status as |value name|}}
                  <br>
                  {{name}}: {{value}}
                {{/each}}
              {{/if}}
              {{#if user.completedReview}}
                {{#if user.preliminary_rating}}<br>Rating preliminary: {{user.preliminary_rating}}|final: {{user.rating}}{{else}}{{#if user.rating}}<br>Rating: {{user.rating}}{{/if}}{{/if}}{{#if user.confidence}} / Confidence: {{user.confidence}}{{/if}}
                {{#if user.reviewLength}}<br>Review length: {{user.reviewLength}} / {{/if}}{{#if user.ranking}}Ranking: {{user.ranking}}{{/if}}
                <br>
                <a href="/forum?id={{user.forum}}&noteId={{user.note}}{{#if ../referrer}}&referrer={{../referrer}}{{/if}}" target="_blank">Read Review</a>
              {{else}}
                <br>
                {{#if ../enableReviewerReassignment}}
                  <a href="#" class="unassign-reviewer-link" data-paper-forum="{{user.forum}}" data-user-id="{{user.id}}" data-paper-number="{{user.paperNumber}}" data-reviewer-number="{{reviewerNum}}">Unassign</a>
                  {{#if ../sendReminder}} &nbsp;&bull;&nbsp;{{/if}}
                {{/if}}
                {{#if ../sendReminder}}
                  <a href="#" class="send-reminder-link" data-user-id="{{user.id}}" data-forum-url="{{{user.forumUrl}}}">Send Reminder</a>
                  {{#if user.lastReminderSent}}(Last sent: {{user.lastReminderSent}}){{/if}}
                {{/if}}
              {{/if}}
              {{#if ../showActivityModal}}
                <br>
                <a href="#" class="show-activity-modal" data-paper-num="{{../paperNumber}}" data-reviewer-num="{{reviewerNum}}" data-reviewer-name="{{user.name}}" data-reviewer-email="{{user.email}}">Show Reviewer Activity</a>
              {{/if}}
            </td>
          </tr>
        {{/each}}
      </tbody>
    </table>
    {{#if enableReviewerReassignment}}
      <div id="{{paperNumber}}-add-reviewer" class="div-add-reviewer"></div>
    {{/if}}
  </div>

  <div>
    {{#each stats as |values name|}}
      <br>
      <strong>Average {{name}}:</strong> {{values.avg}} (Min: {{values.min}}, Max: {{values.max}})
    {{/each}}
    {{#isnt averageRating undefined}}
      <br>
      <strong>Average Rating:</strong> {{averageRating}} (Min: {{minRating}}, Max: {{maxRating}})
    {{/isnt}}
    {{#isnt averageConfidence undefined}}
      <br>
      <strong>Average Confidence:</strong> {{averageConfidence}} (Min: {{minConfidence}}, Max: {{maxConfidence}})
    {{/isnt}}
    {{#isnt forumReplyCount undefined}}
      <br>
      <strong>Number of Forum replies:</strong> {{forumReplyCount}}
    {{/isnt}}
  </div>

  <div>
    {{#each actions}}
      <br>
      <a href="{{url}}{{#if ../referrer}}&referrer={{../referrer}}{{/if}}" target="_blank">{{name}}</a>
    {{/each}}
  </div>
</div>
 */
}
