import Head from 'next/head'
import Link from 'next/link'

function Sponsor({ name, image, link }) {
  return (
    <a href={link} target="_blank" rel="noreferrer">
      <img src={`/images/sponsors/${image}`} alt={name} />
    </a>
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
        <div className="col-xs-12 sponsors-container">
          <h2>Gold</h2>
          <div className="width-5 height-5">
            {sponsors.gold.map((sponsor) => (
              <Sponsor
                key={sponsor.name}
                name={sponsor.name}
                image={sponsor.image}
                link={sponsor.link}
              />
            ))}
          </div>

          <h2>Silver</h2>
          <div className="width-4 height-4">
            {sponsors.silver.map((sponsor) => (
              <Sponsor
                key={sponsor.name}
                name={sponsor.name}
                image={sponsor.image}
                link={sponsor.link}
              />
            ))}
          </div>

          <h2>Bronze</h2>
          <div className="width-3 height-3">
            {sponsors.bronze.map((sponsor) => (
              <Sponsor
                key={sponsor.name}
                name={sponsor.name}
                image={sponsor.image}
                link={sponsor.link}
              />
            ))}
          </div>

          <h2>Benefactors</h2>
          <div className="width-3 height-3">
            {sponsors.benefactors.map((sponsor) => (
              <Sponsor
                key={sponsor.name}
                name={sponsor.name}
                image={sponsor.image}
                link={sponsor.link}
              />
            ))}
          </div>

          <h2>Large Patrons</h2>
          <div className="width-2 height-2">
            {sponsors.large_patrons.map((sponsor) => (
              <Sponsor
                key={sponsor.name}
                name={sponsor.name}
                image={sponsor.image}
                link={sponsor.link}
              />
            ))}
          </div>

          <h2>Medium Patrons</h2>
          <div className="width-2 height-2">
            {sponsors.medium_patrons.map((sponsor) => (
              <Sponsor
                key={sponsor.name}
                name={sponsor.name}
                image={sponsor.image}
                link={sponsor.link}
              />
            ))}
          </div>

          <h2>Small Patrons</h2>
          <div className="width-2 height-2">
            {sponsors.small_patrons.map((sponsor) => (
              <Sponsor
                key={sponsor.name}
                name={sponsor.name}
                image={sponsor.image}
                link={sponsor.link}
              />
            ))}
          </div>

          <h2>Supporters</h2>
          <div className="width-1 height-1">
            {sponsors.supporters.map((sponsor) => (
              <Sponsor
                key={sponsor.name}
                name={sponsor.name}
                image={sponsor.image}
                link={sponsor.link}
              />
            ))}
          </div>

          <h2>Friends</h2>
          <div className="width-1 height-1">
            {sponsors.friends.map((sponsor) => (
              <Sponsor
                key={sponsor.name}
                name={sponsor.name}
                image={sponsor.image}
                link={sponsor.link}
              />
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
          { name: 'Facebook', image: 'facebook.png', link: 'https://research.facebook.com/' },
          {
            name: 'Alfred P. Sloan Foundation',
            image: 'sloan.png',
            link: 'https://sloan.org/',
          },
          { name: 'UMass IESL', image: 'umass.png', link: 'http://www.iesl.cs.umass.edu/' },
        ],
        silver: [
          { name: 'Amazon', image: 'amazon.png', link: 'https://www.amazon.science/' },
          { name: 'CZI', image: 'czi.png', link: 'https://chanzuckerberg.com/' },
        ],
        bronze: [
          { name: 'Google', image: 'google.png', link: 'https://research.google/' },
          { name: 'Bloomberg', image: 'bloomberg.png', link: 'https://www.bloomberg.org' },
          { name: 'IBM', image: 'ibm.png', link: 'https://research.ibm.com/' },
          { name: 'DeepMind', image: 'deepmind.png', link: 'https://deepmind.com/' },
        ],
        benefactors: [{ name: 'CDS', image: 'cds.png', link: 'http://ds.cs.umass.edu/' }],
        large_patrons: [
          { name: 'NeurIPS', image: 'neurips.png', link: 'https://nips.cc/' },
          { name: 'ICLR', image: 'iclr.png', link: 'https://iclr.cc/' },
        ],
        medium_patrons: [
          { name: 'MILA', image: 'mila.png', link: 'https://mila.quebec/en/' },
          { name: 'ICML', image: 'icml.png', link: 'https://icml.cc/' },
          { name: 'CVF', image: 'cvf.png', link: 'https://www.thecvf.com/' },
        ],
        small_patrons: [
          { name: 'MIDL', image: 'midl.png', link: 'https://www.midl.io/' },
          { name: 'AKBC', image: 'akbc.png', link: 'https://www.akbc.ws/2021/' },
        ],
        supporters: [{ name: 'AIR', image: 'air.png', link: 'https://www.air.org/' }],
        friends: [
          { name: 'ESWC', image: 'eswc.png', link: 'https://2021.eswc-conferences.org/' },
        ],
      },
    },
  }
}

Sponsors.bodyClass = 'sponsors'
