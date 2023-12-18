import { convertToStringArray } from '../../lib/webfield-utils'
import styles from '../../styles/components/TagsWidget.module.scss'
import Tag from './Tag'

const TagsWidget = ({ values }) => {
  const valuesArray = convertToStringArray(values, true)
  if (!valuesArray) return null

  return (
    <div className={styles.container}>
      {valuesArray.map((value, index) => (
        <Tag key={index} value={value} />
      ))}
    </div>
  )
}

export default TagsWidget
