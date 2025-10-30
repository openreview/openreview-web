/* eslint-disable newline-per-chained-call */
// note: existing es index may cause this test to fail. better to empty notes index
import { Selector, Role, RequestMock } from 'testcafe'
import {
  hasTaskUser,
  mergeUser as userF,
  hasNoTaskUser as userB,
  getToken,
  getMessages,
  getNotes,
  getNoteEdits,
  superUserName,
  strongPassword,
} from '../utils/api-helper'

const userBRole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), userB.email)
    .typeText(Selector('#password-input'), userB.password)
    .wait(100)
    .click(Selector('button').withText('Login to OpenReview'))
})

const userARole = Role(`http://localhost:${process.env.NEXT_PORT}`, async (t) => {
  await t
    .click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), hasTaskUser.email)
    .typeText(Selector('#password-input'), hasTaskUser.password)
    .wait(100)
    .click(Selector('button').withText('Login to OpenReview'))
})

const userBAlternateId = '~Di_Xu1'

const responseDBLPXML = `<?xml version="1.0"?>
<dblpperson name="Di Xu 0001" pid="95/7448-1" n="8">
<person key="homepages/95/7448-1" mdate="2019-11-26">
<author pid="95/7448-1">Di Xu 0001</author>
<note type="affiliation">University of British Columbia, Department of Electrical and Computer Engineering, Canada</note>
</person>
<homonyms n="1">
<h f="x/Xu:Di"><person publtype="disambiguation" key="homepages/95/7448" mdate="2019-11-26">
<author pid="95/7448">Di Xu</author>
</person>
</h>
</homonyms>
<r><inproceedings key="conf/3dtv/Coria-MendozaXN12" mdate="2019-11-26">
<author pid="32/5783">Lino Coria-Mendoza</author>
<author pid="95/7448-1">Di Xu 0001</author>
<author pid="55/3871">Panos Nasiopoulos</author>
<title>Automatic stereoscopic 3D video reframing.</title>
<pages>1-4</pages>
<year>2012</year>
<booktitle>3DTV-Conference</booktitle>
<ee>https://doi.org/10.1109/3DTV.2012.6365428</ee>
<crossref>conf/3dtv/2012</crossref>
<url>db/conf/3dtv/3dtv2012.html#Coria-MendozaXN12</url>
</inproceedings>
</r>
<r><inproceedings key="conf/iccel/XuCN12" mdate="2019-11-26">
<author pid="95/7448-1">Di Xu 0001</author>
<author pid="161/3963">Lino E. Coria</author>
<author pid="55/3871">Panos Nasiopoulos</author>
<title>Quality of experience for the horizontal pixel parallax adjustment of stereoscopic 3D videos.</title>
<pages>394-395</pages>
<year>2012</year>
<booktitle>ICCE</booktitle>
<ee>https://doi.org/10.1109/ICCE.2012.6161918</ee>
<crossref>conf/iccel/2012</crossref>
<url>db/conf/iccel/icce2012.html#XuCN12</url>
</inproceedings>
</r>
<r><inproceedings key="conf/ictai/PourazadXN12" mdate="2023-03-24">
<author pid="55/6295">Mahsa T. Pourazad</author>
<author pid="95/7448-1">Di Xu 0001</author>
<author pid="55/3871">Panos Nasiopoulos</author>
<title>Random Forests Based View Generation for Multiview TV.</title>
<pages>367-372</pages>
<year>2012</year>
<crossref>conf/ictai/2012</crossref>
<booktitle>ICTAI</booktitle>
<ee>https://doi.org/10.1109/ICTAI.2012.57</ee>
<ee>https://doi.ieeecomputersociety.org/10.1109/ICTAI.2012.57</ee>
<url>db/conf/ictai/ictai2012.html#PourazadXN12</url>
</inproceedings>
</r>
<r><article key="journals/tvcg/XuDN11" mdate="2019-11-26">
<author pid="95/7448-1">Di Xu 0001</author>
<author pid="58/3497">Colin Doutre</author>
<author pid="55/3871">Panos Nasiopoulos</author>
<title>Correction of Clipped Pixels in Color Images.</title>
<pages>333-344</pages>
<year>2011</year>
<volume>17</volume>
<journal>IEEE Trans. Vis. Comput. Graph.</journal>
<number>3</number>
<ee>https://doi.org/10.1109/TVCG.2010.63</ee>
<ee>http://doi.ieeecomputersociety.org/10.1109/TVCG.2010.63</ee>
<ee>https://www.wikidata.org/entity/Q51701964</ee>
<url>db/journals/tvcg/tvcg17.html#XuDN11</url>
</article>
</r>
<r><inproceedings key="conf/icecsys/XuCN10" mdate="2019-11-26">
<author pid="95/7448-1">Di Xu 0001</author>
<author pid="32/5783">Lino Coria-Mendoza</author>
<author pid="55/3871">Panos Nasiopoulos</author>
<title>Guidelines for capturing high quality stereoscopic content based on a systematic subjective evaluation.</title>
<pages>162-165</pages>
<year>2010</year>
<booktitle>ICECS</booktitle>
<ee>https://doi.org/10.1109/ICECS.2010.5724479</ee>
<crossref>conf/icecsys/2010</crossref>
<url>db/conf/icecsys/icecsys2010.html#XuCN10</url>
</inproceedings>
</r>
<r><inproceedings key="conf/icip/XuDN10" mdate="2019-11-26">
<author pid="95/7448-1">Di Xu 0001</author>
<author pid="58/3497">Colin Doutre</author>
<author pid="55/3871">Panos Nasiopoulos</author>
<title>An improved Bayesian algorithm for color image desaturation.</title>
<pages>1325-1328</pages>
<year>2010</year>
<booktitle>ICIP</booktitle>
<ee>https://doi.org/10.1109/ICIP.2010.5649486</ee>
<crossref>conf/icip/2010</crossref>
<url>db/conf/icip/icip2010.html#XuDN10</url>
</inproceedings>
</r>
<r><inproceedings key="conf/iscas/XuDN10" mdate="2019-11-26">
<author pid="95/7448-1">Di Xu 0001</author>
<author pid="58/3497">Colin Doutre</author>
<author pid="55/3871">Panos Nasiopoulos</author>
<title>Saturated-pixel enhancement for color images.</title>
<pages>3377-3380</pages>
<year>2010</year>
<booktitle>ISCAS</booktitle>
<ee>https://doi.org/10.1109/ISCAS.2010.5537871</ee>
<crossref>conf/iscas/2010</crossref>
<url>db/conf/iscas/iscas2010.html#XuDN10</url>
</inproceedings>
</r>
<r><inproceedings key="conf/icip/XuN09" mdate="2019-11-26">
<author pid="95/7448-1">Di Xu 0001</author>
<author pid="55/3871">Panos Nasiopoulos</author>
<title>Logo insertion transcoding for H.264/AVC compressed video.</title>
<pages>3693-3696</pages>
<year>2009</year>
<booktitle>ICIP</booktitle>
<ee>https://doi.org/10.1109/ICIP.2009.5414225</ee>
<crossref>conf/icip/2009</crossref>
<url>db/conf/icip/icip2009.html#XuN09</url>
</inproceedings>
</r>
<coauthors n="5" nc="1">
<co c="0"><na f="c/Coria:Lino_E=" pid="161/3963">Lino E. Coria</na></co>
<co c="0"><na f="c/Coria=Mendoza:Lino" pid="32/5783">Lino Coria-Mendoza</na></co>
<co c="0"><na f="d/Doutre:Colin" pid="58/3497">Colin Doutre</na></co>
<co c="0"><na f="n/Nasiopoulos:Panos" pid="55/3871">Panos Nasiopoulos</na></co>
<co c="0"><na f="p/Pourazad:Mahsa_T=" pid="55/6295">Mahsa T. Pourazad</na></co>
</coauthors>
</dblpperson>
`

