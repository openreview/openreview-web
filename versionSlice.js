import { createSlice } from '@reduxjs/toolkit'

const versionSlice = createSlice({
  name: 'version',
  initialState: {
    version: null,
  },
  reducers: {
    setVersion: (state, action) => {
      state.version = action.payload.value
    },
  },
})

export const { setVersion } = versionSlice.actions
export default versionSlice.reducer
