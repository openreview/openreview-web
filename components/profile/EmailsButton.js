const EmailsButton = ({
  type, emailObj, handleRemove, handleConfirm, handleMakePreferred,
}) => {
  const {
    confirmed, preferred, email, isValid,
  } = emailObj

  if (type === 'confirmed') {
    if (confirmed) {
      return (
        <td className="confirm-cell">
          <div className="confirmed hint">(Confirmed)</div>
        </td>
      )
    }
    if (email && isValid) {
      return (
        <td className="confirm-cell">
          <button type="button" className="btn confirm-button" onClick={handleConfirm}>Confirm</button>
        </td>
      )
    }
    return null
  }

  if (type === 'remove' && !confirmed && email && isValid) {
    return <button type="button" className="btn" onClick={handleRemove}>Remove</button>
  }

  if (type === 'preferred') {
    if (preferred) {
      return (
        <td className="preferred-cell">
          <div className="preferred hint">(Preferred Email)</div>
        </td>
      )
    }
    if (confirmed) {
      return (
        <td className="preferred-cell">
          <button type="button" className="btn preferred-button" onClick={handleMakePreferred}>Make Preferred</button>
        </td>
      )
    }
  }
  return null
}

export default EmailsButton
