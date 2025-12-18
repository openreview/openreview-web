import { Select as AntdSelect } from 'antd'
import styles from '../styles/components/Select.module.scss'

const Select = ({ options = [], value, onChange }) => {
  return (
    <AntdSelect
      classNames={{ root: styles.select, popup: { root: styles.popupRoot } }}
      defaultValue={value}
      options={options}
      onChange={onChange}
    ></AntdSelect>
  )
}

export default Select
