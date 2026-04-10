// --- Shared color palette ---

export const colors = {
  orRed: '#8c1b13',
  subtleGray: '#616161',
  textMuted: '#757575',
  mediumDarkBlue: '#3f6978',
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
  },
  formButton: {
    fontWeight: 'bold',
    fontSize: '0.75rem',
    padding: '2px 10px',
    lineHeight: '1.125rem',
  },
}
