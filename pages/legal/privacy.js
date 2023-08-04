import Head from 'next/head'
import Link from 'next/link'

const Privacy = () => (
  <div>
    <Head>
      <title key="title">Privacy Policy | OpenReview</title>
    </Head>

    <div className="row">
      <div className="col-xs-12 col-md-10 col-md-offset-1">
        <h1>Privacy Policy</h1>
      </div>
    </div>

    <div className="row">
      <div className="col-xs-12 col-md-10 col-md-offset-1">
        <p className="text-muted">Last updated: March 1, 2017</p>
        <p>
          OpenReview (&quot;us&quot;, &quot;we&quot;, or &quot;our&quot;) operates
          https://openreview.net (the &quot;Site&quot;). This page informs you of our policies
          regarding the collection, use and disclosure of Personal Information we receive from
          users of the Site.
        </p>
        <p>
          We use your Personal Information only for providing and improving the Site. By using
          the Site, you agree to the collection and use of information in accordance with this
          policy.
        </p>

        <h3>Information Collection And Use</h3>
        <p>
          While using our Site, we may ask you to provide us with certain personally
          identifiable information that can be used to contact or identify you. Personally
          identifiable information may include, but is not limited to your name (&quot;Personal
          Information&quot;).
        </p>

        <h3>Log Data</h3>
        <p>
          Like many site operators, we collect information that your browser sends whenever you
          visit our Site (&quot;Log Data&quot;).
        </p>
        <p>
          This Log Data may include information such as your computer&apos;s Internet Protocol
          (&quot;IP&quot;) address, browser type, browser version, the pages of our Site that
          you visit, the time and date of your visit, the time spent on those pages and other
          statistics.
        </p>
        <p>
          In addition, we may use third party services such as Google Analytics that collect,
          monitor and analyze this data. The data collected by these sites is solely used
          internally to improve the site and is never shared.
        </p>

        <h3>Cookies</h3>
        <p>
          Cookies are files with small amount of data, which may include an anonymous unique
          identifier. Cookies are sent to your browser from a web site and stored on your
          computer&apos;s hard drive.
        </p>
        <p>
          Like many sites, we use &quot;cookies&quot; to collect information. You can instruct
          your browser to refuse all cookies or to indicate when a cookie is being sent.
          However, if you do not accept cookies, you may not be able to use some portions of
          our Site.
        </p>

        <h3>Security</h3>
        <p>
          The security of your Personal Information is important to us, but remember that no
          method of transmission over the Internet, or method of electronic storage, is 100%
          secure. While we strive to use commercially acceptable means to protect your Personal
          Information, we cannot guarantee its absolute security.
        </p>

        <h3>Changes To This Privacy Policy</h3>
        <p>
          This Privacy Policy is effective as of 03/01/2017 and will remain in effect except
          with respect to any changes in its provisions in the future, which will be in effect
          immediately after being posted on this page.
        </p>
        <p>
          We reserve the right to update or change our Privacy Policy at any time and you
          should check this Privacy Policy periodically. Your continued use of the Service
          after we post any modifications to the Privacy Policy on this page will constitute
          your acknowledgment of the modifications and your consent to abide and be bound by
          the modified Privacy Policy.
        </p>
        <p>
          If we make any material changes to this Privacy Policy, we will notify you either
          through the email address you have provided us, or by placing a prominent notice on
          our website.
        </p>
        <p>
          If you have any questions about this Privacy Policy, please{' '}
          <Link href="/contact">
            contact us
          </Link>
          .
        </p>
        <br />
      </div>
    </div>
  </div>
)

Privacy.bodyClass = 'privacy'

export default Privacy
