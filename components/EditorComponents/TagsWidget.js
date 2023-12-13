import styles from '../../styles/components/TagsWidget.module.scss'
import Tag from './Tag'

const TagsWidget = ({ values }) => {
  if (!Array.isArray(values)) return null

  return (
    <div className={styles.container}>
      {values.map((value, index) => (
        <Tag key={index} value={value} />
      ))}
    </div>
  )
}

export default TagsWidget
