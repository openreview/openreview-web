import Head from 'next/head'

// Page Styles
import '../styles/pages/sponsors.less'

function Sponsor({ name, image }) {
  return (
    <div>
      <h4>{name}</h4>
      <img src={`/images/sponsors/${image}`} alt="" />
    </div>
  )
}

export default function Sponsors({ sponsors }) {
  return (
    <div>
      <Head>
        <title key="title">Sponsors | OpenReview</title>
      </Head>

      <div className="row">
        <div className="col-xs-12 col-md-10 col-md-offset-1">
          <h1>OpenReview Sponsors</h1>
        </div>
      </div>

      <div className="row">
        <div className="col-xs-12 col-md-10 col-md-offset-1 sponsors-container">

          <h2>Platinum</h2>
          {sponsors.platinum.map(sponsor => (
            <Sponsor name={sponsor.name} />
          ))}

          <h2>Gold</h2>
          {sponsors.gold.map(sponsor => (
            <Sponsor name={sponsor.name} />
          ))}

        </div>
      </div>
    </div>
  )
}

export async function getStaticProps() {
  return {
    props: {
      sponsors: {
        platinum: [
          { name: 'Google', image: 'google.jpg' },
        ],
        gold: [
          { name: 'Google' },
        ],
        silver: [
          { name: 'Google' },
        ],
      },
    },
  }
}

Sponsors.bodyClass = 'sponsors'
