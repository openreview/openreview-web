import { Button } from 'antd'
import LoadingIcon from '../LoadingIcon'

import styles from './ProfileEditorActions.module.scss'

export default function ProfileEditorActions({
  mode,
  loading,
  submitLabel,
  cancelLabel,
  showCancel,
  onNext,
  onSubmit,
  onCancel,
}) {
  return (
    <div className={styles.actions}>
      {mode === 'next' ? (
        <Button type="primary" onClick={onNext}>
          Next Section
        </Button>
      ) : (
        <>
          <Button
            type="primary"
            iconPlacement="end"
            loading={loading ? { icon: <LoadingIcon /> } : false}
            onClick={onSubmit}
          >
            {submitLabel}
          </Button>
          {showCancel && <Button onClick={onCancel}>{cancelLabel}</Button>}
        </>
      )}
    </div>
  )
}