const dblpMock = RequestMock()
  .onRequestTo('https://dblp.org/pid/95/7448-1.xml')
  .respond(responseDBLPXML, 200, { 'access-control-allow-origin': '*', 'content-type': 'application/xml' })

const orcidMock = RequestMock().onRequestTo('https://pub.orcid.org/v3.0/0000-0002-0613-2229/person')
  .respond({
    name: {
      "given-names": {
        "value": "Di"
      },
      "family-name": {
        "value": "Xu"
      },
      "credit-name": null,
      "source": null,
      "visibility": "public",
      "path": "0000-0002-0613-2229"
    },
    "other-names": {
      "other-name"
        : []
    },
  }, 200, { 'access-control-allow-origin': '*', 'content-type': 'application/json' })
  .onRequestTo('https://pub.orcid.org/v3.0/0000-0002-0613-2229/works')
  .respond({
    group: [
      {
        "last-modified-date": {
          "value": 1659733982465
        },
        "external-ids": {
          "external-id": [
            {
              "external-id-type": "doi",
              "external-id-value": "10.1364/OE.413844",
              "external-id-normalized": {
                "value": "10.1364/oe.413844",
                "transient": true
              },
              "external-id-normalized-error": null,
              "external-id-url": {
                "value": "https://doi.org/10.1364/OE.413844"
              },
              "external-id-relationship": "self"
            }
          ]
        },
        "work-summary": [
          {
            "put-code": 89975745,
            "created-date": {
              "value": 1614900258303
            },
            "last-modified-date": {
              "value": 1659733982465
            },
            "source": {
              "source-orcid": null,
              "source-client-id": {
                "uri": "https://orcid.org/client/0000-0001-9884-1913",
                "path": "0000-0001-9884-1913",
                "host": "orcid.org"
              },
              "source-name": {
                "value": "Crossref"
              },
              "assertion-origin-orcid": null,
              "assertion-origin-client-id": null,
              "assertion-origin-name": null
            },
            "title": {
              "title": {
                "value": "Verification of cascade optical coherence tomography for freeform optics form metrology"
              },
              "subtitle": null,
              "translated-title": null
            },
            "external-ids": {
              "external-id": [
                {
                  "external-id-type": "doi",
                  "external-id-value": "10.1364/OE.413844",
                  "external-id-normalized": {
                    "value": "10.1364/oe.413844",
                    "transient": true
                  },
                  "external-id-normalized-error": null,
                  "external-id-url": {
                    "value": "https://doi.org/10.1364/OE.413844"
                  },
                  "external-id-relationship": "self"
                }
              ]
            },
            "url": {
              "value": "https://doi.org/10.1364/OE.413844"
            },
            "type": "journal-article",
            "publication-date": {
              "year": {
                "value": "2021"
              },
              "month": {
                "value": "03"
              },
              "day": {
                "value": "15"
              }
            },
            "journal-title": {
              "value": "Optics Express"
            },
            "visibility": "public",
            "path": "/0000-0002-0613-2229/work/89975745",
            "display-index": "0"
          }
        ]
      },
      {
        "last-modified-date": {
          "value": 1663265211991
        },
        "external-ids": {
          "external-id": [
            {
              "external-id-type": "doi",
              "external-id-value": "10.1364/OE.394638",
              "external-id-normalized": {
                "value": "10.1364/oe.394638",
                "transient": true
              },
              "external-id-normalized-error": null,
              "external-id-url": {
                "value": "https://doi.org/10.1364/OE.394638"
              },
              "external-id-relationship": "self"
            }
          ]
        },
        "work-summary": [
          {
            "put-code": 76065020,
            "created-date": {
              "value": 1592855844182
            },
            "last-modified-date": {
              "value": 1663265211991
            },
            "source": {
              "source-orcid": null,
              "source-client-id": {
                "uri": "https://orcid.org/client/0000-0001-9884-1913",
                "path": "0000-0001-9884-1913",
                "host": "orcid.org"
              },
              "source-name": {
                "value": "Crossref"
              },
              "assertion-origin-orcid": null,
              "assertion-origin-client-id": null,
              "assertion-origin-name": null
            },
            "title": {
              "title": {
                "value": "Cascade optical coherence tomography (C-OCT)"
              },
              "subtitle": null,
              "translated-title": null
            },
            "external-ids": {
              "external-id": [
                {
                  "external-id-type": "doi",
                  "external-id-value": "10.1364/OE.394638",
                  "external-id-normalized": {
                    "value": "10.1364/oe.394638",
                    "transient": true
                  },
                  "external-id-normalized-error": null,
                  "external-id-url": {
                    "value": "https://doi.org/10.1364/OE.394638"
                  },
                  "external-id-relationship": "self"
                }
              ]
            },
            "url": {
              "value": "https://doi.org/10.1364/OE.394638"
            },
            "type": "journal-article",
            "publication-date": {
              "year": {
                "value": "2020"
              },
              "month": {
                "value": "07"
              },
              "day": {
                "value": "06"
              }
            },
            "journal-title": {
              "value": "Optics Express"
            },
            "visibility": "public",
            "path": "/0000-0002-0613-2229/work/76065020",
            "display-index": "0"
          }
        ]
      },
      {
        "last-modified-date": {
          "value": 1653805860366
        },
        "external-ids": {
          "external-id": [
            {
              "external-id-type": "doi",
              "external-id-value": "10.1364/OE.27.034593",
              "external-id-normalized": {
                "value": "10.1364/oe.27.034593",
                "transient": true
              },
              "external-id-normalized-error": null,
              "external-id-url": {
                "value": "https://doi.org/10.1364/OE.27.034593"
              },
              "external-id-relationship": "self"
            }
          ]
        },
        "work-summary": [
          {
            "put-code": 64418159,
            "created-date": {
              "value": 1573499904152
            },
            "last-modified-date": {
              "value": 1653805860366
            },
            "source": {
              "source-orcid": null,
              "source-client-id": {
                "uri": "https://orcid.org/client/0000-0001-9884-1913",
                "path": "0000-0001-9884-1913",
                "host": "orcid.org"
              },
              "source-name": {
                "value": "Crossref"
              },
              "assertion-origin-orcid": null,
              "assertion-origin-client-id": null,
              "assertion-origin-name": null
            },
            "title": {
              "title": {
                "value": "Absolute linear-in-k spectrometer designs enabled by freeform optics"
              },
              "subtitle": null,
              "translated-title": null
            },
            "external-ids": {
              "external-id": [
                {
                  "external-id-type": "doi",
                  "external-id-value": "10.1364/OE.27.034593",
                  "external-id-normalized": {
                    "value": "10.1364/oe.27.034593",
                    "transient": true
                  },
                  "external-id-normalized-error": null,
                  "external-id-url": {
                    "value": "https://doi.org/10.1364/OE.27.034593"
                  },
                  "external-id-relationship": "self"
                }
              ]
            },
            "url": {
              "value": "https://doi.org/10.1364/OE.27.034593"
            },
            "type": "journal-article",
            "publication-date": null, // no pdate, should be filtered out
            "journal-title": {
              "value": "Optics Express"
            },
            "visibility": "public",
            "path": "/0000-0002-0613-2229/work/64418159",
            "display-index": "0"
          }
        ]
      },
    ]
  }, 200, { 'access-control-allow-origin': '*', 'content-type': 'application/json' })
  .onRequestTo('https://pub.orcid.org/v3.0/0000-0002-0613-2229/works/89975745,76065020')
  .respond({
    "bulk": [
      {
        "work": {
          "created-date": {
            "value": 1592855844182
          },
          "last-modified-date": {
            "value": 1663265211991
          },
          "source": {
            "source-orcid": null,
            "source-client-id": {
              "uri": "https://orcid.org/client/0000-0001-9884-1913",
              "path": "0000-0001-9884-1913",
              "host": "orcid.org"
            },
            "source-name": {
              "value": "Crossref"
            },
            "assertion-origin-orcid": null,
            "assertion-origin-client-id": null,
            "assertion-origin-name": null
          },
          "put-code": 76065020,
          "path": "/0000-0002-0613-2229/work/76065020",
          "title": {
            "title": {
              "value": "Cascade optical coherence tomography (C-OCT)"
            },
            "subtitle": null,
            "translated-title": null
          },
          "journal-title": {
            "value": "Optics Express"
          },
          "short-description": null,
          "citation": {
            "citation-type": "bibtex",
            "citation-value": "<head>\n<META HTTP-EQUIV=\"Refresh\" CONTENT=\"0;URL=/servlet/useragent\">\n</head>\n"
          },
          "type": "journal-article",
          "publication-date": {
            "year": {
              "value": "2020"
            },
            "month": {
              "value": "07"
            },
            "day": {
              "value": "06"
            }
          },
          "external-ids": {
            "external-id": [
              {
                "external-id-type": "doi",
                "external-id-value": "10.1364/OE.394638",
                "external-id-normalized": {
                  "value": "10.1364/oe.394638",
                  "transient": true
                },
                "external-id-normalized-error": null,
                "external-id-url": {
                  "value": "https://doi.org/10.1364/OE.394638"
                },
                "external-id-relationship": "self"
              }
            ]
          },
          "url": {
            "value": "https://doi.org/10.1364/OE.394638"
          },
          "contributors": {
            "contributor": [
              {
                "contributor-orcid": null,
                "credit-name": {
                  "value": "Di Xu"
                },
                "contributor-email": null,
                "contributor-attributes": {
                  "contributor-sequence": null,
                  "contributor-role": "author"
                }
              },
              {
                "contributor-orcid": null,
                "credit-name": {
                  "value": "Andres Garcia Coleto"
                },
                "contributor-email": null,
                "contributor-attributes": {
                  "contributor-sequence": null,
                  "contributor-role": "author"
                }
              },
              {
                "contributor-orcid": null,
                "credit-name": {
                  "value": "Benjamin Moon"
                },
                "contributor-email": null,
                "contributor-attributes": {
                  "contributor-sequence": null,
                  "contributor-role": "author"
                }
              },
              {
                "contributor-orcid": null,
                "credit-name": {
                  "value": "Jonathan C. Papa"
                },
                "contributor-email": null,
                "contributor-attributes": {
                  "contributor-sequence": null,
                  "contributor-role": "author"
                }
              },
              {
                "contributor-orcid": null,
                "credit-name": {
                  "value": "Michael Pomerantz"
                },
                "contributor-email": null,
                "contributor-attributes": {
                  "contributor-sequence": null,
                  "contributor-role": "author"
                }
              },
              {
                "contributor-orcid": null,
                "credit-name": {
                  "value": "Jannick P. Rolland"
                },
                "contributor-email": null,
                "contributor-attributes": {
                  "contributor-sequence": null,
                  "contributor-role": "author"
                }
              }
            ]
          },
          "language-code": null,
          "country": null,
          "visibility": "public"
        }
      },
      {
        "work": {
          "created-date": {
            "value": 1614900258303
          },
          "last-modified-date": {
            "value": 1659733982465
          },
          "source": {
            "source-orcid": null,
            "source-client-id": {
              "uri": "https://orcid.org/client/0000-0001-9884-1913",
              "path": "0000-0001-9884-1913",
              "host": "orcid.org"
            },
            "source-name": {
              "value": "Crossref"
            },
            "assertion-origin-orcid": null,
            "assertion-origin-client-id": null,
            "assertion-origin-name": null
          },
          "put-code": 89975745,
          "path": "/0000-0002-0613-2229/work/89975745",
          "title": {
            "title": {
              "value": "Verification of cascade optical coherence tomography for freeform optics form metrology"
            },
            "subtitle": null,
            "translated-title": null
          },
          "journal-title": {
            "value": "Optics Express"
          },
          "short-description": null,
          "citation": {
            "citation-type": "bibtex",
            "citation-value": "@article{Xu_2021,\n\tdoi = {10.1364/oe.413844},\n\turl = {https://doi.org/10.1364%2Foe.413844},\n\tyear = 2021,\n\tmonth = {mar},\n\tpublisher = {The Optical Society},\n\tvolume = {29},\n\tnumber = {6},\n\tpages = {8542},\n\tauthor = {Di Xu and Zhenkun Wen and Andres Garcia Coleto and Michael Pomerantz and John C. Lambropoulos and Jannick P. Rolland},\n\ttitle = {Verification of cascade optical coherence tomography for freeform optics form metrology},\n\tjournal = {Optics Express}\n}"
          },
          "type": "journal-article",
          "publication-date": {
            "year": {
              "value": "2021"
            },
            "month": {
              "value": "03"
            },
            "day": {
              "value": "15"
            }
          },
          "external-ids": {
            "external-id": [
              {
                "external-id-type": "doi",
                "external-id-value": "10.1364/OE.413844",
                "external-id-normalized": {
                  "value": "10.1364/oe.413844",
                  "transient": true
                },
                "external-id-normalized-error": null,
                "external-id-url": {
                  "value": "https://doi.org/10.1364/OE.413844"
                },
                "external-id-relationship": "self"
              }
            ]
          },
          "url": {
            "value": "https://doi.org/10.1364/OE.413844"
          },
          "contributors": {
            "contributor": [
              {
                "contributor-orcid": null,
                "credit-name": {
                  "value": "Di Xu"
                },
                "contributor-email": null,
                "contributor-attributes": {
                  "contributor-sequence": null,
                  "contributor-role": "author"
                }
              },
              {
                "contributor-orcid": null,
                "credit-name": {
                  "value": "Zhenkun Wen"
                },
                "contributor-email": null,
                "contributor-attributes": {
                  "contributor-sequence": null,
                  "contributor-role": "author"
                }
              },
              {
                "contributor-orcid": null,
                "credit-name": {
                  "value": "Andres Garcia Coleto"
                },
                "contributor-email": null,
                "contributor-attributes": {
                  "contributor-sequence": null,
                  "contributor-role": "author"
                }
              },
              {
                "contributor-orcid": null,
                "credit-name": {
                  "value": "Michael Pomerantz"
                },
                "contributor-email": null,
                "contributor-attributes": {
                  "contributor-sequence": null,
                  "contributor-role": "author"
                }
              },
              {
                "contributor-orcid": null,
                "credit-name": {
                  "value": "John C. Lambropoulos"
                },
                "contributor-email": null,
                "contributor-attributes": {
                  "contributor-sequence": null,
                  "contributor-role": "author"
                }
              },
              {
                "contributor-orcid": null,
                "credit-name": {
                  "value": "Jannick P. Rolland"
                },
                "contributor-email": null,
                "contributor-attributes": {
                  "contributor-sequence": null,
                  "contributor-role": "author"
                }
              }
            ]
          },
          "language-code": null,
          "country": null,
          "visibility": "public"
        }
      }
    ]
  }, 200, { 'access-control-allow-origin': '*', 'content-type': 'application/json' })
