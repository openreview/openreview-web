import { useEffect, useState } from 'react'
import { prettyInvitationId } from '../../lib/utils'

export const TagText = ({ scoreEdge }) => {
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

export const BidRadioButtonGroup = ({ options, selectedBidOption, updateBidOption }) => {
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(false)
  }, [selectedBidOption])

  return (
    <div className="tag-widget edge-widget" data-type="radio" data-id="">
      <label>Bid:</label>

      <div
        className={`btn-group btn-group-xs${isLoading ? ' disabled' : ''}`}
        role="group"
        data-toggle="buttons"
      >
        {options.map((option) => {
          return (
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
              <input type="radio" name="tag-options" autoComplete="off" /> {option}
            </label>
          )
        })}
      </div>
    </div>
  )
}
