/* eslint-disable max-len */

import Head from 'next/head'
import Link from 'next/link'

const Terms = () => (
  <div>
    <Head>
      <title key="title">Terms & Conditions | OpenReview</title>
    </Head>

    <div className="row">
      <div className="col-xs-12 col-md-10 col-md-offset-1">
        <h1>Terms &amp; Conditions</h1>
      </div>
    </div>

    <div className="row">
      <div className="col-xs-12 col-md-10 col-md-offset-1">
        <p className="text-muted">Last updated: May 24, 2022</p>
        <p>
          Please read these Terms and Conditions (&quot;Terms&quot;, &quot;Terms and
          Conditions&quot;) carefully before using the https://openreview.net website (the
          &quot;Service&quot;) operated by OpenReview (&quot;us&quot;, &quot;we&quot;, or
          &quot;our&quot;).
        </p>
        <p>
          Your access to and use of the Service is conditioned on your acceptance of and
          compliance with these Terms. These Terms apply to all visitors, users and others who
          access or use the Service.
        </p>
        <p>
          By accessing or using the Service you agree to be bound by these Terms. If you
          disagree with any part of the terms then you may not access the Service.
        </p>

        <h3>Requirements for Global Access</h3>
        <p>
          By accessing or using the Service, you agree and represent to OpenReview.net that: i)
          you are not acting, directly or indirectly, on behalf of the Governments of Iran,
          Syria, Cuba, or any other jurisdiction subject to comprehensive economic sanctions by
          the United States, or any political subdivision, agency or instrumentality thereof
          (other than academic and research institutions whose primary function is research
          and/or teaching and their personnel); (ii) you are not a person sanctioned under any
          of the sanctions programs administered by the Office of Foreign Assets Control of the
          United States Department of the Treasury (OFAC) and are not listed or identified on
          the List of Specially Designated Nationals and Blocked Persons or other sanctions
          lists administered by OFAC; and (iii) if you reside in or are a national of a
          jurisdiction subject to comprehensive economic sanctions by the United States, you
          are accessing or using the Service solely to access informational materials or engage
          in publishing activities, as such terms are defined and authorized by general
          licenses issued by OFAC.
        </p>

        <h3>Accounts</h3>
        <p>
          When you create an account with us, you must provide us information that is accurate,
          complete, and current at all times. Failure to do so constitutes a breach of the
          Terms, which may result in immediate termination of your account on our Service.
        </p>
        <p>
          You are responsible for safeguarding the password that you use to access the Service
          and for any activities or actions under your password, whether your password is with
          our Service or a third-party service.
        </p>
        <p>
          You agree not to disclose your password to any third party. You must notify us
          immediately upon becoming aware of any breach of security or unauthorized use of your
          account.
        </p>

        <h3>Links To Other Web Sites</h3>
        <p>
          Our Service may contain links to third-party web sites or services that are not owned
          or controlled by OpenReview.
        </p>
        <p>
          OpenReview has no control over, and assumes no responsibility for, the content,
          privacy policies, or practices of any third party web sites or services. You further
          acknowledge and agree that OpenReview shall not be responsible or liable, directly or
          indirectly, for any damage or loss caused or alleged to be caused by or in connection
          with use of or reliance on any such content, goods or services available on or
          through any such web sites or services.
        </p>
        <p>
          We strongly advise you to read the terms and conditions and privacy policies of any
          third-party web sites or services that you visit.
        </p>

        <h3>Termination</h3>
        <p>
          We may terminate or suspend access to our Service immediately, without prior notice
          or liability, for any reason whatsoever, including without limitation if you breach
          the Terms.
        </p>
        <p>
          All provisions of the Terms which by their nature should survive termination shall
          survive termination, including, without limitation, ownership provisions, warranty
          disclaimers, indemnity and limitations of liability.
        </p>
        <p>
          We may terminate or suspend your account immediately, without prior notice or
          liability, for any reason whatsoever, including without limitation if you breach the
          Terms.
        </p>
        <p>
          Upon termination, your right to use the Service will immediately cease. If you wish
          to terminate your account, you may simply discontinue using the Service.
        </p>
        <p>
          All provisions of the Terms which by their nature should survive termination shall
          survive termination, including, without limitation, ownership provisions, warranty
          disclaimers, indemnity and limitations of liability.
        </p>

        <h3>Governing Law</h3>
        <p>
          These Terms shall be governed and construed in accordance with the laws of
          Massachusetts, United States, without regard to its conflict of law provisions.
        </p>
        <p>
          Our failure to enforce any right or provision of these Terms will not be considered a
          waiver of those rights. If any provision of these Terms is held to be invalid or
          unenforceable by a court, the remaining provisions of these Terms will remain in
          effect. These Terms constitute the entire agreement between us regarding our Service,
          and supersede and replace any prior agreements we might have between us regarding the
          Service.
        </p>

        <h3>Changes</h3>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any
          time. If a revision is material we will try to provide at least 30 days notice prior
          to any new terms taking effect. What constitutes a material change will be determined
          at our sole discretion.
        </p>
        <p>
          By continuing to access or use our Service after those revisions become effective,
          you agree to be bound by the revised terms. If you do not agree to the new terms,
          please stop using the Service.
        </p>

        <h3>Contact Us</h3>
        <p>
          If you have any questions about these Terms, please{' '}
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

Terms.bodyClass = 'terms'

export default Terms
