const LoadingSpinner = ({ inline }) => (
  <div className={`spinner-container ${inline ? 'spinner-inline' : ''}`}>
    <div className="spinner">
      <div className="rect1" />
      <div className="rect2" />
      <div className="rect3" />
      <div className="rect4" />
      <div className="rect5" />
    </div>
    <span>Loading</span>
  </div>
)

export default LoadingSpinner
