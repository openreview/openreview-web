import LoadingSpinner from '../LoadingSpinner'

const ScalarStat = ({ value, name }) => (
  <div className="stat-scalar">
    {typeof value === 'undefined' ? (
      <LoadingSpinner inline text={null} />
    ) : (
      <div className="stat-val">{value}</div>
    )}
    <div className="stat-name">{name}</div>
  </div>
)

export default ScalarStat
