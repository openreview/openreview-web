import { useEffect, useState } from 'react'
import { prettyInvitationId } from '../../lib/utils'

export const BidScore = ({ scoreEdge }) => {
  if (!scoreEdge) return null
  return (
    <div className="tag-widget text " data-type="text">
      <form className="form-inline">
        <label>{prettyInvitationId(scoreEdge.invitation)}</label>
        <span className="current-value">{scoreEdge.weight}</span>
      </form>
    </div>
  )
}

export const BidRadioButtonGroup = ({
  label,
  options,
  selectedBidOption,
  updateBidOption,
  bidUpdateStatus,
  className,
}) => {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(false)
  }, [selectedBidOption, bidUpdateStatus])

  return (
    <div className={`tag-widget edge-widget ${className ?? ''}`} data-type="radio">
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label>{label}:</label>

      <div
        className={`btn-group btn-group-xs${isLoading ? ' disabled' : ''}`}
        role="group"
        data-toggle="buttons"
      >
        {options.map((option) => (
          <label
            key={option}
            className={`btn btn-default radio-toggle${
              option === selectedBidOption ? ' active' : ''
            }`}
            onClick={() => {
              setIsLoading(true)
              updateBidOption(option)
            }}
          >
            <input
              type="radio"
              name="tag-options"
              autoComplete="off"
              checked={option === selectedBidOption || null}
            />
            {option}
          </label>
        ))}
      </div>
    </div>
  )
}