// #region long repeated selectors
const errorMessageSelector = Selector('#flash-message-container', {
  visibilityCheck: true,
})
const editFullNameInputSelector = Selector('input:not([readonly]).full-name')
const nameSectionPlusIconSelector = Selector('section').find('.glyphicon-plus-sign')
const emailSectionPlusIconSelector = Selector('section').find('.glyphicon-plus-sign')
const editEmailInputSelector = Selector('input:not([readonly]).email')
const emailConfirmButtons = Selector('section').find('button').withText('Confirm')
const emailRemoveButtons = Selector('section').find('button').withText('Remove')
const pageHeader = Selector('div.title-container').find('h1')
const profileViewEmail = Selector('section.emails').find('span')
const addDBLPPaperToProfileButton = Selector('button.personal-links__adddblpbtn')
const persistentUrlInput = Selector('div.persistent-url-input').find('input')
const showPapersButton = Selector('div.persistent-url-input')
  .find('button')
  .withText('Show Papers')
const dblpImportModalCancelButton = Selector('#dblp-import-modal')
  .find('button')
  .withText('Cancel')
const dblpImportModalAddToProfileBtn = Selector('#dblp-import-modal')
  .find('button')
  .withText('Add to Your Profile')
const dblpImportModalSelectCount = Selector('#dblp-import-modal').find('div.selected-count')
const saveProfileButton = Selector('button').withText('Save Profile Changes')
const cancelButton = Selector('div.buttons-row').find('button').withText('Exit Edit Mode')
const nameMakePreferredButton = Selector('div.container.names')
  .find('button.preferred_button')
  .filterVisible()
  .nth(0)
