import React from 'react'

const LoadingSpinner = ({ inline }) => (
  <div className={`spinner-container ${inline ? 'spinner-inline' : ''}`}>
    <div className="spinner">
      <div className="rect1"></div>
      <div className="rect2"></div>
      <div className="rect3"></div>
      <div className="rect4"></div>
      <div className="rect5"></div>
    </div>
    <span>Loading</span>
  </div>
)

export default LoadingSpinner
