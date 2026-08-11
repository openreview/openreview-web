import Link from 'next/link'
import { Flex } from 'antd'
import styles from './FooterMinimal.module.scss'

const FooterMinimal = () => (
  <footer>
    <div className={styles.minimal}>
      <Flex justify="center">
        <p className={styles.text}>
        &copy; {new Date().getFullYear()} OpenReview &nbsp;&nbsp;&bull;&nbsp;&nbsp;
        <Link href="/legal/terms" className={styles.link}>
          Terms of Use
        </Link>
        &nbsp;&nbsp;&bull;&nbsp;&nbsp;
        <Link href="/legal/privacy" className={styles.link}>
          Privacy Policy
        </Link>
        </p>
      </Flex>
    </div>
  </footer>
)

export default FooterMinimal
