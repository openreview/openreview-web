'use client'

import Link from 'next/link'

export default function Page() {
  return (
    <>
      <div className="row">
        <div className="col-xs-12 col-md-10 col-md-offset-1">
          <h1>OpenReview Terms of Use</h1>
        </div>
      </div>
      <div className="row">
        <div className="col-xs-12 col-md-10 col-md-offset-1">
          <p className="text-muted">Last updated: September 24, 2024</p>
          <p>
            These Terms of Use are a contract between you and OpenReview. OpenReview operates
            OpenReview.net and provides data, software and services, with the objective of
            supporting scientific communication, including scientific article submission,
            reviewing and discussion-making such communication accessible, organized, and
            useful. By using OpenReview or any data, products or services accessible from
            OpenReview sites (including the OpenReview API, as defined below) you agree to be
            bound by the following terms and conditions (&ldquo;Terms of Use&rdquo;) as well as
            the <Link href="/legal/privacy">OpenReview Privacy Policy</Link>. If you do not
            agree to these Terms of Use, do not visit or use the OpenReview System.
          </p>

          <h3>Definitions</h3>
          <p>&ldquo;Terms of Use&rdquo; is this document in its entirety.</p>
          <p>
            A &ldquo;User&rdquo; is a person who has used or is using the OpenReview System.
          </p>
          <p>A &ldquo;Group&rdquo; is a named collection of users.</p>
          <p>
            A &ldquo;Work&rdquo; (or &ldquo;Submission&rdquo;) is any media (for example, any
            collection of text, images, video, audio, or other data, and accompanying Metadata)
            submitted for deposit into the OpenReview Database.
          </p>
          <p>
            The &ldquo;OpenReview Database&rdquo; (or simply &ldquo;Database&rdquo;) is the
            storage medium for all Works, including associated Metadata, made available through
            the OpenReview API to the OpenReview.net Web Site and directly to other users of
            the API.
          </p>
          <p>
            The &ldquo;OpenReview API&rdquo; is a programmatic interface to the OpenReview
            Database, providing functionality for data upload, search, and download, according
            to the privacy and access control rules implemented by the software.
          </p>
          <p>
            The &ldquo;OpenReview Web Site&rdquo; is an HTML interface to the OpenReview API.
          </p>
          <p>
            The &ldquo;OpenReview System&rdquo; (or simply &ldquo;System&rdquo;) refers to the
            OpenReview Database, OpenReview API, OpenReview.net Web Site, all source code that
            implements these components, and source code for libraries, scripts, and tools that
            aid use of the OpenReview API and OpenReview.net Web Site.
          </p>
          <p>
            &ldquo;OpenReview&rdquo; is the legal entity responsible for the OpenReview System,
            governed by its Board members.
          </p>
          <p>An &ldquo;Author&rdquo; is a creator or co-creator of a Work.</p>
          <p>A &ldquo;Submitter&rdquo; is a User who uploads a Work to OpenReview.</p>
          <p>
            A &ldquo;Solicitor&rdquo; is the entity that solicited or invited a Work. In the
            OpenReview Database, the Solicitor associated with a Work is indicated by the
            &ldquo;signature&rdquo; field in the &ldquo;invitation&rdquo; through which the
            Work was submitted.
          </p>
          <p>
            A &ldquo;Venue&rdquo; is a Solicitor of a collection of Works for scientific
            communication, typically the editors of a journal, or program chairs of a
            conference or workshop, or the managers of a pre-print service, or the organizers
            of a reading group, moderators of a discussion group, or other Solicitors of
            similar contributions.
          </p>
          <p>
            &ldquo;Venue Organizers&rdquo; are the collection of people responsible for the
            Venue; in the OpenReview Database the Venue Organizers are the members of the Group
            whose name appears as the Solicitor of Works for the Venue.
          </p>
          <p>
            An &ldquo;Article&rdquo; is a Work that serves as an scientific publication,
            typically having one or more Authors, an abstract, a body, and references. In the
            OpenReview Database, an Article is designated as a Work having a
            &ldquo;venueid&rdquo; field.
          </p>
          <p>
            A &ldquo;Comment&rdquo; is a Work submitted in response to an Article or other
            Work, typically having one Author (although it may have multiple). In the
            OpenReview Database, a Comment is designated as a Work having a non-blank
            &ldquo;replyto&rdquo; field and no &ldquo;venueid&rdquo; field. Examples of
            Comments include tasked reviews, untasked reviews, meta reviews, discussion,
            remarks, chat messages, ratings, notes, and tags.
          </p>
          <p>
            A &ldquo;Profile&rdquo; is a collection of information about a &ldquo;User&rdquo;
            independent of Venue, such as name, contact information, institution, affiliation
            history, and other information useful for detecting conflicts of interest, or
            useful for measuring the suitability of assigning a User to review an Article.
          </p>
          <p>
            A &ldquo;Configuration Record&rdquo; is a Work that controls the configuration of
            OpenReview&rsquo;s or a Solicitor&rsquo;s workflow or user interface, and includes,
            records such as but not limited to data records about Venues, Venue configurations,
            Venue registrations, Venue schedules, Venue sponsors, Work submission invitations,
            Users, Groups of Users, Profiles, reviewer recruitment, reviewer registrations,
            reviewer assignments, indicators of acceptance or other status, event attributes,
            schedules, data processing scripts, and bi-connected records (also called
            &ldquo;edges&rdquo; in OpenReview). In the OpenReview Database, a Configuration
            Record is designated as a Work having no &ldquo;replyto&rdquo; field and no
            &ldquo;venueid&rdquo; field.
          </p>
          <p>
            An &ldquo;Edit&rdquo; to a Work is a change submitted for deposit into OpenReview,
            to be applied to the Work. (The Edit itself is also considered a Work according to
            the above definition of Work.) For example, an &ldquo;Article Edit&rdquo; is an
            Edit to an Article.
          </p>
          <p>
            &ldquo;Metadata&rdquo; is information about a Work, including an Article&rsquo;s
            title, Authors, Submitter, abstract, other summary, timestamps, license, and any
            other information in the Work other than its full-text body. Metadata also includes
            corresponding information in Comments, Configuration Records, Edits, and other
            Works.
          </p>
          <p>
            &ldquo;OpenReview Staff&rdquo; are OpenReview&rsquo;s employees, officers,
            directors, board members, and agents thereof, including independent contractors and
            volunteers under contract, and administrators including staff of Code for Science
            and Society. The terms &ldquo;we&rdquo; and &ldquo;us&rdquo; below refer to
            OpenReview Staff.
          </p>
          <p>
            &ldquo; OpenReview Editors &rdquo; are OpenReview Staff, plus Venue organizers and
            other Work Solicitors, and their designees such as action editors, area chairs,
            reviewers, Venue board members, ethics review board members, other similar Venue
            board members, and other people having similar responsibility for the content,
            organization and management of Venues.
          </p>
          <p>
            &ldquo; OpenReview Purpose &rdquo; is support of scientific communication,
            including scientific article submission, reviewing, discussion, and event
            coordination–making such communication accessible, organized, and useful.
            OpenReview Purpose also includes improvement of the OpenReview System in support of
            the above goals.
          </p>
          <p>
            &ldquo;You&rdquo; and &ldquo;your&rdquo; refers to a User agreeing to these Terms
            of Use, and other entities (such as organizations or co-Authors) whom the User
            warrants are represented by the User.
          </p>

          <h3>Submitter&rsquo;s Representations and Warranties</h3>
          <p>The Submitter of any Work makes the following representations and warranties:</p>
          <ul>
            <li>
              The Submitter is an original author of the Work, or a proxy authorized to act on
              behalf of the original Author(s).
            </li>
            <li>
              If the Work was created by multiple Authors, the Submitter warrants that all of
              them have consented to the submission of the Work to OpenReview and to these
              Terms of Use.
            </li>
            <li>
              The Submitter has the right to include any third-party materials used in the
              Work.
            </li>
            <li>
              The use of any third-party materials is consistent with scholarly and academic
              standards of proper citation and acknowledgement of sources.
            </li>
            <li>
              The Work is not subject to any agreement, license or other claim that could
              interfere with the rights granted herein.
            </li>
            <li>
              The distribution of the Work by OpenReview will not violate any rights of any
              person or entity, including without limitation any rights of copyright, patent,
              trade secret, privacy, or any other rights, and it contains no defamatory,
              obscene, or other unlawful matter.
            </li>
            <li>
              The Submitter has authority to make the statements, grant the rights, and take
              the actions described above.
            </li>
          </ul>
          <h3>Article License</h3>
          <p>
            OpenReview does not ask that copyright for submitted Articles or Article Edits be
            transferred to OpenReview. However, we require sufficient rights to allow us to
            distribute the Work in perpetuity.
          </p>
          <p>
            The Submitter grants to OpenReview upon submission of an Article or Article Edit a
            non-exclusive, perpetual, and royalty-free license to include the Work in the
            OpenReview Database and permit users to access, view, and make other uses of the
            work in a manner consistent with the OpenReview Purpose and operation of the
            OpenReview System (&ldquo;License&rdquo;). This License includes without limitation
            the right for OpenReview to reproduce (e.g., upload, backup, archive, preserve, and
            allow online access), distribute (e.g., allow access), make available, and prepare
            versions of the Work (e.g., abstracts, and metadata or text files, formats to
            support accessibility, machine-readable formats) in analog, digital, or other
            formats as OpenReview may deem appropriate. OpenReview may assign or transfer these
            rights to a successor or assignee, for example if OpenReview services move to
            another steward. These Terms of Service will be binding on, and inure to the
            benefit of permitted successors and assignees.
          </p>
          <p>
            This grant to OpenReview is a non-exclusive license and is not a grant of exclusive
            rights or a transfer of the copyright. The authors retain their copyright and may
            enter into publication agreements or other arrangements, so long as they do not
            conflict with the ability of OpenReview to exercise its rights under the License.
            OpenReview has no obligation to protect or enforce any copyright in the Work, and
            OpenReview has no obligation to respond to any permission requests or other
            inquiries regarding the copyright in or other uses of the Work.
          </p>
          <p>
            OpenReview asks that Venues and/or Authors indicate an Article&rsquo;s copyright
            license in the Article&rsquo;s &ldquo;license&rdquo; Database field, typically as a
            short name for well-known licenses (such as &ldquo;CC BY 4.0&rdquo;) or a URL to a
            webpage with unchanging license information. Venues or Authors submitting this
            &ldquo;license&rdquo; field warrant that the associated Article is indeed released
            under the indicated license. OpenReview further encourages use of Creative Commons
            licenses. When no &ldquo;license&rdquo; field is present in an Article, the way to
            find out the license is to contact the associated Venue or Authors to ask for
            license information.
          </p>
          <p>
            Note that some OpenReview Venues allow preprints or anonymous submissions. If the
            authors wish to later submit the same Article to another Venue, journal,
            conference, or other publisher, it is the responsibility of the Submitter to ensure
            that the license associated with the OpenReview-submitted Article is compatible
            with the requirements of the later publisher.
          </p>

          <h3>Comment and Configuration Record License</h3>
          <p>
            By submitting a Comment or Configuration Record (and their accompanying Edits) to
            OpenReview the Submitter agrees that it shall be released to the public under the{' '}
            <a
              href="http://creativecommons.org/licenses/by/4.0/"
              target="_blank"
              rel="nofollow no referrer"
            >
              Creative Commons Attribution 4.0 International (CC BY 4.0)
            </a>{' '}
            license. By agreeing to these Terms of Use, Submitters also retroactively apply
            this license to such Comments and Configuration Records they submitted in the past.
            (Note that this license does not imply that all Comments or Configuration Records
            are publicly readable through the OpenReview API; the readability of any Work is
            determined by its &ldquo;readers&rdquo; and &ldquo;nonreaders&rdquo; fields in the
            OpenReview Database, which in turn may be controlled by those with write permission
            to the Work, typically the Authors and/or Solicitors of the Work.)
          </p>

          <h3>Metadata Dedication</h3>
          <p>
            To the extent that the Submitter or OpenReview has a copyright interest in metadata
            associated with a Work, a{' '}
            <a
              href="http://creativecommons.org/publicdomain/zero/1.0"
              target="_blank"
              rel="nofollow no referrer"
            >
              Creative Commons Public Domain Dedication (CC0 1.0)
            </a>{' '}
            will apply.
          </p>

          <h3>Waiver of Rights regarding Submissions</h3>
          <p>
            Users waive the following claims, on behalf of themselves and the Authors of any
            Work they submit:
          </p>
          <ul>
            <li>
              Any claims against OpenReview or OpenReview Editors, based upon the use of the
              Work by OpenReview consistent with its License.
            </li>
            <li>
              Any claims against OpenReview or OpenReview Editors, based upon actions taken by
              any such party with respect to the Work, including without limitation decisions
              to include the Work in, or exclude the Work from, the Database; editorial
              decisions or changes affecting the Work, including the identification of
              Submitters, Authors, and their affiliations or titles; the classification or
              characterization of the Work; the content of any metadata; the availability or
              lack of availability of the Work to researchers or other users of OpenReview,
              including any decision to include the Work initially or remove or disable access.
            </li>
            <li>
              Any claims against OpenReview or OpenReview Editors based upon any loss of
              content or disclosure of information provided in connection with a Submission.
            </li>
            <li>
              Any rights related to the integrity of the Work under Moral Rights principles.
            </li>
          </ul>

          <h3>Content</h3>
          <p>
            You understand and acknowledge that OpenReview has no obligation to monitor
            Submissions and that Submissions are not verified or approved by OpenReview.
            OpenReview has the right (but not the obligation) in its sole discretion to refuse,
            move, hide, or remove any Submissions.
          </p>
          <p>
            You understand and acknowledge that you may be exposed to Submissions that are
            inaccurate, offensive, defamatory, indecent, objectionable or inappropriate for
            children, and that, in this respect, you use the OpenReview System at your own
            risk, and you agree that OpenReview Editors shall not be liable for any damages you
            allege to incur as a result of such Submissions. You agree that you must evaluate,
            and bear all risks associated with, the use of any Submissions, including any
            reliance on the accuracy, completeness, or usefulness of such Submissions. We make
            no representations, warranties or guarantees, whether expressed or implied, that
            the Submissions in the OpenReview Database are accurate, complete or up to date. In
            this regard, you acknowledge that you may not rely on any Submissions.
          </p>
          <p>
            You agree that you are solely responsible for (and that OpenReview and OpenReview
            Editors will take no responsibility and assume no liability to you or to any third
            party for) your Submissions and for the consequences of your uploading it.
          </p>
          <p>
            Submissions may be subject to posted limitations on usage, reproduction or
            dissemination, and you are responsible for adhering to such limitations if you
            download the Submission. Submissions uploaded by other users may be confidential,
            protected by copyright laws and may contain sensitive information. You agree only
            to use the Submissions for the purposes for which they have been provided and/or
            made available to you and not to modify the Submission that you download. You must
            not purport to have any rights in or over the Submissions that you access other
            than to the extent expressly permitted by these Terms of Use, the Submissions&apos;
            license, or the relevant Author(s).
          </p>
          <p>
            Your Submissions may be available to other users of the OpenReview System. The set
            of users who have read or write access to Submissions is governed by their Database
            fields &ldquo;readers,&rdquo; &ldquo;nonreaders,&rdquo; and &ldquo;writers.&rdquo;
            The Users or Groups given such access may or may not be known to you, and may be
            changed at any time by Users with write access to the Submission, which are
            typically the Authors and the Venue soliciting the Submission. Other than
            &ldquo;Personal Data&rdquo; as defined by GDPR, once you have posted a Submission
            to the System you cannot request that it be deleted, nor withdraw your consent for
            it to be used in accordance with these Terms (unless we expressly agree in writing
            otherwise).
          </p>
          <p>You agree not to post Submissions that</p>
          <ul>
            <li>may constitute or contribute to a crime or tort,</li>
            <li>
              contains any information or content that violates third-party rights of any kind
              or is unlawful, harmful, abusive, racially or ethnically offensive, defamatory,
              infringing, invasive of personal privacy or publicity rights, harassing,
              humiliating to other people (publicly or otherwise), libelous, threatening,
              profane, or otherwise objectionable,
            </li>
            <li>
              infringes any patent, trademark, trade secret, copyright or other proprietary
              rights of any party,
            </li>
            <li>
              contains unsolicited or unauthorized advertising, promotional materials, junk
              mail, spam, chain letters, pyramid schemes, or any other form of solicitation,
            </li>
            <li>
              contains files or programs designed to interrupt, destroy or limit the
              functionality of any computer software or hardware or telecommunications
              equipment,
            </li>
            <li>
              contains false, incorrect or fake email addresses or other personal data of
              yourself or other persons.
            </li>
          </ul>

          <h3>Use of Personal Information</h3>
          <p>The following definitions apply in this section</p>
          <ul>
            <li>
              &ldquo;Agreed Purposes&rdquo; means the performance by Users of their obligations
              in respect of the OpenReview Purpose and/or under these Terms.
            </li>
            <li>
              &ldquo;Permitted Recipients&rdquo; means Venue Organizers and other Solicitors
              and their delegates engaged to perform obligations in connection with their Venue
              or other purpose as Solicitors in keeping with the OpenReview Purpose.
            </li>
            <li>
              &ldquo;Sensitive Personal Information&rdquo; means (a) any data revealing racial
              or ethnic origin, political opinions, religious or philosophical beliefs, or
              trade union membership, (b) genetic data, biometric data for the purpose of
              uniquely identifying a natural person, (c) data concerning health or medical
              information (other than food allergies or medical contact information), (d) data
              concerning a natural person&rsquo;s sex life or sexual orientation, (e) national
              insurance, social security numbers, or similar ids or numbers used in various
              countries, (f) passport numbers or other government issued ID numbers, (g) date
              of birth, (h) financial account information (other than payment information
              processed securely), (i) other data which can be reasonably recognised as being
              highly sensitive.
            </li>
            <li>
              Other capitalized phrases below (such as Data Controller, Data Processor,
              Personal Data, Processing and Appropriate Technical and Organizational Measures)
              are defined in the European Union&rsquo;s General Data Protection Regulation
              (GDPR).
            </li>
          </ul>
          <p>
            See the <Link href="/legal/privacy">OpenReview Privacy Policy</Link> for a
            description of the manner in which the OpenReview System collects, uses, maintains
            and discloses information collected from its users.
          </p>
          <p>
            You acknowledge and agree that OpenReview and OpenReview Staff are a Data
            Controller only for Works for which &ldquo;OpenReview.net&rdquo; is the Solicitor.
            With respect to all other Works, OpenReview is a Data Processor but not a Data
            Controller; in this case the Data Controller is the Work&rsquo;s Solicitor (for
            example, the Venue inviting the Submissions).
          </p>
          <p>
            Solicitors acknowledge that they are a Data Controller in respect of any Personal
            Data they solicit from Users. Solicitors agree to (a) process personal data
            accessed and/or provided to you through the System only for the Agreed Purposes,
            (b) not disclose or allow access to such personal data to anyone other than the
            Permitted Recipients, and (c) ensure that you have in place Appropriate Technical
            and Organizational Measures to protect against unauthorized or unlawful Processing
            of personal data and against accidental loss or destruction of, or damage to,
            personal data. Solicitors acknowledge and agree that they will not unnecessarily
            request Sensitive Personal Information from other users. Solicitors acknowledge and
            agree that OpenReview Editors can monitor requests to provide Sensitive Personal
            Information and require you to remove such requests. You acknowledge and agree that
            Processing, storing and transmitting Sensitive Personal Information is unnecessary
            for use of the OpenReview System and that you shall be solely responsible for any
            such use, and therefore OpenReview and OpenReview Staff shall not be liable for the
            same.
          </p>
          <p>
            You shall indemnify OpenReview and OpenReview Staff against all liabilities, costs,
            expenses, damages and losses (including but not limited to any direct, indirect or
            consequential losses, loss of profit, loss of reputation and all interest,
            penalties and legal costs (calculated on a full indemnity basis) and all other
            professional costs and expenses) suffered or incurred by OpenReview arising out of
            or in connection with the breach of the Data Protection Legislation by you, your
            employees or agents.
          </p>
          <p>
            As part of your use of the System, you may have access to Personal Data provided or
            made available by other users. You understand and agree that you should handle such
            Personal Data in compliance with regulations applicable in relevant jurisdictions.
            OpenReview and the OpenReview Editors are not responsible for ensuring that Users
            comply with such regulations. You also acknowledge that, given the nature of the
            System usage, any Personal Data that you provide or make available to other users
            is likely to be transferred outside of the European Economic Area.
          </p>
          <p>
            Any material breach of data protection legislation regulations by you shall be
            grounds for OpenReview to suspend or terminate your use of the System.
          </p>

          <h3>Privacy and Your Personal Information</h3>
          <p>
            OpenReview is dedicated to protecting your personal information, and will make
            every reasonable effort to handle collected information appropriately, including
            care to ensure that we comply with our obligations under GDPR.
          </p>
          <p>
            For information about OpenReview data protection practices, please read the
            OpenReview Privacy Policy on the OpenReview Web Site; this policy explains how
            OpenReview treats your personal information, and protects your privacy, when you
            use the System. You agree to the use of your data in accordance with this Privacy
            Policy.
          </p>
          <p>
            In order to operate and provide the System, we collect certain information about
            you, as described in the OpenReview Privacy Policy. As part of your interaction
            with the System, we may also automatically upload information about your computer,
            your use of the System, and System performance.
          </p>
          <p>
            You acknowledge, consent and agree that OpenReview may in its sole discretion
            access, preserve and disclose any such information and/or Works if required to do
            so by law or in a good faith belief that such access, preservation or disclosure is
            reasonably necessary to: (a) comply with legal process, (b) enforce these Terms,
            (c) respond to claims that any Work violates the rights of third parties, (d)
            protect against imminent harm to the rights, property or safety of OpenReview,
            OpenReview Editors, Users, or the public as required or permitted by law, (e)
            maintain or improve security, integrity, and features of the System.
          </p>
          <p>
            The OpenReview Web Site uses cookies. A cookie is a small file of letters and
            numbers that we put on your computer if you agree. These cookies allow us to
            distinguish you from other users of the OpenReview Web Site, which helps us to
            provide you with a good experience when you browse the OpenReview Web Site and also
            allows us to improve the OpenReview Web Site. You can read more about our cookie
            policy in the OpenReview Privacy Policy.
          </p>

          <h3>Terms necessary for global access to OpenReview</h3>
          <p>
            By accessing or using the Service, you agree and warrant that: (i) you are not
            acting, directly or indirectly, on behalf of the Governments of Iran, Syria, Cuba,
            or any other jurisdiction subject to comprehensive economic sanctions by the United
            States, or any political subdivision, agency or instrumentality thereof (other than
            academic and research institutions whose primary function is research and/or
            teaching and their personnel); (ii) you are not a person sanctioned under any of
            the sanctions programs administered by the Office of Foreign Assets Control of the
            United States Department of the Treasury (OFAC) and are not listed or identified on
            the List of Specially Designated Nationals and Blocked Persons or other sanctions
            lists administered by OFAC; and (iii) if you reside in or are a national of a
            jurisdiction subject to comprehensive economic sanctions by the United States, you
            are accessing or using the Service solely to access informational materials or
            engage in publishing activities, as such terms are defined and authorized by
            general licenses issued by OFAC.
          </p>

          <h3>User Registration, Account and Password</h3>
          <p>
            In order to access some features of the System, Users must register. To begin
            registration you may visit the web page inviting you to create a new login account.
            First the System will ask for your name, email, and a newly-created password. Your
            user id is created automatically from your name. We will then send an email to you
            in order to confirm the email address for your account. This email will include a
            link inviting you to complete the registration by entering required additional
            Profile information such as your organization and homepage URL, and other optional
            information such as your profile URLs on other scientific publishing services (e.g.
            Google Scholar and ORCHID), and additional information that will aid Venues in
            determining conflicts of interest.
          </p>
          <p>User registration and account terms:</p>
          <ul>
            <li>
              It is a violation of our policies to misrepresent your identity or organizational
              affiliation or homepage URL. Claimed affiliation should be current in the
              conventional sense: e.g., physical presence, funding, email address, etc.
              Misrepresentation of identity or affiliation, for any reason, may result in
              immediate and permanent suspension from use of the OpenReview System. You agree
              to provide registration and Profile information that is true, accurate, current,
              and complete.
            </li>
            <li>
              Each user may have only one registered OpenReview account. If you are attempting
              to register a new account and are already registered or have an
              automatically-pre-created account with the same name, these other accounts will
              appear, and allow you to claim them, and have such claims reviewed by OpenReview
              staff.
            </li>
            <li>
              You agree to maintain and promptly update the Profile information to keep it
              true, accurate, current and complete. If you provide any information that is
              untrue, inaccurate, not current or incomplete, or we have reasonable grounds to
              suspect that such information is untrue, inaccurate, not current or incomplete,
              OpenReview, in its sole discretion, has the right to suspend or terminate your
              account and refuse you any and all current or future use of the System.
            </li>
            <li>
              You agree and understand that you are fully responsible for all activities that
              occur under any account you use to access the System.
            </li>
            <li>
              You must keep your password confidential and not authorize any third party to
              access or use the System on your behalf. You understand that any third party that
              has access to your account can reset your password, disable your access to the
              System, view any content accessible from your account, or post any content,
              including content that violates these Terms of Use or other laws, regulations, or
              rules. You remain fully liable to and will indemnify and hold harmless OpenReview
              Editors against claims, actions, proceedings, losses, damages, expenses and costs
              (including without limitation court costs and reasonable legal fees) arising out
              of or in connection with any third party&rsquo;s use of your account and password
              or the System on your behalf.
            </li>
            <li>
              You agree to immediately notify us of any unauthorized use of your password or
              account.
            </li>
            <li>
              You acknowledge and agree that if OpenReview Editors disable access to your
              account, or restrict your permissions, you may be prevented from accessing the
              System, your account details, or some Works that were previously accessible to
              you via the System.
            </li>
          </ul>
          <p>
            As with all passwords, we recommend that you keep your password safe and secure. If
            you forget your password, you can have it reset on the login page. The same process
            is used to change your password.
          </p>
          <p>
            If you need to change your preferred email address, for example because you have
            changed institutions, you can do so by editing your Profile. This will allow you to
            add an email address and we will send an email with a verification code to your new
            address to make sure that your new address is correct. Afterwards you can make the
            new email address your preferred address. OpenReview asks that old non-preferred
            email addresses continue to be recorded in your Profile in order to aid with author
            disambiguation, and historical conflict-of-interest detection.
          </p>
          <p>
            If you want to add alternative versions of your name (for example, with and without
            a middle name), you can do so by editing your Profile.
          </p>
          <p>
            If you want to remove a previously registered name, for example due to a typo at
            user registration time or a change in identity, you can request such a deletion in
            the edit page of your Profile. Such requests are reviewed by OpenReview staff
            because all previous uses of your old name (and accompanying user id) must be
            modified throughout all fields of the OpenReview Database, and corner cases in the
            necessary processing sometimes need human intervention.
          </p>

          <h3>User Code of Conduct, Reporting, Consequences</h3>
          <p>
            When interacting with OpenReview Users must uphold intellectual honesty and ethics
            based on community and academic standards. Users are solely responsible for
            representing themselves and their interactions honestly, solely accountable for
            their own decisions.
          </p>
          <p>
            OpenReview Users must not use the OpenReview System in a way that unlawful or
            fraudulent, or has any unlawful or fraudulent purpose or effort, including without
            limitation (a) to impersonate any person or entity, (b) to falsely state or
            otherwise misrepresent your affiliation with a person or entity, or (c) to hide or
            attempt to hide your identity, including by creating several accounts under
            different names.
          </p>
          <p>
            OpenReview Users must respect the privacy of other Users. Users must not attempt to
            compromise the OpenReview System&rsquo;s integrity or security or decipher any
            transmissions to or from the System. The OpenReview System defines security rules
            aimed to authenticate Users and to determine what information is readable and/or
            writeable exclusively by certain restricted groups of Users, as indicated by the
            Database fields &ldquo;readers&rdquo;, &ldquo;nonreaders&rdquo;, and
            &ldquo;writers.&rdquo; OpenReview Users must not attempt to circumvent these rules,
            nor share beyond the above restrictions information they discover (discovered, for
            example, through intended legitimate use of OpenReview&rsquo;s System, through bugs
            in the OpenReview System, or through channels outside the OpenReview System). If
            any User discovers an apparent security bug in the OpenReview System, the User must
            report the bug promptly by email to{' '}
            <a href="mailto:info@openreview.net">info@openreview.net</a>, and not share
            information about the bug with others. OpenReview users must respect the boundary
            between personal privacy and scholarly openness.
          </p>
          <p>
            OpenReview Users must not discriminate against protected classes of individuals, as
            defined under the laws of the Commonwealth of Massachusetts or United States
            federal law. Protected classes include race, color, religion, creed, sex, age,
            marital status, national origin, mental or physical disability, political belief or
            affiliation, pregnancy and pregnancy related condition(s), veteran status, sexual
            orientation, gender identity and expression, genetic information.
          </p>
          <p>
            OpenReview Users must not behave in an abusive manner through the OpenReview
            system. Abusive behavior includes harassment, bullying, obscene language, threats
            of physical abuse, and submitting any content that promotes, encourages, glorifies,
            or threatens acts of violence. OpenReview Users must not submit any content that
            promotes, encourages, provides instruction for, or glorifies suicidal or
            self-injurious behaviors, nor any content that constitutes, promotes, encourages,
            provides instruction for, or glorifies obscenity, harm, or cruelty. OpenReview
            Users must foster a safe, respectful environment for communication of diverse
            views.
          </p>
          <p>
            OpenReview Users must not use the OpenReview System in a manner that causes harm to
            the OpenReview System (such as denial of service attacks, bug exploitation, or any
            disingenuous behavior that degrades the OpenReview System or degrades the
            user-experience of other Users) or compromises the integrity and purpose of the
            OpenReview Database (such as unnecessary content flooding, submitting false or
            misleading metadata, or spoofing). You acknowledge and agree that OpenReview
            Editors may set upper limits on the number of transmissions you may send or receive
            through the System or on the amount of storage space available to any User or
            Group. Such upper limits may be set by OpenReview Editors at any time, at their
            discretion.
          </p>
          <p>
            OpenReview Users must not use the System in any way (a) that violates any
            applicable local, national or international law or regulation, (b) to transmit, or
            procure the sending of, spam, chain letters, or other unsolicited advertising or
            promotional material or any other form of similar solicitation, or (c) to knowingly
            transmit any data, send or upload any material that contains viruses, Trojan
            horses, worms, time-bombs, keystroke loggers, spyware, adware or any other harmful
            programs or similar computer code designed to adversely affect the operation of any
            computer software or hardware.
          </p>
          <p>
            Suspected violations of this User Code of Conduct or any of the stipulations in
            these Terms of Use should be reported to the Venue of the violating Work, and also
            the OpenReview Policy Board (
            <a href="mailto:policy@openreview.net">policy@openreview.net</a>
            ).
          </p>
          <p>
            Failure to comply with stipulations of this User Code of Conduct or any of the
            stipulations in these Terms of Use may result in hiding or removal of offending
            content, and/or a warning, public release of information about the violation,
            suspension, or permanent removal of the offending User from participation in a
            Venue or participation in OpenReview System as a whole–as determined by the Venue
            for the violating Work or the OpenReview Policy Board.
          </p>

          <h3>Termination</h3>
          <p>
            You agree that OpenReview Staff may, under certain circumstances and without prior
            notice, immediately terminate your account and access to the System. Cause for such
            termination shall include without limitation: (a) breaches, violations or purported
            breaches or violations of these Terms of Use, (b) requests by law enforcement or
            other government agencies, (c) discontinuance or modification to the Service (or
            any part thereof), (d) unexpected technical or security issues or problems, (e)
            extended periods of inactivity, (f) a request by you.
          </p>
          <p>
            If you want to terminate your legal agreement with OpenReview you may do so by
            emailing OpenReview Staff at profiles@openreview.net. You can stop using the System
            at any time but your account will not be closed unless you ask to close it.
            OpenReview and OpenReview staff shall not be liable to you or any third party for
            any termination of your account or access to the System.
          </p>

          <h3>Unsolicited Email (Spam)</h3>
          <p>
            Venue Organizers have the ability to send email messages through the OpenReview
            System. All email messages sent by Venue Organizers from the OpenReview
            System–including invitations to program committees and review requests–must only
            target relevant recipients who are reasonably likely to agree to receiving your
            invitation.
          </p>
          <p>
            You acknowledge and agree that if you violate this Unsolicited Email policy, we may
            suspend or terminate your access to the OpenReview System. The OpenReview Policy
            Board reserves the right to decide, in its sole discretion, whether you violate any
            such provision based on received emails, complaints, information we receive from
            email service providers, and any similar information.
          </p>

          <h3>Other Provisions</h3>
          <p>
            You represent that you are of legal age to form a binding contract and are not
            prevented from accessing or receiving the Service under any applicable
            jurisdiction.
          </p>
          <p>
            Your use of the OpenReview System does not create a partnership, joint venture or
            agency relationship or similar relationship between us and you.
          </p>
          <p>
            Verifiable information. All information which you post about the System or any
            Venue relevant to the System, including any web pages, emails and other media used
            by you, posters, calls for papers, must comply with the verifiable information
            principle, meaning that all such information must be correct and verifiable. This
            includes without limitation: (a) all persons mentioned; for example, if your web
            page lists the conference scientific committee, then the Venue should be able to
            provide, upon request, evidence that a particular committee member agreed to be on
            the relevant committee; (b) all organizations, for example sponsors; your
            association with these organizations should be verifiable upon request, (c) all
            third-party logos used; you should have obtained permission to use these logos and
            be able to justify that you have such permission.
          </p>
          <p>
            You acknowledge that, except as expressly stated otherwise in these Terms of Use or
            by open-source licenses on portions of the System, OpenReview or its licensors
            retain all copyright, trademark, trade secret, patent and other intellectual
            property rights to the System and any or all modifications to the System.
          </p>

          <h3>No Warranty</h3>
          <p>
            We provide the System using commercially reasonable efforts. However, the System is
            provided &ldquo;as is&rdquo; without warranty of any kind. You expressly understand
            and agree that your use of the System is at your own risk. OpenReview specifically
            disclaims, to the maximum extent permitted by law, any express or implied
            warranties including without limitation as to merchantability, satisfactory
            quality, fitness for a particular purpose, non-infringement, the absence of defects
            or errors, that any defects or errors will be corrected, or that the Service is
            free of viruses or any other harmful components.
          </p>
          <p>
            We cannot guarantee the accuracy, reliability or timeliness of information
            available from the System. Any content downloaded or otherwise obtained through the
            System is downloaded at your own risk and we are not responsible for any damage to
            your computer system or loss of data that results from such download.
          </p>

          <h3>Limitation of Liability</h3>
          <p>
            Nothing in these Terms of Use shall exclude or limit OpenReview&rsquo;s liability
            for losses which may not be lawfully excluded or limited by applicable law
            (including without limitation death or personal injury caused by its negligence or
            fraud or fraudulent misrepresentation).
          </p>
          <p>
            Subject to overall provision in the paragraph above, OpenReview nor OpenReview
            Editors shall not be liable to you for any direct, indirect, punitive,
            consequential or exemplary damages, including without limitation any loss of
            profit, loss of goodwill or business reputation, or loss of data or any damage,
            loss or injury resulting from:
          </p>
          <ul>
            <li>
              any reliance placed by you on the completeness, accuracy, usefulness, or
              existence of any Works or advertising stored in the System,
            </li>
            <li>
              any permanent or temporary cessation, delays or failures in the provision of the
              Service or any part thereof,
            </li>
            <li>
              hacking, tampering or other unauthorized access of your account or the
              information contained therein,
            </li>
            <li>your or any third party use of System Works,</li>
            <li>
              content on third-party web sites, third-party programs, or third-party conduct
              accessed via the Service,
            </li>
            <li>
              viruses or other disabling features that affect your access to or use of the
              Service or may be transmitted to or through the Service by any third party,
            </li>
            <li>
              incompatibility between the System and other services, software, or hardware,
            </li>
            <li>
              your failure to provide accurate registration data or other information required
              by the System,
            </li>
            <li>
              your failure to keep your password or account details secure and confidential,
            </li>
            <li>any changes which OpenReview Staff may make to the System,</li>
            <li>
              the deletion of, corruption of, or failure to store, any Works or other data
              maintained or transmitted by or through the System,
            </li>
            <li>
              unauthorized or unintended access to, or alteration in, or disclosure of any
              Works or other data maintained or transmitted by or through the System,
            </li>
            <li>
              claims for breach of contract, breach of warranty, guarantee or condition, strict
              liability, tort (including negligence or breach of statutory duty) or negligent
              misrepresentation,
            </li>
            <li>
              any relationship or transaction between you and any advertiser or sponsor whose
              advertising appears on the System, or
            </li>
            <li>your failure to comply with these Terms of Use.</li>
          </ul>
          <p>
            The limitations on OpenReview&rsquo;s and OpenReview Editors&rsquo; liability to
            you in paragraph and list above shall apply whether or not OpenReview or OpenReview
            Editors have been advised of or should have been aware of the possibility of any
            such losses arising.
          </p>

          <h3>Indemnity</h3>
          <p>
            Users, on behalf of themselves and the Authors of any Work they submit, agree to
            indemnify and hold harmless OpenReview and OpenReview Editors against claims,
            demands, actions, proceedings, damages, losses, loss of profit, loss of reputation,
            damages, expenses and costs (including without limitation court costs and
            reasonable legal fees) from any claim or demand arising out of or related to (a)
            any use of Works as anticipated in its License and this Terms of Use, (b) any loss
            of content or disclosure of information provided in connection with a Work, (c)
            your use of the System, (d) your violation of these Terms of Use, (e) any failure
            by OpenReview Editors, Solicitors, Submitters or other Users to perform any of
            their obligations herein, (f) your violation of any third party rights, or (g) your
            violation of any applicable law, rule, or regulation.
          </p>

          <h3>Changes to the OpenReview System</h3>
          <p>
            We reserve the right to update the OpenReview System at any time at our discretion
            with or without notice to you. Such updates are designed to improve, enhance and
            further develop the OpenReview System and may take the form of bug fixes, enhanced
            functions, new modules, or other forms. You agree to permit us to make and deploy
            these changes as part of your use of the OpenReview System.
          </p>

          <h3>Changes to this Document</h3>
          <p>
            OpenReview may update these Terms of Use at any time in its sole discretion.
            Changes become effective upon posting. Users will be notified of the date of last
            update to these Terms of Use before logging in to the OpenReview Web Site. The date
            on the top of this document indicates the date the policy was last updated. Your
            continued use of the OpenReview System after these Terms of Use has been modified
            means that you accept the revised terms. We will also comply with any applicable
            laws governing notice or choice in the event we make any material changes to these
            Terms of Use. It is your responsibility to review these Terms of Use periodically
            to become aware of any modifications.
          </p>

          <h3>General Legal Terms</h3>
          <p>
            These Terms of Use constitute the entire contract between you and us regarding the
            System. It supersedes and extinguishes any prior contract, warranties,
            representations, understandings or other oral or written statements regarding your
            use of the System.
          </p>
          <p>
            You acknowledge that in using the System you do not rely on, and shall have no
            remedies in respect of any statement, representation, assurance or warranty
            (whether made innocently or negligently) that is not set out in these Terms of Use.
          </p>
          <p>
            All parts of these Terms of Use apply to the maximum extent permitted by relevant
            law. If any part of these Terms of Use is or becomes invalid, illegal or
            unenforceable, it shall be deemed modified to the minimum extent necessary to make
            it valid, legal and enforceable. If such modification is not possible, the relevant
            provision or part-provision shall be deemed deleted. Any modification to or
            deletion of a provision or part-provision shall not affect the validity and
            enforceability of the rest of the Terms of Use.
          </p>
          <p>
            You agree that regardless of any statute or law to the contrary, to the extent
            permitted by law, any claim or cause of action arising out of or related to use of
            the System or the Terms of Use must be filed within six months after such claim or
            cause of action arose or be forever barred.
          </p>
          <p>
            These Terms of Use and the relationship between you and OpenReview and any dispute
            or claim (including non-contractual disputes or claims) arising out of or in
            connection with it or its subject matter or formation shall be governed by, and
            construed in accordance with the law of Massachusetts and the United States of
            America. In relation to any legal action or proceedings arising out of or in
            connection with this Terms of Use (&ldquo;Proceedings&rdquo;), each of the parties
            irrevocably agrees that the courts of Massachusetts and the United States of
            America shall have exclusive jurisdiction to settle any dispute or claim (including
            non-contractual disputes or claims) arising out of or in connection with these
            Terms of Use or their subject matter or formation and waives any objection to
            Proceedings in such courts on the grounds of venue or on the grounds that
            Proceedings have been brought in an inappropriate forum.
          </p>
          <p>
            OpenReview Staff shall not be in breach of these Terms nor liable for delay in
            performing, or failure to perform, any of its obligations under these Terms of Use
            if such delay or failure result from events, circumstances or causes beyond its
            reasonable control.
          </p>
          <p>
            A waiver of any right or remedy under these Terms of Use or by law is only
            effective if given in writing and shall not be deemed a waiver of any subsequent
            right or remedy. A failure or delay by OpenReview Staff to exercise any right or
            remedy provided under these Terms of Use or by law shall not constitute a waiver of
            that or any other right or remedy, nor shall it prevent or restrict any further
            exercise of that or any other right or remedy. No single or partial exercise of any
            right or remedy provided under these Terms of Use or by law shall prevent or
            restrict the further exercise of that or any other right or remedy.
          </p>

          <h3>Questions?</h3>
          <p>
            If you have any questions about these Terms of Use, please email us at{' '}
            <a href="mailto:policy@openreview.net">policy@openreview.net</a>
          </p>
          <br />
        </div>
      </div>
    </>
  )
}
