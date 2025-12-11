import { createSlice } from '@reduxjs/toolkit'

const bannerSlice = createSlice({
  name: 'banner',
  initialState: {
    type: null,
    value: null,
  },
  reducers: {
    setBannerContent: (state, action) => {
      state.type = action.payload.type
      state.value = action.payload.value
    },
  },
})

export const { setBannerContent } = bannerSlice.actions
export default bannerSlice.reducer
