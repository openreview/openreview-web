'use client'

import Link from 'next/link'
import styles from '../Sponsors.module.scss'
import Sponsor from '../sponsor'

const sponsors = {
  gold: [
    { name: 'Google', image: 'google.png', link: 'https://research.google/' },
    { name: 'UMass IESL', image: 'umass.png', link: 'http://www.iesl.cs.umass.edu/' },
    {
      name: 'Alfred P. Sloan Foundation',
      image: 'sloan.png',
      link: 'https://sloan.org/',
    },
  ],
  silver: [{ name: 'Amazon', image: 'amazon.png', link: 'https://www.amazon.science/' }],
  bronze: [
    { name: 'Apple', image: 'apple.png', link: 'https://apple.com/' },
    { name: 'IBM', image: 'ibm.png', link: 'https://research.ibm.com/' },
    { name: 'Bloomberg', image: 'bloomberg.png', link: 'https://www.bloomberg.org' },
  ],
  benefactors: [
    { name: 'CDS', image: 'cds.png', link: 'http://ds.cs.umass.edu/' },
    { name: 'DeepMind', image: 'deepmind.png', link: 'https://deepmind.com/' },
  ],
  large_patrons: [
    { name: 'NeurIPS', image: 'neurips.png', link: 'https://nips.cc/' },
    { name: 'ICLR', image: 'iclr.png', link: 'https://iclr.cc/' },
    { name: 'CVF', image: 'cvf.png', link: 'https://www.thecvf.com/' },
    { name: 'ARR', image: 'arr.png', link: 'https://aclrollingreview.org/' },
  ],
  medium_patrons: [
    { name: 'MILA', image: 'mila.png', link: 'https://mila.quebec/en/' },
    { name: 'ICML', image: 'icml.png', link: 'https://icml.cc/' },
  ],
  small_patrons: [
    { name: 'MIDL', image: 'midl.png', link: 'https://www.midl.io/' },
    { name: 'AKBC', image: 'akbc.png', link: 'https://www.akbc.ws/2021/' },
  ],
  supporters: [{ name: 'AIR', image: 'air.png', link: 'https://www.air.org/' }],
  friends: [
    { name: 'ESWC', image: 'eswc.png', link: 'https://2021.eswc-conferences.org/' },
    { name: 'GitBook', image: 'gitbook.svg', link: 'https://www.gitbook.com/' },
  ],
}

export default function Page() {
  return (
    <div className={styles.sponsors}>
      <div className="row">
        <div className="col-xs-12 col-md-10 col-md-offset-1 mb-3 text-center">
          <h1>OpenReview Sponsors 2023</h1>
          <h5>We gratefully acknowledge the support of all our sponsors from 2023:</h5>
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
          <p>
            <Link href="/sponsors">View current sponsors &raquo;</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
