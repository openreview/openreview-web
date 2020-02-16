import React from 'react'
import Link from 'next/link'
import Layout from '../components/Layout'
import LoadingSpinner from '../components/LoadingSpinner'
import fetch from 'isomorphic-unfetch'
import { prettyId, formatTimestamp } from '../lib/utils'

const Venue = ({ groupId, dueDate }) => (
  <h2>
    <Link href={`/group?id=${groupId}`}><a>{prettyId(groupId)}</a></Link>
    <span>Due {formatTimestamp(dueDate)}</span>
  </h2>
)

const Home = (props) => (
  <Layout title="Venues">
    <h1>Active Venues</h1>
    <hr className="small" />
    <div id="active-venues" className="conferences">
      <LoadingSpinner inline="true" />
    </div>

    <h1>Open for Submissions</h1>
    <hr className="small" />
    <div id="open-venues" className="conferences">
      <LoadingSpinner inline="true" />
    </div>

    <h1>All Venues</h1>
    <hr className="small" />
    <div id="all-venues" className="conferences">
      <LoadingSpinner inline="true" />
    </div>
  </Layout>
)

Home.getInitialProps = async function() {
  // TODO: get venues from API
  // const res = await fetch();
  // const data = await res.json();

  return {
    activeVenues: [],
    openVenues: [],
    allVenues: [],
  };
};

export default Home