const dblpUrlInput = Selector('#dblp_url')
const aclanthologyUrlInput = Selector('#aclanthology_url')
const homepageUrlInput = Selector('#homepage_url')
const yearOfBirthInput = Selector('section').nth(2).find('input') // gender pronouns year of birth
const firstHistoryEndInput = Selector('div.history')
  .find('input')
  .withAttribute('placeholder', 'end year')
  .nth(0)
const messageSelector = Selector('span').withAttribute('class', 'important_message')
const messagePanelSelector = Selector('#flash-message-container')
const step0Names = Selector('div[step="0"]').find('div[role="button"]')
const step1PeronalInfo = Selector('div[step="1"]').find('div[role="button"]')
const step2Emails = Selector('div[step="2"]').find('div[role="button"]')
const step3Links = Selector('div[step="3"]').find('div[role="button"]')
const step4History = Selector('div[step="4"]').find('div[role="button"]')
const step5Relations = Selector('div[step="5"]').find('div[role="button"]')
const step6Expertise = Selector('div[step="6"]').find('div[role="button"]')
const orcidUrlInput = Selector('#orcid_url')
const addORCIDPapersToProfileButton = Selector('button.personal-links__addorcidbtn')
const orcidImportModalAddToProfileBtn = Selector('#orcid-import-modal')
  .find('button')
  .withText('Add to Your Profile')

// #endregion

fixture`Profile page`.before(async (ctx) => {
  ctx.superUserToken = await getToken(superUserName, strongPassword)
  return ctx
}).requestHooks(dblpMock)

test('user open own profile', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}`)
    .click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), hasTaskUser.email)
    .typeText(Selector('#password-input'), hasTaskUser.password)
    .wait(100)
    .click(Selector('button').withText('Login to OpenReview'))
    .click(Selector('a.dropdown-toggle'))
    .click(Selector('a').withText('Profile'))
    .expect(Selector('#edit-banner').find('a').innerText)
    .eql('Edit Profile')
    // go to profile edit page
    .click(Selector('a').withText('Edit Profile'))
    .expect(Selector('h1').withText('Edit Profile').exists)
    .ok()
    .click(step3Links)
    .expect(addDBLPPaperToProfileButton.hasAttribute('disabled'))
    .ok()
    .expect(Selector('ul.submissions-list').find('.note').count)
    .eql(0) // no imported papers
    .expect(saveProfileButton.exists)
    .ok()
    // make some changes and save
    // add a name
    .click(step0Names)
    .click(nameSectionPlusIconSelector)
    .typeText(editFullNameInputSelector, '111', { paste: true })
    .expect(errorMessageSelector.innerText)
    .eql(
      'Error: The name 111 is invalid. Only letters, single hyphens, single dots at the end of a name, and single spaces are allowed'
    )
    .typeText(editFullNameInputSelector, '`', { replace: true })
    .expect(errorMessageSelector.innerText)
    .eql(
      'Error: The name ` is invalid. Only letters, single hyphens, single dots at the end of a name, and single spaces are allowed'
    )
    .click(Selector('button.remove_button').filterVisible())
    // add a email
    .click(step2Emails)
    .expect(
      Selector('p').withText(
        'Your profile does not contain any company/institution email and it can take up to 2 weeks for your profile to be activated.'
      ).exists
    )
    .notOk() // not activation
    .click(emailSectionPlusIconSelector)
    .typeText(editEmailInputSelector, 'a@aa.')
    .expect(emailConfirmButtons.exists)
    .notOk() // should have no buttons when email is invalid
    .expect(emailRemoveButtons.exists)
    .notOk()
    .typeText(editEmailInputSelector, 'a@aa.com', { replace: true })
    .expect(emailConfirmButtons.nth(0).visible)
    .ok() // should show buttons when added email is valid
    .expect(emailRemoveButtons.nth(0).visible)
    .ok()
    .click(Selector('button').withText('Confirm').filterVisible())
    .expect(errorMessageSelector.innerText)
    .eql('A confirmation email has been sent to a@aa.com with confirmation instructions')
    // text box to enter code should be displayed
    .expect(Selector('button').withText('Verify').nth(0).visible)
    .ok()
    .expect(Selector('input[placeholder="Enter Verification Token"]').visible)
    .ok()
    .click(Selector('button').withText('Remove').filterVisible())
    .expect(Selector('button').withText('Verify').nth(0).visible)
    .notOk()
    .expect(Selector('input[placeholder="Enter Verification Token"]').visible)
    .notOk()
    // add empty homepage link
    .click(step3Links)
    .typeText(homepageUrlInput, ' ', { replace: true })
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText)
    .eql('Error: You must enter at least one personal link')
    // show error for all personal links
    .expect(homepageUrlInput.hasClass('invalid-value'))
    .ok()
    .expect(Selector('#gscholar_url').hasClass('invalid-value'))
    .ok()
    .expect(dblpUrlInput.hasClass('invalid-value'))
    .ok()
    .expect(Selector('#orcid_url').hasClass('invalid-value'))
    .ok()
    .expect(Selector('#wikipedia_url').hasClass('invalid-value'))
    .ok()
    .expect(Selector('#linkedin_url').hasClass('invalid-value'))
    .ok()
    .expect(Selector('#semanticScholar_url').hasClass('invalid-value'))
    .ok()
    .expect(Selector('#aclanthology_url').hasClass('invalid-value'))
    .ok()

  const { superUserToken } = t.fixtureCtx
  const messages = await getMessages(
    { to: 'a@aa.com', subject: 'OpenReview Email Confirmation' },
    superUserToken
  )
  await t
    .expect(messages[0].content.text)
    .contains(
      'to confirm an alternate email address a@aa.com. If you would like to confirm this email, please use the verification token mentioned below'
    )
    // personal links
    .expect(addDBLPPaperToProfileButton.hasAttribute('disabled'))
    .ok()
    .typeText(dblpUrlInput, 'http://test.com', { replace: true, paste: true })
    .expect(addDBLPPaperToProfileButton.hasAttribute('disabled'))
    .notOk() // button is enabled
    // save
    .typeText(homepageUrlInput, 'http://google.com', { replace: true, paste: true })
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText)
    .eql(
      'Error: dblp link is invalid. A valid link should include https://dblp.org/pid/'
    )
    .selectText(dblpUrlInput)
    .pressKey('delete')
    // add empty expertise
    .click(step6Expertise)
    .typeText(Selector('div.expertise').find('input').nth(0), '        ')
    .click(saveProfileButton)
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
    .expect(errorMessageSelector.innerText)
    .eql('Your profile information has been successfully updated')
}).skipJsErrors({
  message: "[Cloudflare Turnstile] Error: 300030."
})

