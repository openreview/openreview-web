import Link from 'next/link'

const FooterMinimal = () => (
  <footer className="container minimal">
    <div className="row">
      <div className="col-xs-12">
        <p className="text-center">
          &copy; 2023 OpenReview.net &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          <Link href="/legal/terms">
            <a>Terms &amp; Conditions</a>
          </Link>
          &nbsp;&nbsp;&bull;&nbsp;&nbsp;
          <Link href="/legal/privacy">
            <a>Privacy Policy</a>
          </Link>
        </p>
      </div>
    </div>
  </footer>
)

export default FooterMinimal
