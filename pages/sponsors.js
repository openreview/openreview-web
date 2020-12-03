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
          <h5>We gratefully acknowledge the support of the OpenReview sponsors:</h5>
        </div>
      </div>

      <div className="row">
        <div className="col-xs-12 col-md-10 col-md-offset-1 sponsors-container">

          <h2>Platinum</h2>
          {sponsors.platinum.map(sponsor => (
            <Sponsor name={sponsor.name} image={sponsor.image} />
          ))}

          <h2>Gold</h2>
          {sponsors.gold.map(sponsor => (
            <Sponsor name={sponsor.name} image={sponsor.image} />
          ))}

          <h2>Silver</h2>
          {sponsors.silver.map(sponsor => (
            <Sponsor name={sponsor.name} image={sponsor.image} />
          ))}

          <h2>Bronze</h2>
          {sponsors.bronze.map(sponsor => (
            <Sponsor name={sponsor.name} image={sponsor.image} />
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
          { name: 'Facebook', image: 'facebook.png' },
        ],
        gold: [
          { name: 'CZI', image: 'czi.png' },
          { name: 'Amazon', image: 'amazon.png' },
        ],
        silver: [
          { name: 'Google', image: 'google.jpg' },
          { name: 'Bloomberg', image: 'bloomberg.png' },
          { name: 'IBM', image: 'ibm.png' },
          { name: 'DeepMind', image: 'deepmind.png' },
        ],
        bronze: [
          { name: 'CVF', image: 'cvf.jpg' },
          { name: 'MILA', image: 'mila.png' },
          { name: 'AIR', image: 'air.png' },
          { name: 'UMass IESL', image: 'iesl.png' },
          { name: 'UMass CDS', image: 'cds.png' },
          { name: 'UMass CIIR ', image: 'ciir.png' },
        ],
      },
    },
  }
}

Sponsors.bodyClass = 'sponsors'