test('add and delete year of birth', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    // add invalid year of birth
    .click(step1PeronalInfo)
    .typeText(yearOfBirthInput, '0000')
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText)
    .contains(`yearOfBirth must be >= ${new Date().getFullYear() - 100}`)
    // add valid year of birth
    .typeText(yearOfBirthInput, '2000')
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText)
    .eql('Your profile information has been successfully updated')

  await t
    // remove year of birth
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step1PeronalInfo)
    .expect(yearOfBirthInput.value)
    .eql('2000')
    .selectText(yearOfBirthInput)
    .pressKey('delete')
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText)
    .eql('Your profile information has been successfully updated')

  await t
    // verify year of birth has been removed
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step1PeronalInfo)
    .expect(yearOfBirthInput.value)
    .eql('')
})

test('add and delete pronouns', async (t) => {
  const customPronouns = 'Ze/Zir/Hir'

  // use he/him pronouns & check if pronouns updated on profile
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step1PeronalInfo)
    .click(Selector('div.pronouns-dropdown__control'))
    .wait(1000)
    .click(Selector('div.pronouns-dropdown__option').nth(2))
    .click(saveProfileButton)
    .wait(200)
    .click(cancelButton)
    .expect(Selector('h4').nth(0).textContent)
    .eql('Pronouns: he/him')

  // Type custom pronouns & check if pronouns updated on profile

  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step1PeronalInfo)
    .typeText(Selector('div.pronouns'), customPronouns)
    .wait(500)
    .click(Selector('div.pronouns-dropdown__option').nth(0))
    .click(saveProfileButton)
    .wait(200)
    .click(cancelButton) // to navigate to profile view
    .expect(Selector('h4').nth(0).textContent)
    .eql(`Pronouns: ${customPronouns}`)

  // Don't Specify pronouns & check if pronouns not shown on profile

  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step1PeronalInfo)
    .click(Selector('div.pronouns-dropdown__control'))
    .wait(500)
    .click(Selector('div.pronouns-dropdown__option').nth(3))
    .click(saveProfileButton)
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
    .click(cancelButton)
    .expect(Selector('h4').nth(0).textContent)
    .notEql('Pronouns: he/him')
})

test('add and delete geolocation of history', async (t) => {
  // update geolocation info of history
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step4History)
    .click(Selector('input.region-dropdown__placeholder')) // show dropdown
    .click(Selector('div.country-dropdown__option').nth(3))
    .typeText(Selector('input.institution-city'), 'test city', { replace: true })
    .typeText(Selector('input.institution-state'), 'test state', { replace: true })
    .typeText(Selector('input.institution-department'), 'test department')
    .click(saveProfileButton)
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
    .click(cancelButton)
    .expect(Selector('.glyphicon-map-marker').exists)
    .ok()
    .expect(
      Selector('.glyphicon-map-marker').withAttribute(
        'data-original-title',
        'test city, test state, MX'
      ).exists
    )
    .ok()

  // remove state and city
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step4History)
    .selectText(Selector('input.institution-state'))
    .pressKey('delete')
    .selectText(Selector('input.institution-city'))
    .pressKey('delete')
    .click(saveProfileButton)
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
    .click(cancelButton)
    .expect(Selector('.glyphicon-map-marker').exists)
    .ok()
    .expect(
      Selector('.glyphicon-map-marker').withAttribute(
        'data-original-title',
        'MX'
      ).exists
    )
    .ok()

  // remove country/region should fail as it's mandatory
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step4History)
    .click(Selector('input.region-dropdown__placeholder'))
    .click(Selector('div.country-dropdown__control'))
    .pressKey('delete')
    .click(step4History) // to collapse dropdown
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText)
    .eql('Error: There are errors in your Career & Education History.')
    .expect(Selector('span.invalid-value-icon').withAttribute('data-original-title', 'Country/Region is required for current positions').exists).ok()
})

test('add links', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step3Links)
    // add invalid acl url
    .typeText(aclanthologyUrlInput, 'https://aclanthology.org/invalid_url')
    .pressKey('tab')
    .expect(aclanthologyUrlInput.hasClass('invalid-value'))
    .ok()
    .expect(errorMessageSelector.innerText)
    .eql('Error: https://aclanthology.org/invalid_url is not a valid ACL Anthology URL')
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText)
    .eql(
      'Error: One of your personal links is invalid. Please make sure all URLs start with http:// or https://'
    )
    .expect(aclanthologyUrlInput.hasClass('invalid-value'))
    .ok()
    // add valid acl url
    .typeText(aclanthologyUrlInput, 'https://aclanthology.org/people/userB', { replace: true })
    .pressKey('tab')
    .expect(aclanthologyUrlInput.hasClass('invalid-value'))
    .notOk()
    .click(saveProfileButton)
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
    .expect(errorMessageSelector.innerText)
    .eql('Your profile information has been successfully updated')
})

test('add relation', async (t) => {
  const firstRelationRow = Selector('div.relation').find('div.row').nth(1)
  const secondRelationRow = Selector('div.relation').find('div.row').nth(2)
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step5Relations)
    // add a relation by name
    .click(firstRelationRow.find('div.relation__value').nth(0)) // relation dropdown
    .click(Selector('div.relation-dropdown__option').nth(3))
    .typeText(firstRelationRow.find('input.search-input'), 'FirstA')
    .pressKey('enter')
    .expect(
      firstRelationRow.find('a').withAttribute('href', '/profile?id=~FirstA_LastA1').exists
    )
    .ok()
    .click(firstRelationRow.find('.glyphicon-plus'))
    .typeText(
      firstRelationRow.find('input').withAttribute('placeholder', 'year').nth(0),
      '1999'
    )
    .typeText(
      firstRelationRow.find('input').withAttribute('placeholder', 'year').nth(1),
      '2023'
    )
    // add a custom relation
    .click(secondRelationRow.find('div.relation__value').nth(0)) // relation dropdown
    .click(Selector('div.relation-dropdown__option').nth(3))
    .typeText(secondRelationRow.find('input.search-input'), 'Some Relation Name')
    .pressKey('enter')
    .expect(
      secondRelationRow.find('div').withText('No results found for your search query.').exists
    )
    .ok()
    .click(secondRelationRow.find('button').withText('Manually Enter Relation Info'))
    .typeText(
      secondRelationRow.find('input').withAttribute('name', 'fullName'),
      'Some Relation Name'
    )
    .typeText(
      secondRelationRow.find('input').withAttribute('name', 'email'),
      'test@relation.test'
    )
    .click(secondRelationRow.find('button').withText('Add'))
    .typeText(
      secondRelationRow.find('input').withAttribute('placeholder', 'year').nth(0),
      '1999'
    )
    .typeText(
      secondRelationRow.find('input').withAttribute('placeholder', 'year').nth(1),
      '2023'
    )
    .click(saveProfileButton)
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
    .click(cancelButton)
    // verify relation is added
    .expect(Selector('span').withText('Some Relation Name').exists)
    .ok()
    .expect(Selector('a').withAttribute('href', '/profile?id=~FirstA_LastA1').textContent)
    .eql('FirstA LastA')

  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step5Relations)
    .expect(
      firstRelationRow.find('a').withAttribute('href', '/profile?id=~FirstA_LastA1')
        .textContent
    )
    .eql('FirstA LastA')
    .expect(secondRelationRow.find('span').withText('Some Relation Name').exists)
    .ok()
    .expect(secondRelationRow.find('span').withText('<test@relation.test>').exists)
    .ok()
    // clear value
    .click(firstRelationRow.find('.glyphicon-edit'))
    .expect(
      firstRelationRow
        .find('input.search-input')
        .withAttribute('placeholder', 'Search relation by name or email').exists
    )
    .ok()
    .click(secondRelationRow.find('.glyphicon-edit'))
    .expect(
      secondRelationRow
        .find('input.search-input')
        .withAttribute('placeholder', 'Search relation by name or email').exists
    )
    .ok()
    .click(firstRelationRow.find('.glyphicon-minus-sign'))
    .click(firstRelationRow.find('.glyphicon-minus-sign')) // second row becomes first row
    .click(saveProfileButton)
})

