const LoadingSpinner = ({ inline, text = 'Loading', extraClass }) => (
  <div className={`spinner-container ${inline ? 'spinner-inline' : ''}`}>
    <div className={`spinner ${extraClass}`}>
      <div className="rect1" />
      <div className="rect2" />
      <div className="rect3" />
      <div className="rect4" />
      <div className="rect5" />
    </div>
    <span>{text}</span>
  </div>
)

export default LoadingSpinner
