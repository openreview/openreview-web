import { useState, useEffect } from 'react'
import Icon from './Icon'
import IconButton from './IconButton'
import IconStyles from '../styles/components/Icon.module.scss'
import styles from '../styles/components/ExpertiseSelector.module.scss'

export default function ExpertiseSelector() {
  var [keyphrases, setKeyphrases] = useState({ active: [], inactive: [] })
  var [includedKeyphrases, setIncludedKeyphrases] = useState([])
  var [clickedKeyphrase, setClickedKeyphrase] = useState('')
  var [recommendedPapers, setRecommendedPapers] = useState([])
  var [activePapers, setActivePapers] = useState({})
  var [keyphraseColors, setKeyphraseColors] = useState({})
  var [paperWeights, setPaperWeights] = useState({})

  const markTaskAsComplete = async () => {
    try {
      await api.post(
        '/edges',
        {
          invitation: invitation.id,
          readers: [venueId, user.profile.id],
          writers: [venueId, user.profile.id],
          signatures: [user.profile.id],
          head: 'xf0zSBd2iufMg', // OpenReview paper
          tail: user.profile.id,
          label: invitationOption,
        },
        { accessToken, version: apiVersion }
      )
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(`Error marking invitation as completed: ${error.message}`)
    }
  }

  useEffect(() => {
    async function fetchKeyphrases() {
      try {
        const keyphraseResponse = await fetch(
          'https://retrievalapp-zso5o2q47q-uc.a.run.app/get_recommendations/mccallum'
        )
        const jsonResponse = await keyphraseResponse.json()
        setKeyphrases({
          active: Object.keys(jsonResponse['profilekp2selected']),
          inactive: [],
        })
        setIncludedKeyphrases(
          Object.keys(jsonResponse['profilekp2selected']).filter(
            (kp) => jsonResponse['profilekp2selected'][kp]
          )
        )
        setRecommendedPapers(jsonResponse['recommendations'])
        setActivePapers(jsonResponse['profilekp2user_papers'])
      } catch (error) {
        console.log('Error fetching', error)
      }
    }

    fetchKeyphrases()
  }, [])

  useEffect(() => {
    function buildPaperWeightDict(jsonResponse) {
      var paperWeightDict = {}
      Object.keys(jsonResponse['profilekp2user_papers']).forEach((kp) => {
        jsonResponse['profilekp2user_papers'][kp]['papers'].forEach((paper, index) => {
          if (paperWeightDict.hasOwnProperty(paper['title'])) {
            paperWeightDict[paper['title']] = [
              ...paperWeightDict[paper['title']],
              { [kp]: jsonResponse['profilekp2user_papers'][kp]['kp2paper_wts'][index] },
            ]
          } else {
            paperWeightDict[paper['title']] = [
              { [kp]: jsonResponse['profilekp2user_papers'][kp]['kp2paper_wts'][index] },
            ]
          }
        })
      })

      return paperWeightDict
    }
    async function fetchRecommendations() {
      const baseUrl =
        'https://retrievalapp-zso5o2q47q-uc.a.run.app/get_recommendations/mccallum'
      // prepend selected_kps= to every kp in includedKeyphrases
      const url =
        includedKeyphrases.length == 0
          ? baseUrl
          : baseUrl + '?selected_kps=' + includedKeyphrases.join('&selected_kps=')
      const keyphraseResponse = await fetch(url)
      const jsonResponse = await keyphraseResponse.json()
      setRecommendedPapers(jsonResponse['recommendations'])
      setActivePapers(jsonResponse['profilekp2user_papers'])
      // in the future, paper weights should be set based on id instead of titles
      setPaperWeights(buildPaperWeightDict(jsonResponse))
    }
    fetchRecommendations()
  }, [includedKeyphrases])

  useEffect(() => {
    keyphrases &&
      setKeyphraseColors(
        keyphrases['active'].reduce((acc, kp) => {
          acc[kp] = stringToColor(kp)
          return acc
        }, {})
      )
  }, [keyphrases])

  function hashString(s) {
    let hash = 0
    for (let i = 0; i < s.length; i++) {
      let char = s.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash |= 0 // Convert to 32bit integer
    }
    return hash
  }

  function stringToColor(s, washOutIntensity = 0.3) {
    // Convert string to a unique number using hash function
    let hash = hashString(s) % 256 ** 3

    // Convert the hash code to RGB values
    let r = (hash >> 16) & 0xff
    let g = (hash >> 8) & 0xff
    let b = hash & 0xff

    // Increase the intensity of RGB values towards white to wash out the colors
    r = Math.floor(r + (255 - r) * washOutIntensity)
    g = Math.floor(g + (255 - g) * washOutIntensity)
    b = Math.floor(b + (255 - b) * washOutIntensity)

    // Convert RGB values to hex color
    let color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b
      .toString(16)
      .padStart(2, '0')}`

    return color // Return the calculated color
  }

  return (
    <>
      <div
        className={styles.container}
        onMouseLeave={() => setClickedKeyphrase('')}
      >
        <div className="row expertise-selector">
          <div className="col-md-3">
            <div className="column-header">
              <h4>Expertise Keyphrases</h4>
            </div>
            <div>
              <ol>
                <li>Bucket your papers’ expertise by adding and removing keyphases.</li>
                <li>
                  Exclude or include expertise for assignments by unchecking and checking
                  keyphrases, finally
                </li>
                <li>
                  <IconButton
                    className="col-sm-2"
                    name="floppy-save"
                    text="Save Expertise"
                    onClick={() => alert('Expertise saved!')}
                  />
                </li>
              </ol>
            </div>
            <div>
              {keyphrases['active'].map((keyphrase, index) => {
                return (
                  <div
                    className="keyphrase-container"
                    style={{
                      backgroundColor: keyphraseColors[keyphrase],
                    }}
                  >
                    <div className="d-flex">
                      <input
                        type="checkbox"
                        className="form-check-input mt-0"
                        id={`keyphrase-${index}`}
                        checked={includedKeyphrases.includes(keyphrase)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setIncludedKeyphrases([...includedKeyphrases, keyphrase])
                          } else {
                            setIncludedKeyphrases(
                              includedKeyphrases.filter((k) => k !== keyphrase)
                            )
                          }
                        }}
                      />
                      <span
                        className="active-keyphrase"
                        onMouseEnter={() => setClickedKeyphrase(keyphrase)}
                      >
                        {keyphrase}
                      </span>
                    </div>
                    <Icon
                      extraClasses={IconStyles.clickable}
                      name="trash"
                      tooltip="Remove Keyphrase"
                      onClick={() => {
                        setKeyphrases({
                          active: keyphrases['active'].filter((k) => k !== keyphrase),
                          inactive: [...keyphrases['inactive'], keyphrase],
                        })
                        setIncludedKeyphrases(
                          includedKeyphrases.filter((k) => k !== keyphrase)
                        )
                      }}
                    />
                  </div>
                )
              })}
              {keyphrases['inactive'].map((keyphrase, index) => {
                return (
                  <div className="keyphrase-container">
                    <div className="d-flex">
                      <input
                        type="checkbox"
                        className="checkbox-inline"
                        id={`keyphrase-${index}`}
                        disabled
                      />
                      <span className="inactive-keyphrase">
                        <s>{keyphrase}</s>
                      </span>
                    </div>
                    <Icon
                      extraClasses={IconStyles.clickable}
                      name="plus"
                      tooltip="Add Keyphrase"
                      onClick={() => {
                        setKeyphrases({
                          active: [...keyphrases['active'], keyphrase],
                          inactive: keyphrases['inactive'].filter((k) => k !== keyphrase),
                        })
                        setIncludedKeyphrases([...includedKeyphrases, keyphrase])
                      }}
                    />
                  </div>
                )
              })}

              <div className="row keyphrase-container">
                <input
                  id="addkeyphrase"
                  type="text"
                  className="col-sm-7 form-control"
                  placeholder="Add Keyphrase"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      setKeyphrases({
                        active: [...keyphrases['active'], e.target.value],
                        inactive: keyphrases['inactive'],
                      })
                      setIncludedKeyphrases([...includedKeyphrases, e.target.value])
                      e.target.value = ''
                    }
                  }}
                />
                <IconButton
                  text="Add"
                  name="plus"
                  tooltip="Add Keyphrase"
                  onClick={() => {
                    var keyphrase = document.getElementById('addkeyphrase').value
                    setKeyphrases({
                      active: [...keyphrases['active'], keyphrase],
                      inactive: keyphrases['inactive'],
                    })
                    setIncludedKeyphrases([...includedKeyphrases, keyphrase])
                    document.getElementById('addkeyphrase').value = ''
                  }}
                />
              </div>
            </div>
          </div>

          <div className="col-md-9 paper-container">
            <div className="row column-header">
              <h4 className="col-sm-10">Potential Paper Assignments</h4>
            </div>
            <div className="mb-3 ml-3">
              Potential assignments from papers accepted in machine learning conferences from
              2018 to 2023
            </div>

            {recommendedPapers.map((paper) => {
              return (
                <>
                  <div className="mb-2">
                    <a target="_blank" href={paper['url']}>
                      <strong>{paper['title']}</strong>
                    </a>
                    <h6>
                      {paper['year']} | {paper['venue']}
                    </h6>
                    <p className="ml-4">{paper['abstract'][0]}</p>
                  </div>
                </>
              )
            })}

            {clickedKeyphrase && (
              <div
                className="authored-papers-container"
                style={{
                  backgroundColor: stringToColor(clickedKeyphrase, 0.8),
                }}
              >
                <div className="row column-header">
                  <IconButton
                    extraClasses="col-sm-3"
                    name="chevron-left"
                    text="Back"
                    onClick={() => setClickedKeyphrase('')}
                  />
                  <h4 className="col-sm-10">
                    Authored Papers clustered under "{clickedKeyphrase}"
                  </h4>
                </div>
                {activePapers[clickedKeyphrase]['papers'].map((paper) => {
                  return (
                    <>
                      <div className="mb-2">
                        <a target="_blank" href={paper['url']}>
                          <strong>{paper['title']}</strong>
                        </a>
                        <div className="d-flex ml-4 heatmap-bar">
                          {paperWeights[paper['title']].map((kp_wt, index) => {
                            var wt_sum = 0
                            paperWeights[paper['title']].map((kp_wt) => {
                              wt_sum += kp_wt[Object.keys(kp_wt)[0]]
                            })
                            return (
                              <div
                                style={{
                                  backgroundColor: keyphraseColors[Object.keys(kp_wt)[0]],
                                  width: `${(kp_wt[Object.keys(kp_wt)[0]] / wt_sum) * 100}%`,
                                  height: '100%',
                                }}
                              />
                            )
                          })}
                        </div>
                        <p className="ml-4 mb-0">{paper['abstract'][0]}</p>
                      </div>
                    </>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
