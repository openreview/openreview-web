import CommonLayout from '../../CommonLayout'
import LoadingSpinner from '../../../components/LoadingSpinner'

export default function Loading() {
  return (
    <CommonLayout banner={null}>
      <LoadingSpinner />
    </CommonLayout>
  )
}
