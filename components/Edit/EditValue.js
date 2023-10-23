import { prettyContentValue, prettyId } from '../../lib/utils'
import Icon from '../Icon'

const EditValue = ({ name, value }) => {
  if (!Array.isArray(value)) {
    if (value instanceof Object) {
      return (
        <div className={name}>
          <span className="line_heading">{name}:</span> <pre>{prettyContentValue(value)}</pre>
        </div>
      )
    }
    return (
      <div className={name}>
        <span className="line_heading">{name}:</span>{' '}
        <span className="edit_value">{value}</span>
      </div>
    )
  }

  if (value.includes('everyone')) {
    return (
      <div className={name}>
        <span className="line_heading">{name}</span>{' '}
        <Icon name="globe" extraClasses="readers-icon" />{' '}
        <span className="edit_value">Everyone</span>
      </div>
    )
  }

  return (
    <div className={name}>
      <span className="line_heading">{name}:</span>{' '}
      <span className="edit_value">
        {value
          .map((p) => (
            <span key={p} title={p} data-toggle="tooltip" data-placement="top">
              {prettyId(p, true)}
            </span>
          ))
          .reduce((accu, elem) => (accu === null ? [elem] : [...accu, ', ', elem]), null)}
      </span>
    </div>
  )
}

export default EditValue
