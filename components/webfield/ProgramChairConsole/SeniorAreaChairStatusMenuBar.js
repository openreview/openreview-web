/* globals $,promptMessage: false */
import { useContext, useEffect, useState } from 'react'
import useUser from '../../../hooks/useUser'
import api from '../../../lib/api-client'
import BasicModal from '../../BasicModal'
import WebFieldContext from '../../WebFieldContext'
import BaseMenuBar from '../BaseMenuBar'
import QuerySearchInfoModal from '../QuerySearchInfoModal'

const SeniorAreaChairStatusMenuBar = ({
  tableRowsAll,
  tableRows,
  setSeniorAreaChairStatusTabData,
}) => {
  const sortOptions = [
    {
      label: 'Senior Area Chair',
      value: 'Senior Area Chair',
      getValue: (p) => p.number,
    },
    {
      label: 'Senior Area Chair Name',
      value: 'Senior Area Chair Name',
      getValue: (p) => p.sacProfile?.preferredName ?? p.sacProfileId,
    },
  ]
  const basicSearchFunction = (row, term) =>
    (row.sacProfile?.preferredName.toLowerCase() ?? row.sacProfileId.toLowerCase()).includes(
      term
    )

  return (
    <BaseMenuBar
      tableRowsAll={tableRowsAll}
      tableRows={tableRows}
      setData={setSeniorAreaChairStatusTabData}
      enableQuerySearch={false}
      sortOptions={sortOptions}
      exportFileName="Senior Area Chair Status"
      basicSearchFunction={basicSearchFunction}
      searchPlaceHolder="Search all senior area chairs"
      extraClasses="sac-status-menu"
    />
  )
}

export default SeniorAreaChairStatusMenuBar
