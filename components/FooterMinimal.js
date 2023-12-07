import Link from 'next/link'

const FooterMinimal = () => (
  <footer className="container minimal">
    <div className="row">
      <div className="col-xs-12">
        <p className="text-center">
          &copy; 2023 OpenReview.net &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          <Link href="/legal/terms">Terms of Use</Link>
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          <Link href="/legal/privacy">Privacy Policy</Link>
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          <Link href="https://github.com/openreview/openreview-web">Source Code</Link>
        </p>
      </div>
    </div>
  </footer>
)

export default FooterMinimal
