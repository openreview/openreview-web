import Head from 'next/head'
import Link from 'next/link'

// Page Styles
import '../styles/pages/sponsors.less'

function Sponsor({ name, image }) {
  return (
    <img src={`/images/sponsors/${image}`} alt={name} />
  )
}

export default function Sponsors({ sponsors }) {
  return (
    <div>
      <Head>
        <title key="title">Sponsors | OpenReview</title>
      </Head>

      <div className="row">
        <div className="col-xs-12 col-md-10 col-md-offset-1 mb-3 text-center">
          <h1>OpenReview Sponsors</h1>
          <h5>We gratefully acknowledge the support of all our sponsors:</h5>
        </div>
      </div>

      <div className="row">
        <div className="col-xs-12 col-md-10 col-md-offset-1 sponsors-container">

          <h2>Gold</h2>
          <div className="width-5 height-5">
            {sponsors.gold.map(sponsor => (
              <Sponsor key={sponsor.name} name={sponsor.name} image={sponsor.image} />
            ))}
          </div>

          <h2>Silver</h2>
          <div className="width-4 height-4">
            {sponsors.silver.map(sponsor => (
              <Sponsor key={sponsor.name} name={sponsor.name} image={sponsor.image} />
            ))}
          </div>

          <h2>Bronze</h2>
          <div className="width-3 height-3">
            {sponsors.bronze.map(sponsor => (
              <Sponsor key={sponsor.name} name={sponsor.name} image={sponsor.image} />
            ))}
          </div>

          <h2>Benefactors</h2>
          <div className="width-3 height-3">
            {sponsors.benefactors.map(sponsor => (
              <Sponsor key={sponsor.name} name={sponsor.name} image={sponsor.image} />
            ))}
          </div>

          <h2>Large Patrons</h2>
          <div className="width-2 height-2">
            {sponsors.large_patrons.map(sponsor => (
              <Sponsor key={sponsor.name} name={sponsor.name} image={sponsor.image} />
            ))}
          </div>

          <h2>Small Patrons</h2>
          <div className="width-2 height-2">
            {sponsors.small_patrons.map(sponsor => (
              <Sponsor key={sponsor.name} name={sponsor.name} image={sponsor.image} />
            ))}
          </div>

          <h2>Supporters</h2>
          <div className="width-1 height-1">
            {sponsors.supporters.map(sponsor => (
              <Sponsor key={sponsor.name} name={sponsor.name} image={sponsor.image} />
            ))}
          </div>

          <h2>Friends</h2>
          <div className="width-1 height-1">
            {sponsors.friends.map(sponsor => (
              <Sponsor key={sponsor.name} name={sponsor.name} image={sponsor.image} />
            ))}
          </div>
        </div>
      </div>

      <div className="row mt-2 mb-4">
        <div className="col-xs-12 col-md-10 col-md-offset-1 text-center">
          <Link href="/donate">
            <a className="btn btn-lg btn-primary">Donate to OpenReview</a>
          </Link>
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
          { name: 'UMass IESL', image: 'umass_iesl2.png' },
        ],
        silver: [
          { name: 'Amazon', image: 'amazon.png' },
          { name: 'CZI', image: 'czi.png' },
        ],
        bronze: [
          { name: 'Google', image: 'google.png' },
          { name: 'Bloomberg', image: 'bloomberg.png' },
          { name: 'IBM', image: 'ibm.png' },
          { name: 'DeepMind', image: 'deepmind.png' },
        ],
        benefactors: [
          { name: 'NeurIPS', image: 'neurips.png' },
          { name: 'ICLR', image: 'iclr.png' },
          { name: 'CDS', image: 'cds.png' },
        ],
        large_patrons: [
          { name: 'MILA', image: 'mila.png' },
          { name: 'ICML', image: 'icml.png' },
          { name: 'CVF', image: 'cvf.png' },
        ],
        small_patrons: [
          { name: 'MIDL', image: 'midl.png' },
        ],
        supporters: [
          { name: 'AIR', image: 'air.png' },
        ],
        friends: [
          { name: 'ESWC', image: 'eswc.png' },
        ],
      },
    },
  }
}

Sponsors.bodyClass = 'sponsors'
