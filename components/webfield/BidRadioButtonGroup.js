import { useEffect, useState } from 'react'

const BidRadioButtonGroup = ({ options, selectedBidOption, updateBidOption }) => {
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

export default BidRadioButtonGroup
