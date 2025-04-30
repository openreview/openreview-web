/* eslint-disable max-len */

import Head from 'next/head'
import Link from 'next/link'

const About = () => (
  <div>
    <Head>
      <title key="title">About | OpenReview</title>
    </Head>

    <div className="row">
      <div className="col-xs-12 col-md-10 col-md-offset-1">
        <h1>About OpenReview</h1>
      </div>
    </div>

    <div className="row">
      <div className="col-xs-12 col-md-10 col-md-offset-1">
        <p>
          OpenReview aims to promote openness in scientific communication, particularly the
          peer review process, by providing a flexible cloud-based web interface and underlying
          database API enabling the following:
        </p>
        <ul className="list-unstyled">
          <li className="mb-2">
            <strong>Open Peer Review:</strong> We provide a configurable platform for peer
            review that generalizes over many subtle gradations of openness, allowing
            conference organizers, journals, and other &quot;reviewing entities&quot; to
            configure the specific policy of their choice. We intend to act as a testbed for
            different policies, to help scientific communities experiment with open scholarship
            while addressing legitimate concerns regarding confidentiality, attribution, and
            bias.
          </li>
          <li className="mb-2">
            <strong>Open Publishing:</strong> Track submissions, coordinate the efforts of
            editors, reviewers and authors, and host… Sharded and distributed for speed and
            reliability.
          </li>
          <li className="mb-2">
            <strong>Open Access:</strong> Free access to papers for all, free paper
            submissions. No fees.
          </li>
          <li className="mb-2">
            <strong>Open Discussion:</strong> Hosting of accepted papers, with their reviews,
            comments. Continued discussion forum associated with the paper post acceptance.
            Publication venue chairs/editors can control structure of review/comment forms,
            read/write access, and its timing.
          </li>
          <li className="mb-2">
            <strong>Open Directory:</strong> Collection of people, with conflict-of-interest
            information, including institutions and relations, such as co-authors, co-PIs,
            co-workers, advisors/advisees, and family connections.
          </li>
          <li className="mb-2">
            <strong>Open Recommendations:</strong> Models of scientific topics and expertise.
            Directory of people includes scientific expertise. Reviewer-paper matching for
            conferences with thousands of submissions, incorporating expertise, bidding,
            constraints, and reviewer balancing of various sorts. Paper recommendation to
            users.
          </li>
          <li className="mb-2">
            <strong>Open API:</strong> We provide a simple REST API for accessing and uploading
            records of people, their groupings, document content, invitations and reviewing
            assignments, conflict-of-interest designations, and reviewing workflow patterns.
            You can then write scripts , all with a clear, robust model of read/write
            permissions. Track submissions, monitor review process, send customized bulk email
            messages, automate workflow actions.
          </li>
          <li className="mb-2">
            <strong>Open Source:</strong> We are committed to open source. The OpenReview web
            interface is free software: you can redistribute it and/or modify it under the
            terms under the terms of the{' '}
            <a
              href="https://github.com/openreview/openreview-web/blob/master/LICENSE.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              GNU Affero General Public License v3
            </a>
            . This software is distributed in the hope that it will be useful, but without any
            warranty; without even the implied warranty of merchantability or fitness for a
            particular purpose. The source code is available on{' '}
            <a
              href="https://github.com/openreview/openreview-web"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            .
          </li>
          <li>
            Many other parts of the OpenReview platform are also open source, and are available
            in the{' '}
            <a href="https://github.com/openreview" target="_blank" rel="noopener noreferrer">
              OpenReview organization on GitHub.
            </a>{' '}
            Some further releases are pending a professional security review of the codebase.
          </li>
        </ul>

        <p>
          OpenReview.net is created by Andrew McCallum&apos;s Information Extraction and
          Synthesis Laboratory in the College of Information and Computer Sciences at
          University of Massachusetts Amherst
        </p>

        <p>
          OpenReview.net is built over an earlier version described in the paper{' '}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/forum?id=xf0zSBd2iufMg" target="_blank">
            Open Scholarship and Peer Review: a Time for Experimentation
          </a>{' '}
          published in the {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a href="/group?id=ICML.cc/2013/PeerReview" target="_blank">
            ICML 2013 Peer Review Workshop
          </a>
          .
        </p>

        <p>
          OpenReview is a long-term project to advance science through improved peer review
          with legal nonprofit status. We gratefully acknowledge the support of the great
          diversity of <Link href="/sponsors">OpenReview Sponsors</Link>
          ––scientific peer review is sacrosanct, and should not be owned by any one sponsor.
        </p>
      </div>
    </div>
  </div>
)

About.bodyClass = 'about'

export default About
