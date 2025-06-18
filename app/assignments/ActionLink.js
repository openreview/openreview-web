import Link from 'next/link'
import Icon from '../../components/Icon'

export default function ActionLink({ label, className, iconName, href, onClick, disabled }) {
  if (href) {
    return (
      <Link href={href} className={`action-link ${className || ''}`} disabled={disabled}>
        <Icon name={iconName} />
        {label}
      </Link>
    )
  }

  return (
    <button
      type="button"
      className={`btn btn-link ${className || ''}`}
      onClick={onClick}
      disabled={disabled}
    >
      <Icon name={iconName} />
      {label}
    </button>
  )
}
