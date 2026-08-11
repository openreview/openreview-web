import Icon from '@ant-design/icons'

import styles from './LoadingIcon.module.css'

const Spinner = () => (
  <span className={styles.container}>
    <span className={styles.bar} />
    <span className={styles.bar} />
    <span className={styles.bar} />
    <span className={styles.bar} />
  </span>
)

const LoadingIcon = (props) => <Icon component={Spinner} {...props} />

export default LoadingIcon
