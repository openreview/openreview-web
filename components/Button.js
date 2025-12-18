import styles from '../styles/components/Button.module.scss'
import { Button as AntdButton } from 'antd'

const Button = ({ children, onClick, size }) => {
  return (
    <AntdButton className={styles.button} size={size} onClick={onClick}>
      {children}
    </AntdButton>
  )
}

export default Button
