import BaseMenuBar from '../BaseMenuBar'

const SeniorAreaChairStatusMenuBar = ({
  tableRowsAll,
  tableRows,
  setSeniorAreaChairStatusTabData,
}) => {
  const sortOptions = [
    {
      label: 'Senior Area Chair',
      value: 'Senior Area Chair',
      getValue: (p) => p.areaChairProfile?.preferredName,
    },
  ]
  const basicSearchFunction = (row, term) => row.sacProfileId.toLowerCase().includes(term)

  return (
    <BaseMenuBar
      tableRowsAll={tableRowsAll}
      tableRows={tableRows}
      setData={setSeniorAreaChairStatusTabData}
      enableQuerySearch={false}
      sortOptions={sortOptions}
      basicSearchFunction={basicSearchFunction}
      searchPlaceHolder="Search all senior area chairs..."
      extraClasses="sac-status-menu"
    />
  )
}

export default SeniorAreaChairStatusMenuBar
