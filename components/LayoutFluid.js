import Head from 'next/Head'
import Nav from './Nav'
import FooterMinimal from './FooterMinimal'
import Banner from './Banner'

const LayoutFluid = ({ children, title }) => (
  <>
    <Head>
      <title>{title} | OpenReview</title>
    </Head>

    <Nav user={null} />
    <Banner hidden={false} />

    <main id="content">
      {children}
    </main>

    <FooterMinimal />
  </>
)

export default LayoutFluid
