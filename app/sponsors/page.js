import Link from 'next/link'
import styles from './Sponsors.module.scss'
import Sponsor from './sponsor'

export const metadata = {
  title: 'Sponsors | OpenReview',
}

const sponsors = {
  gold: [
    { name: 'Google', image: 'google.png', link: 'https://research.google/' },
    { name: 'UMass IESL', image: 'umass.png', link: 'http://www.iesl.cs.umass.edu/' },
    {
      name: 'Alfred P. Sloan Foundation',
      image: 'sloan.png',
      link: 'https://sloan.org/',
    },
    { name: 'CZI', image: 'czi.png', link: 'https://chanzuckerberg.com/' },
  ],
  silver: [
    { name: 'Meta', image: 'meta.png', link: 'https://research.facebook.com/' },
    { name: 'Apple', image: 'apple.png', link: 'https://apple.com/' },
  ],
  bronze: [
    { name: 'Bloomberg', image: 'bloomberg.png', link: 'https://www.bloomberg.com' },
    { name: 'IBM', image: 'ibm.png', link: 'https://research.ibm.com/' },
    { name: 'Amazon', image: 'amazon.png', link: 'https://www.amazon.science/' },
  ],
  benefactors: [{ name: 'CDS', image: 'cds.png', link: 'http://ds.cs.umass.edu/' }],
  large_patrons: [
    { name: 'NeurIPS', image: 'neurips.png', link: 'https://nips.cc/' },
    { name: 'ICML', image: 'icml.png', link: 'https://icml.cc/' },
    { name: 'AAAI', image: 'aaai.png', link: 'https://aaai.org/' },
    { name: 'CVF', image: 'cvf.png', link: 'https://www.thecvf.com/' },
  ],
  medium_patrons: [
    { name: 'ICLR', image: 'iclr.png', link: 'https://iclr.cc/' },
    { name: 'ARR', image: 'arr.png', link: 'https://aclrollingreview.org/' },
  ],
  small_patrons: [{ name: 'TMLR', image: 'tmlr.png', link: 'https://jmlr.org/tmlr/' }],
  supporters: [],
  friends: [{ name: 'GitBook', image: 'gitbook.svg', link: 'https://www.gitbook.com/' }],
}
export default function page() {
  return (
    <div className={styles.sponsors}>
      <div className="row">
        <div className="col-xs-12 col-md-10 col-md-offset-1 mb-3 text-center">
          <h1>OpenReview Sponsors</h1>
          <h5>We gratefully acknowledge the support of all our current sponsors:</h5>
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
          <div className="width-3 height-2">
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

          {sponsors.supporters.length > 0 && (
            <>
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
            </>
          )}

          {sponsors.friends.length > 0 && (
            <>
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
            </>
          )}
        </div>
      </div>

      <div className="row mt-2 mb-4">
        <div className="col-xs-12 col-md-10 col-md-offset-1 text-center">
          <stripe-buy-button
            buy-button-id="buy_btn_1S0p87Cl36NCiRDgXCL1qdDL"
            publishable-key="pk_live_51RP76TCl36NCiRDgxC9p1LwEBdv9OyLylD60bImUgP4lKuylNIR6euYrEPd9SNIiJrhzKVdKE4L3pojPkLoD1qPS00hFNOq3y9"
          ></stripe-buy-button>
        </div>
        <div className="col-xs-12 col-md-10 col-md-offset-1 text-center">
          <p>
            <Link href="/sponsors/2023" prefetch={false}>
              View past sponsors from 2023 &raquo;
            </Link>
          </p>
          <p>
            <Link href="/sponsors/2019-2022" prefetch={false}>
              View past sponsors from 2019-2022 &raquo;
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
