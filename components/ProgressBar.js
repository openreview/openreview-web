import { useEffect, useState } from 'react'
import useInterval from '../hooks/useInterval'

const ProgressBar = ({
  animated = true,
  striped = true,
  now = 0,
  statusCheckFn = null,
  variant = null,
}) => {
  const [progress, setProgress] = useState(now)
  const className = `progress-bar${striped ? ' progress-bar-striped' : ''}${animated ? ' active' : ''}${variant ? ` progress-bar-${variant}` : ''}`

  useEffect(() => {
    setProgress(now)
  }, [now])

  useInterval(() => {
    if (statusCheckFn) statusCheckFn()
  }, 2000)

  return (
    <div className="progress">
      <div
        className={className}
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin="0"
        aria-valuemax="100"
        style={{ width: `${progress}%` }}
      >
        <span className="sr-only">{`${progress}% Complete`}</span>
      </div>
    </div>
  )
}

export default ProgressBar
