// --- Shared color palette ---

export const colors = {
  orRed: '#8c1b13',
  subtleGray: '#616161',
  textMuted: '#757575',
  mediumBlue: '#3e6775',
  mediumDarkBlue: '#3f6978',
  darkBlue: '#2c3a4a',
  lightGray: '#c6c6c6',
}

const bootstrap337LabelColors = {
  success: '#5cb85c',
  warning: '#f0ad4e',
  error: '#d9534f',
  default: '#777',
}

export function getBootstrap337LabelColor(colorName) {
  return bootstrap337LabelColors[colorName] ?? bootstrap337LabelColors.default
}

/**
 * get label class for span tag to render profile state
 *
 * @param {string} state
 * @returns string
 */
export function getProfileStateLabelClass(state) {
  switch (state) {
    case 'Active Institutional':
    case 'Active Automatic':
    case 'Active':
      return 'success'

    case 'Needs Moderation':
    case 'Rejected':
      return 'warning'
    case 'Blocked':
    case 'Limited':
    case 'Deleted':
      return 'error'
    case 'Inactive':
    case 'Merged':
    default:
      return 'processing'
  }
}

// --- Profile page ---

export const profile = {
  editBadge: { fontSize: '0.75rem', color: '#aaa' },
  linkText: {
    marginLeft: '0.25rem',
    overflowX: 'hidden',
    textOverflow: 'ellipsis',
    display: 'inline',
  },
  geolocationIcon: {
    fontSize: '0.75rem',
    color: colors.mediumDarkBlue,
    marginLeft: '0.25rem',
  },
  relationVisibleIcon: {
    fontSize: '0.75rem',
    cursor: 'pointer',
    color: colors.subtleGray,
  },
}

// --- Profile editor steps (antd Steps, replacing rc-steps) ---

// Inherited body text color (Bootstrap default) used for the step number and
// description, matching the legacy rc-steps appearance.
const stepBodyTextColor = '#333'

// The connector line between steps is always light gray, regardless of status.
// Applied via the top-level `styles.itemRail` semantic prop so it overrides
// antd's status-driven rail color without targeting any `.ant-*` class.
export const profileEditorStepsRailStyle = { borderColor: colors.lightGray }

/**
 * Per-item semantic inline styles for antd Steps, chosen by step status, to
 * reproduce the legacy rc-steps look (custom icon circle + status colors).
 * Returned object maps to the StepItem `styles` semantic keys (icon/title/content)
 * and rides on inline styles so it wins over antd's higher-specificity defaults.
 *
 * @param {('wait'|'process'|'error')} status
 * @returns {{icon: object, title: object, content: object}}
 */
export function getProfileEditorStepItemStyles(status) {
  const isError = status === 'error'
  let icon
  switch (status) {
    case 'process':
      icon = { background: colors.orRed, borderColor: colors.lightGray, color: '#fff' }
      break
    case 'error':
      icon = { background: colors.orRed, borderColor: colors.orRed, color: '#fff' }
      break
    default:
      icon = {
        background: 'transparent',
        borderColor: colors.lightGray,
        color: stepBodyTextColor,
      }
  }
  return {
    icon,
    title: { color: isError ? colors.orRed : colors.darkBlue },
    content: { color: isError ? colors.orRed : stepBodyTextColor },
  }
}

// --- Invitation page ---

export const invitation = {
  descriptionsLabel: {
    fontWeight: 700,
    color: 'inherit',
    justifyContent: 'flex-end',
    width: 140,
    whiteSpace: 'nowrap',
  },
}
// Navbar legacy styles live in styles/components/legacy-bootstrap-nav.scss.
// Delete that file along with this entire module when accepting antd-native navbar styling.

// --- Forum page ---

export const forum = {
  replyInvitationButton: {
    fontSize: '0.75rem',
    backgroundColor: colors.mediumBlue,
    border: `2px solid ${colors.mediumDarkBlue}`,
  },
  replyInvitationButtonActive: {
    boxShadow: `0 0 0 1px ${colors.mediumDarkBlue}`,
  },
  replyInvitationButtonExpired: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    color: 'gray',
    borderColor: 'gray',
    textDecoration: 'line-through',
  },
}

// --- Moderation page ---

export const moderation = {
  filterForm: {
    marginTop: '1rem',
    marginBottom: '0.75rem',
    background: '#efece3',
    padding: '0.5rem',
    border: '1px solid rgba(0, 0, 0, 0.1)',
  },
  statusTag: {
    display: 'inline',
    padding: '0.2em 0.6em 0.3em',
    fontSize: '75%',
    fontWeight: 700,
    lineHeight: '26px',
    color: '#fff',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    verticalAlign: 'baseline',
    borderRadius: '0.25em',
  },
  actionButton: {
    fontWeight: '400',
    fontSize: '0.75rem',
    padding: '2px 10px',
    lineHeight: '1.125rem',
    border: `2px solid ${colors.mediumDarkBlue}`,
  },
  updateTermStampButton: {
    fontSize: '0.75rem',
    padding: '2px 10px',
    lineHeight: '1.125rem',
    border: `2px solid ${colors.mediumDarkBlue}`,
  },
  formInput: {
    fontSize: '0.75rem',
    lineHeight: '1.125rem',
    padding: '0.375rem 0.75rem',
  },
  formButton: {
    fontWeight: 'bold',
    fontSize: '0.75rem',
    padding: '2px 10px',
    lineHeight: '1.125rem',
  },
}
