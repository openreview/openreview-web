import { Button } from 'antd'

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
          <Button type="primary" loading={loading} onClick={onSubmit}>
            {submitLabel}
          </Button>
          {showCancel && <Button onClick={onCancel}>{cancelLabel}</Button>}
        </>
      )}
    </div>
  )
}