test('add expertise', async (t) => {
  const firstExpertiseRow = Selector('div.expertise').find('div.row').nth(1)
  const secondExpertiseRow = Selector('div.expertise').find('div.row').nth(2)
  const thirdExpertiseRow = Selector('div.expertise').find('div.row').nth(3)
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step6Expertise)
    // add expertise correctly
    .typeText(
      firstExpertiseRow.find('div.expertise__value').nth(0).find('input'),
      'some,correct,expertise'
    )
    .typeText(firstExpertiseRow.find('div.expertise__value').nth(1).find('input'), '1999')
    .typeText(firstExpertiseRow.find('div.expertise__value').nth(2).find('input'), '2000')
    // add empty expertise
    .typeText(
      secondExpertiseRow.find('div.expertise__value').nth(0).find('input'),
      '   ,   ,   ,   '
    )
    .typeText(secondExpertiseRow.find('div.expertise__value').nth(1).find('input'), '1999')
    // add expertise with empty value
    .typeText(
      thirdExpertiseRow.find('div.expertise__value').nth(0).find('input'),
      'other expertise,   '
    )
    .typeText(thirdExpertiseRow.find('div.expertise__value').nth(1).find('input'), '1999')
    .click(saveProfileButton)
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
    .click(cancelButton)
    // verify relation is added
    .expect(Selector('span').withText('other expertise').exists)
    .ok()
    .expect(Selector('span').withText('some, correct, expertise').exists)
    .ok()
    .expect(Selector('div.start-end-year').withText('1999 – Present').exists)
    .ok()
    .expect(Selector('div.start-end-year').withText('1999 – 2000').exists)
    .ok()
})

test('import paper from dblp', async (t) => {
  const testPersistentUrl = 'https://dblp.org/pid/95/7448-1'
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step3Links)
    .expect(addDBLPPaperToProfileButton.hasAttribute('disabled'))
    .ok()
    // put incorrect persistant url
    .typeText(dblpUrlInput, 'xxx', { paste: true })
    .expect(addDBLPPaperToProfileButton.hasAttribute('disabled'))
    .notOk()
    .expect(Selector('#dblp-import-modal').visible)
    .notOk()
    .click(addDBLPPaperToProfileButton)
    .expect(Selector('#dblp-import-modal').visible)
    .ok()
    .expect(Selector('#dblp-import-modal').find('div.body-message').innerText)
    .contains('Visit your DBLP home page: xxx')
    // put persistent url of other people in modal
    .wait(500)
    .typeText(persistentUrlInput, testPersistentUrl, { replace: true, paste: true })
    .click(showPapersButton)
    .expect(Selector('#dblp-import-modal').find('div.modal-body>p').nth(0).innerText)
    .contains(
      'Your OpenReview profile must contain the EXACT name used in your DBLP papers.',
      undefined,
      { timeout: 5000 }
    )
    .click(dblpImportModalCancelButton)
    // put persistent url of other people in page
    .typeText(dblpUrlInput, testPersistentUrl, { replace: true, paste: true })
    .click(addDBLPPaperToProfileButton)
    .expect(Selector('#dblp-import-modal').find('div.modal-body>p').nth(0).innerText)
    .contains(
      'Your OpenReview profile must contain the EXACT name used in your DBLP papers.',
      undefined,
      { timeout: 5000 }
    )
    .click(dblpImportModalCancelButton)
    .click(step0Names)
    // add name to skip validation error
    .click(nameSectionPlusIconSelector)
    .typeText(editFullNameInputSelector, 'Di Xu')
    .click(saveProfileButton)
    // wait until profile save complete
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })

  await t.click(step3Links)
    .click(addDBLPPaperToProfileButton)
    .expect(Selector('#dblp-import-modal').find('div.modal-body').innerText)
    .contains('Please select the new publications of which you are actually an author.')
    // import 2 papers
    .expect(dblpImportModalAddToProfileBtn.hasAttribute('disabled'))
    .ok()
    .click(
      Selector('#dblp-import-modal')
        .find('div')
        .withAttribute('class', 'publication-info')
        .nth(0)
        .find('input')
    )
    .expect(dblpImportModalSelectCount.innerText)
    .eql('1 publication selected')
    .expect(dblpImportModalAddToProfileBtn.hasAttribute('disabled'))
    .notOk()
    .click(
      Selector('#dblp-import-modal')
        .find('div')
        .withAttribute('class', 'publication-info')
        .nth(1)
        .find('input')
    )
    .expect(dblpImportModalSelectCount.innerText)
    .eql('2 publications selected')
    // test year checkbox
    .click(
      Selector('#dblp-import-modal')
        .find('div')
        .withAttribute('class', 'publication-info')
        .nth(0)
        .find('input')
    )
    .click(
      Selector('#dblp-import-modal')
        .find('div')
        .withAttribute('class', 'publication-info')
        .nth(1)
        .find('input')
    )
    .click(
      Selector('#dblp-import-modal')
        .find('h4.panel-title')
        .nth(0)
        .find('input')
        .withAttribute('class', 'year-checkbox')
    )
    .expect(dblpImportModalSelectCount.innerText)
    .eql('3 publications selected')
    .click(
      Selector('#dblp-import-modal')
        .find('div')
        .withAttribute('class', 'publication-info')
        .nth(2)
        .find('input')
    )

    .click(dblpImportModalAddToProfileBtn)
    .expect(Selector('#dblp-import-modal').find('.modal-body').find('p').innerText)
    .contains('2 publications were successfully imported.')
    .click(Selector('#dblp-import-modal').find('span').withExactText('×'))
    .expect(Selector('ul.submissions-list').find('.glyphicon-minus-sign').count)
    .eql(2) // imported 2 papers are removable/unlinkable
})

test('imported paper has banner back to profile edit', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step3Links)
    .click(addDBLPPaperToProfileButton)
    .expect(Selector('div.publication-title').nth(0).find('a').getAttribute('href'))
    .contains('referrer=[profile](/profile/edit)')
})

test('unlink paper', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile`)
    .expect(Selector('ul.submissions-list').find('div.note').count)
    .eql(2) // profile view has the 2 papers imported
    .click(Selector('a').withText('Edit Profile'))
    .click(step3Links)
    .click(Selector('ul.submissions-list').find('.glyphicon-minus-sign').nth(1)) // unlink 2nd paper
    .expect(Selector('ul.submissions-list').find('div.unlinked-publication').count)
    .eql(1)
    .expect(Selector('ul.submissions-list').find('.glyphicon-minus-sign').count)
    .eql(1)
    .expect(Selector('ul.submissions-list').find('.glyphicon-repeat').count)
    .eql(1)
    .click(Selector('ul.submissions-list').find('.glyphicon-repeat').nth(0)) // relink
    .expect(Selector('ul.submissions-list').find('.glyphicon-minus-sign').count)
    .eql(2) // still 2 papers removable
    // keep 1 publication to check history
    .click(Selector('ul.submissions-list').find('.glyphicon-minus-sign').nth(1)) // unlink 2nd paper
    .click(saveProfileButton)
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
})

test('check import history', async (t) => {
  const { superUserToken } = t.fixtureCtx
  // should have only 1 note
  const notes = await getNotes({ 'content.authorids': userB.tildeId }, superUserToken, 2)
  await t.expect(notes.length).eql(1)

  // shoud have 2 references: add paper and update authorid
  const importedPaperId = notes[0].id
  const edits = await getNoteEdits(
    { 'note.id': importedPaperId, sort: 'tcdate' },
    superUserToken
  )
  await t
    .expect(edits.length)
    .eql(2)
    .expect(edits[1].note.content.authorids.value.includes(userBAlternateId))
    .ok() // 1st post of paper has all dblp authorid
    .expect(edits[0].note.content.authorids.value.includes(userBAlternateId))
    .ok() // authorid is updated
})

test('reimport unlinked paper and import all', async (t) => {
  // to trigger only authorid reference update
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step3Links)
    .click(addDBLPPaperToProfileButton)
    .click(
      Selector('#dblp-import-modal')
        .find('div')
        .withAttribute('class', 'publication-info')
        .nth(0)
        .find('input')
    )
    .click(dblpImportModalAddToProfileBtn)
    .click(dblpImportModalCancelButton)
    // import all
    .click(addDBLPPaperToProfileButton)
    .click(
      Selector('#dblp-import-modal').find('input').withAttribute('type', 'checkbox').nth(0)
    ) // check import all
    .click(dblpImportModalAddToProfileBtn)
    .wait(3000)
    .expect(Selector('#dblp-import-modal').visible)
    .notOk() // after import all modal is auto hidden
    .click(addDBLPPaperToProfileButton)
    // select all checkbox should be selected and disabled
    .expect(
      Selector('#dblp-import-modal')
        .find('input')
        .withAttribute('type', 'checkbox')
        .nth(0)
        .hasAttribute('disabled')
    )
    .ok()
    .expect(
      Selector('#dblp-import-modal')
        .find('input')
        .withAttribute('type', 'checkbox')
        .nth(0)
        .hasAttribute('checked')
    )
    .ok()
    // coauthors should have values now
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile`)
    .expect(Selector('section.coauthors').find('li').count)
    .gt(0)
})

