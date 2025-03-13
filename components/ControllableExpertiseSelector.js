/* globals $, promptError: false */
import { useState, useEffect } from 'react'
import IconButton from './IconButton'
import styles from '../styles/components/ControllableExpertiseSelector.module.scss'
import { stringToColor } from '../lib/utils'
import useUser from '../hooks/useUser'
import api from '../lib/api-client'

export default function ControllableExpertiseSelector() {
  const [keyphrases, setKeyphrases] = useState({ active: [], inactive: [] })
  const [includedKeyphrases, setIncludedKeyphrases] = useState([])
  const [clickedKeyphrase, setClickedKeyphrase] = useState('')
  const [recommendedPapers, setRecommendedPapers] = useState([])
  const [activePapers, setActivePapers] = useState({})
  const [keyphraseColors, setKeyphraseColors] = useState({})
  const [paperWeights, setPaperWeights] = useState({})
  const { user, accessToken } = useUser()

  useEffect(() => {
    async function fetchKeyphrases() {
      try {
        const keyphraseResponse = await api.get(
          "/expertise/controllable/get_recommendations/mccallum", {}, { accessToken }
        )
        setKeyphrases({
          active: Object.keys(keyphraseResponse.profilekp2selected),
          inactive: [],
        })
        // Compute colors after keyphrases are set
        // keyphrases state var might not be updated immediately
        setKeyphraseColors(
          Object.keys(keyphraseResponse.profilekp2selected).reduce((acc, kp) => {
            acc[kp] = stringToColor(kp)
            return acc
          }, {})
        )

        setIncludedKeyphrases(
          Object.keys(keyphraseResponse.profilekp2selected).filter(
            (kp) => keyphraseResponse.profilekp2selected[kp]
          )
        )
        setRecommendedPapers(keyphraseResponse.recommendations)
        setActivePapers(keyphraseResponse.profilekp2user_papers)
      } catch (error) {
        promptError(error.message)
      }
    }

    fetchKeyphrases()
  }, [])

  useEffect(() => {
    function buildPaperWeightDict(keyphraseResponse) {
      const paperWeightDict = {}
      Object.keys(keyphraseResponse.profilekp2user_papers).forEach((kp) => {
        keyphraseResponse.profilekp2user_papers[kp].papers.forEach((paper, index) => {
          if (Object.prototype.hasOwnProperty.call(paperWeightDict, paper.title)) {
            paperWeightDict[paper.title] = {
              ...paperWeightDict[paper.title],
              [kp]: keyphraseResponse.profilekp2user_papers[kp].kp2paper_wts[index],
            }
          } else {
            paperWeightDict[paper.title] = {
              [kp]: keyphraseResponse.profilekp2user_papers[kp].kp2paper_wts[index],
            }
          }
        })
      })

      return paperWeightDict
    }
    async function fetchRecommendations() {
      const baseUrl =
        `/expertise/controllable/get_recommendations/mccallum`
      // prepend selected_kps= to every kp in includedKeyphrases
      const url =
        includedKeyphrases.length === 0
          ? baseUrl
          : `${baseUrl}?selected_kps=${includedKeyphrases.join('&selected_kps=')}`
      const keyphraseResponse = await api.get(url, {}, { accessToken })
      setRecommendedPapers(keyphraseResponse.recommendations)
      setActivePapers(keyphraseResponse.profilekp2user_papers)
      // in the future, paper weights should be set based on id instead of titles
      setPaperWeights(buildPaperWeightDict(keyphraseResponse))
    }
    fetchRecommendations()
  }, [includedKeyphrases])

  return (
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
            {keyphrases.active.map((keyphrase, index) => (
              <div
                className="keyphrase-container"
                key={keyphrase}
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
                <IconButton
                  name="trash"
                  tooltip="Remove Keyphrase"
                  onClick={() => {
                    setKeyphrases({
                      active: keyphrases.active.filter((k) => k !== keyphrase),
                      inactive: [...keyphrases.inactive, keyphrase],
                    })
                    setIncludedKeyphrases(includedKeyphrases.filter((k) => k !== keyphrase))
                  }}
                />
              </div>
            ))}
            {keyphrases.inactive.map((keyphrase, index) => (
              <div className="keyphrase-container" key={keyphrase}>
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
                <IconButton
                  name="plus"
                  onClick={() => {
                    setKeyphrases({
                      active: [...keyphrases.active, keyphrase],
                      inactive: keyphrases.inactive.filter((k) => k !== keyphrase),
                    })
                    setIncludedKeyphrases([...includedKeyphrases, keyphrase])
                  }}
                />
              </div>
            ))}

            <div className="row keyphrase-container">
              <input
                id="addkeyphrase"
                type="text"
                className="col-sm-7 form-control"
                placeholder="Add Keyphrase"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    setKeyphrases({
                      active: [...keyphrases.active, e.target.value],
                      inactive: keyphrases.inactive,
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
                  const keyphrase = document.getElementById('addkeyphrase').value
                  setKeyphrases({
                    active: [...keyphrases.active, keyphrase],
                    inactive: keyphrases.inactive,
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
          {/* TODO: This div may get removed in a future iteration. If not get dates from a source, */}
          <div className="mb-3 ml-3">
            Potential assignments from papers accepted in machine learning conferences from
            2018 to 2023
          </div>

          {recommendedPapers.map((paper) => (
            <div className="mb-2" key={paper.title}>
              <a target="_blank" href={paper.url}>
                <strong>{paper.title}</strong>
              </a>
              <h6>
                {paper.year} | {paper.venue}
              </h6>
              <p className="ml-4">{paper.abstract[0]}</p>
            </div>
          ))}

          {clickedKeyphrase && (
            <div
              key={clickedKeyphrase}
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
                  Authored Papers clustered under &quot;{clickedKeyphrase}&quot;
                </h4>
              </div>
              {activePapers[clickedKeyphrase].papers.map((paper) => (
                <>
                  <div className="mb-2">
                    <a target="_blank" href={paper.url}>
                      <strong>{paper.title}</strong>
                    </a>
                    <div className="d-flex ml-4 heatmap-bar">
                      {Object.keys(paperWeights[paper.title]).map((kp) => {
                        const sum = Object.values(paperWeights[paper.title]).reduce(
                          (acc, val) => acc + val,
                          0
                        )
                        return (
                          <div
                            title={kp}
                            key={kp}
                            style={{
                              backgroundColor: keyphraseColors[kp],
                              width: `${(paperWeights[paper.title][kp] / sum) * 100}%`,
                              height: '100%',
                            }}
                          />
                        )
                      })}
                    </div>
                    <p className="ml-4 mb-0">{paper.abstract[0]}</p>
                  </div>
                </>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
