import Head from 'next/head'

// Page Styles
import '../styles/pages/sponsors.less'

function Sponsor({ name, image, size }) {
  return (
    <div className={`col-xs-${size > 4 ? 12 : 6} col-sm-${size}`}>
      <img src={`/images/sponsors/${image}`} alt={name} />
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

          <h2>Gold</h2>
          <div className="row">
            {sponsors.gold.map(sponsor => (
              <Sponsor name={sponsor.name} image={sponsor.image} size={5} />
            ))}
          </div>

          <h2>Silver</h2>
          <div className="row">
            {sponsors.silver.map(sponsor => (
              <Sponsor name={sponsor.name} image={sponsor.image} size={4} />
            ))}
          </div>

          <h2>Bronze</h2>
          <div className="row">
            {sponsors.bronze.map(sponsor => (
              <Sponsor name={sponsor.name} image={sponsor.image} size={3} />
            ))}
          </div>

          <h2>Benefactors</h2>
          <div className="row">
            {sponsors.benefactors.map(sponsor => (
              <Sponsor name={sponsor.name} image={sponsor.image} size={3} />
            ))}
          </div>

          <h2>Large Patrons</h2>
          <div className="row">
            {sponsors.large_patrons.map(sponsor => (
              <Sponsor name={sponsor.name} image={sponsor.image} size={2} />
            ))}
          </div>

          <h2>Small Patrons</h2>
          <div className="row">
            {sponsors.small_patrons.map(sponsor => (
              <Sponsor name={sponsor.name} image={sponsor.image} size={2} />
            ))}
          </div>

          <h2>Supporters</h2>
          <div className="row">
            {sponsors.supporters.map(sponsor => (
              <Sponsor name={sponsor.name} image={sponsor.image} size={2} />
            ))}
          </div>

          <h2>Friends</h2>
          <div className="row">
            {sponsors.friends.map(sponsor => (
              <Sponsor name={sponsor.name} image={sponsor.image} size={2} />
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

export async function getStaticProps() {
  return {
    props: {
      sponsors: {
        gold: [
          { name: 'Facebook', image: 'facebook.png' },
          { name: 'UMass IESL', image: 'umass_iesl.png' },
        ],
        silver: [
          { name: 'Amazon', image: 'amazon.png' },
          { name: 'CZI', image: 'czi.png' },
        ],
        bronze: [
          { name: 'Google', image: 'google.jpg' },
          { name: 'Bloomberg', image: 'bloomberg.png' },
          { name: 'IBM', image: 'ibm.png' },
          { name: 'DeepMind', image: 'deepmind.png' },
        ],
        benefactors: [
          { name: 'NeurIPS', image: 'neurips.png' },
          { name: 'CDS', image: 'cds.png' },
        ],
        large_patrons: [
          { name: 'MILA', image: 'mila.png' },
          { name: 'ICML', image: 'icml.png' },
          { name: 'CVF', image: 'cvf.jpg' },
        ],
        small_patrons: [
          { name: 'MIDL', image: 'midl.png' },
        ],
        supporters: [
          { name: 'AIR', image: 'air.png' },
        ],
        friends: [
          { name: 'ESWC', image: 'eswc.jpeg' },
        ],
      },
    },
  }
}

Sponsors.bodyClass = 'sponsors'