test('validate current history', async (t) => {
  // add past end date
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step4History)
    .typeText(firstHistoryEndInput, (new Date().getFullYear() - 1).toString(), {
      replace: true,
      paste: true,
    })
    .click(saveProfileButton)
    .expect(errorMessageSelector.innerText)
    .eql('Error: There are errors in your Career & Education History.')
    .expect(
      Selector('span.invalid-value-icon').withAttribute(
        'data-original-title',
        'Your Career & Education History must include at least one current position.'
      ).exists
    )
    .ok()
    // add current end date
    .typeText(firstHistoryEndInput, new Date().getFullYear().toString(), {
      replace: true,
      paste: true,
    })
    .click(saveProfileButton)
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
    .expect(errorMessageSelector.innerText)
    .eql('Your profile information has been successfully updated')

  // add empty end date
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step4History)
    .selectText(firstHistoryEndInput)
    .pressKey('delete')
    .click(saveProfileButton)
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
    .expect(errorMessageSelector.innerText)
    .eql('Your profile information has been successfully updated')
})

test('profile should be auto merged', async (t) => {
  await t
    .useRole(userARole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step2Emails)
    .click(emailSectionPlusIconSelector)
    .typeText(editEmailInputSelector, userF.email)
    .click(Selector('button').withText('Confirm').filterVisible())
    .expect(Selector('a').withText('Merge Profiles').exists)
    .notOk()
    .expect(Selector('#flash-message-container').find('div.alert-content').innerText)
    .contains(`A confirmation email has been sent to ${userF.email}`)

    // enter code to merge profile
    .expect(Selector('button').withText('Verify').nth(0).visible)
    .ok()
    .expect(Selector('input[placeholder="Enter Verification Token"]').visible)
    .ok()
    .typeText(Selector('input[placeholder="Enter Verification Token"]'), '000000')
    .click(Selector('button').withText('Verify').nth(0))
    .expect(messageSelector.innerText)
    .eql('alternate@a.com has been verified')
    .expect(Selector('div.emails__confirmed-text').withText('(Confirmed)').count).eql(2, { timeout: 2000 }) // email section is updated
    .expect(Selector('div.emails__preferred-text').withText('(Preferred Email)').count).eql(1) // userA's existing email
    .expect(Selector('button').withText('Make Preferred').exists)// userF's email
    .ok()

    .click(saveProfileButton) // save profile should success
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
    .expect(errorMessageSelector.innerText)
    .eql('Your profile information has been successfully updated')

  const { superUserToken } = t.fixtureCtx
  const messages = await getMessages(
    { to: userF.email, subject: 'OpenReview Account Linking - Duplicate Profile Found' },
    superUserToken
  )
  await t
    .expect(messages[0].content.text)
    .contains(
      'This alternate email address is already associated with the user [~FirstF_LastF1]'
    )
  await t
    .expect(messages[0].content.text)
    .contains(
      'Verification Token'
    )


  // email should have been added to hasTaskUser's profile
  await t
    .useRole(userARole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile`)
    .expect(Selector('span').withText(userF.email).exists)
    .ok()
    .expect(
      Selector('span').withText(userF.email).parent().find('small').withText('Confirmed')
        .exists
    )
    .ok()
})

// eslint-disable-next-line no-unused-expressions
fixture`Profile page different user`

test('open profile of other user by email', async (t) => {
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}`)
    .click(Selector('a').withText('Login'))
    .typeText(Selector('#email-input'), userB.email)
    .typeText(Selector('#password-input'), userB.password)
    .wait(100)
    .click(Selector('button').withText('Login to OpenReview'))
    .wait(500)
    // access FirstA LastA's profile page by email
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile?email=${hasTaskUser.email}`)
    .expect(Selector('a').withText('Edit Profile').exists)
    .notOk()
    .expect(pageHeader.innerText)
    .eql(hasTaskUser.fullname)
    .expect(profileViewEmail.innerText)
    .contains('****') // email should be masked
})

test('open profile of other user by id', async (t) => {
  // access FirstA LastA's profile page by tildeId
  await t
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile?id=${hasTaskUser.tildeId}`)
    .expect(Selector('a').withText('Edit Profile').exists)
    .notOk()
    .expect(pageHeader.innerText)
    .eql(hasTaskUser.fullname)
    .expect(profileViewEmail.innerText)
    .contains('****')
})

fixture`ORCID import`.requestHooks(orcidMock)
test('show error when using orcid url of somone else', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step3Links)
    // add orcid papers button should be disabled when there's no orcid url
    .expect(addORCIDPapersToProfileButton.hasAttribute('disabled'))
    .ok()
    .typeText(orcidUrlInput, 'https://orcid.org/0000-0001-7660-1599', { replace: true })
    .expect(addORCIDPapersToProfileButton.hasAttribute('disabled'))
    .notOk()
    .click(addORCIDPapersToProfileButton)
    // should show orcid import modal with error message
    .expect(Selector('#orcid-import-modal').visible)
    .ok()
    .expect(Selector('#orcid-import-modal').find('div.modal-body').innerText)
    .eql('Your profile name must match with the ORCID url')
})

test('show error when using invalid orcid url', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step3Links)
    // add orcid papers button should be disabled when there's no orcid url
    .expect(addORCIDPapersToProfileButton.hasAttribute('disabled'))
    .ok()
    .typeText(orcidUrlInput, 'https://orcid.org/0000-0000-0000-0000', { replace: true })
    .expect(addORCIDPapersToProfileButton.hasAttribute('disabled'))
    .notOk()
    .click(addORCIDPapersToProfileButton)
    // should show orcid import modal with error message
    .expect(Selector('#orcid-import-modal').visible)
    .ok()
    .expect(Selector('#orcid-import-modal').find('div.modal-body').innerText)
    .eql('ORCID ID 0000-0000-0000-0000 is not found')
})

