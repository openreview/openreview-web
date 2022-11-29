import BasicModal from '../BasicModal'

const QuerySearchInfoModal = ({ filterOperators, propertiesAllowed }) => (
  <BasicModal
    id="query-search-info"
    title="Query Search"
    primaryButtonText={null}
    cancelButtonText="OK"
  >
    <>
      <strong className="tooltip-title">Some tips to use query search</strong>
      <p>
        In Query mode, you can enter an expression and hit ENTER to search.
        <br />
        The expression consists of property of a paper and a value you would like to search
      </p>
      <p>
        e.g. <code>+number=5</code> will return the paper 5
      </p>
      <p>
        Expressions may also be combined with AND/OR.
        <br />
        e.g. <code>+number=5 OR number=6 OR number=7</code> will return paper 5,6 and 7.
        <br />
      </p>
      <p>
        If the value has multiple words, it should be enclosed in double quotes.
        <br />
        e.g. <code>+title=&quot;some title to search&quot;</code>
      </p>
      <p>
        Braces can be used to organize expressions.
        <br />
        e.g. <code>+number=1 OR ((number=5 AND number=7) OR number=8)</code> will return paper
        1 and 8.
      </p>
      <p>
        <strong>Operators available</strong>
        {`: ${filterOperators.join(', ')}`}
      </p>
      <p>
        <strong>Properties available</strong>
      </p>
      {Object.keys(propertiesAllowed).map((key) => (
        <li key={key}>{key}</li>
      ))}
    </>
  </BasicModal>
)

export default QuerySearchInfoModal
