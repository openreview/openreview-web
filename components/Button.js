import styles from '../styles/components/Button.module.scss'
import { Button as AntdButton } from 'antd'

const Button = ({ children, onClick, size, type }) => {
  return (
    <AntdButton className={styles.button} size={size} onClick={onClick} type={type}>
      {children}
    </AntdButton>
  )
}

export default Button