test('show orcid publications', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step3Links)
    .typeText(orcidUrlInput, 'https://orcid.org/0000-0002-0613-2229', { replace: true })
    .click(addORCIDPapersToProfileButton)
    // should show 2 publications in mock response
    .expect(Selector('#orcid-import-modal').visible)
    .ok()
    .expect(Selector('#orcid-import-modal').find('div.modal-body>p').innerText)
    .eql('We found 2 publications, 0 of which already exist in OpenReview, 2 of which are new. Please select the new publications of which you are actually an author. Then click "Add to Your Profile" to import them.')
    .expect(Selector('div.publication-title').count)
    .eql(2)
    .expect(Selector('div.publication-title').nth(0).innerText)
    .eql('Verification of cascade optical coherence tomography for freeform optics form metrology\nOptics Express - Crossref')
    .expect(Selector('div.publication-title').nth(1).innerText)
    .eql('Cascade optical coherence tomography (C-OCT)\nOptics Express - Crossref')
    .expect(orcidImportModalAddToProfileBtn.hasAttribute('disabled'))
    .ok()
})

// eslint-disable-next-line no-unused-expressions
fixture`Issue related tests`

test('#83 email status is missing', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile`)
    .expect(Selector('section.emails').find('div.list-compact').innerText)
    .contains('Confirmed') // not sure how the status will be added so selector may need to be updated
    .expect(Selector('section.emails').find('div.list-compact').innerText)
    .contains('Preferred')
})
test('#85 confirm profile email message', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step2Emails)
    .click(emailSectionPlusIconSelector)
    .typeText(editEmailInputSelector, 'a@a.com')
    .click(Selector('button').withText('Confirm').filterVisible())
    .typeText(editEmailInputSelector, 'x@x.com', { replace: true })
    .click(Selector('button').withText('Confirm').filterVisible())
    .expect(Selector('#flash-message-container').find('div.alert-content').innerText)
    .contains('A confirmation email has been sent to x@x.com')
    // text box to enter code should be displayed
    .expect(Selector('button').withText('Verify').nth(0).visible)
    .ok()
    .expect(Selector('input[placeholder="Enter Verification Token"]').visible)
    .ok()
})
test('#98 trailing slash error page', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/`) // trailing slash should redirect to url without /
    .expect(Selector('h1').withText('Error 404').exists)
    .notOk()
    .expect(Selector('pre.error-message').exists)
    .notOk()
})
test('#123 update name in nav when preferred name is updated ', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .expect(Selector('#user-menu').innerText)
    .eql('FirstB LastB ')
    .click(nameMakePreferredButton)
    .click(saveProfileButton)
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
    .click(cancelButton)
    .expect(Selector('#user-menu').innerText)
    .eql('Di Xu ')
    .expect(Selector('div.title-container').find('h1').innerText)
    .eql('Di Xu')
})
test('#160 allow user to overwrite name to be lowercase', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(nameSectionPlusIconSelector)
    .typeText(editFullNameInputSelector, 'first', { speed: 0.3 }) // it will trigger call to generate ~ id so typing fast won't trigger capitalization
    .expect(editFullNameInputSelector.value)
    .eql('First')
    .pressKey('left left left left left delete f')
    .expect(editFullNameInputSelector.value)
    .eql('first')
    .click(saveProfileButton)
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
    .click(cancelButton)
    .expect(Selector('span').withText('first').exists)
    .ok()
})
test('fail before 2099', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step4History)
    .typeText(
      Selector('div.history').find('input').nth(2),
      `${new Date().getFullYear() + 10}`,
      { replace: true }
    ) // to fail in 2090, update validation regex
    .click(saveProfileButton)
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
    .expect(errorMessageSelector.innerText)
    .eql('Your profile information has been successfully updated', undefined, {
      timeout: 5000,
    })
})
test('#1011 remove space in personal links', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step3Links)
    .typeText(homepageUrlInput, '   https://github.com/xkOpenReview    ', {
      replace: true,
      paste: true,
    })
    .pressKey('tab')
    .click(saveProfileButton)
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
    .click(cancelButton)
    .expect(
      Selector('a')
        .withText('Homepage')
        .withAttribute('href', 'https://github.com/xkOpenReview').exists
    )
    .ok()
})
test('confirm an email with a numeric token', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step2Emails)
    .expect(Selector('h4').withText('Emails').exists)
    .ok()
    .click(emailSectionPlusIconSelector)
    .expect(Selector('div.container.emails').child('div.row').count)
    .eql(2)
    .typeText(
      Selector('div.container.emails').child('div.row').nth(1).find('input'),
      'aaa@alternate.com'
    )
    .click(Selector('div.container.emails').find('button.confirm-button'))
    .expect(messageSelector.innerText)
    .eql(
      'A confirmation email has been sent to aaa@alternate.com with confirmation instructions'
    )
    .typeText(Selector('input[placeholder="Enter Verification Token"]'), '000000')
    .click(Selector('button').withText('Verify').nth(0))
    .expect(messageSelector.innerText)
    .eql('aaa@alternate.com has been verified')
    // check if buttons disappeared
    .expect(Selector('button').withText('Verify').nth(0).exists)
    .notOk()
    .expect(Selector('button').withText('Confirm').nth(0).exists)
    .notOk()
    .expect(Selector('div').withText('(Confirmed)').nth(0).exists)
    .ok()
    .expect(Selector('button').withText('Make Preferred').nth(0).exists)
    .ok()
    .click(saveProfileButton)
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
    .click(cancelButton)
    .expect(Selector('span').withText('aaa@alternate.com').exists)
    .ok()
    .expect(
      Selector('span')
        .withText('aaa@alternate.com')
        .parent()
        .find('small')
        .withText('Confirmed').exists
    )
    .ok()
})
test('check if a user can add multiple emails without entering verification token', async (t) => {
  await t
    .useRole(userBRole)
    .navigateTo(`http://localhost:${process.env.NEXT_PORT}/profile/edit`)
    .wait(100)
    .click(step2Emails)
    .expect(Selector('h4').withText('Emails').exists)
    .ok()
    .click(emailSectionPlusIconSelector)
    .expect(Selector('div.container.emails').child('div.row').count)
    .eql(3)
    .typeText(
      Selector('div.container.emails').child('div.row').nth(2).find('input'),
      'aab@alternate.com'
    )
    .click(Selector('div.container.emails').find('button.confirm-button'))
    .expect(messagePanelSelector.exists)
    .ok()
    .expect(messageSelector.innerText)
    .eql(
      'A confirmation email has been sent to aab@alternate.com with confirmation instructions'
    )
    .typeText(Selector('input[placeholder="Enter Verification Token"]'), '000000')
    .click(Selector('button').withText('Verify').nth(0))
    .expect(messagePanelSelector.exists)
    .ok()
    .expect(messageSelector.innerText)
    .eql('aab@alternate.com has been verified')

    .click(emailSectionPlusIconSelector)
    .expect(Selector('div.container.emails').child('div.row').count)
    .eql(4)
    .typeText(
      Selector('div.container.emails').child('div.row').nth(3).find('input'),
      'aac@alternate.com'
    )
    .click(Selector('div.container.emails').find('button.confirm-button'))
    .expect(messagePanelSelector.exists)
    .ok()
    .expect(messageSelector.innerText)
    .eql(
      'A confirmation email has been sent to aac@alternate.com with confirmation instructions'
    )
    .click(Selector('button').withText('Verify').nth(0))
    .expect(messagePanelSelector.exists)
    .ok()
    .expect(messageSelector.innerText)
    .eql('token must NOT have fewer than 1 characters')

    .click(saveProfileButton)
    .expect(saveProfileButton.find('div.spinner-container').exists).notOk({ timeout: 15000 })
    .click(cancelButton)
    .expect(Selector('span').withText('aab@alternate.com').exists)
    .ok()
    .expect(
      Selector('span')
        .withText('aab@alternate.com')
        .parent()
        .find('small')
        .withText('Confirmed').exists
    )
    .ok()

    .expect(Selector('span').withText('aac@alternate.com').exists)
    .ok()
    .expect(Selector('span').withText('aac@alternate.com').parent().textContent)
    .notContains('Confirmed')
})
