/* eslint-disable jsx-a11y/anchor-is-valid */

import { prettyId } from '../../lib/utils'

export default function EdgeBrowserHeader({ invitation }) {
  if (!invitation) {
    return null
  }

  return (
    <div className="explore-header">
      <div className="container">
        <div className="row">
          <div className="col-xs-12">
            <h1 id="matching-title">
              {`${prettyId(invitation.id)} ${invitation.query.label ? ` – ${invitation.query.label}` : ''}`}
            </h1>
          </div>

          <div className="col-sm-2 text-right" style={{ display: 'none' }}>
            <div className="btn-group">
              <button
                type="button"
                className="btn btn-default dropdown-toggle"
                data-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                Actions
                {' '}
                <span className="caret" />
              </button>
              <ul className="dropdown-menu dropdown-align-right">
                <li>
                  <a href="#" data-toggle="modal" data-target="#assignment-parameters-modal">
                    View Assignment Parameters
                  </a>
                </li>
                <li>
                  <a href="#" className="view-locks">View Locked Assignments</a>
                </li>
                <li>
                  <a href="#" className="view-breaks">View Vetoed Assignments</a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
