import { createSlice } from '@reduxjs/toolkit'

const notificationSlice = createSlice({
  name: 'notification',
  initialState: {
    hasUnreadNotification: null,
  },
  reducers: {
    setUnreadNotification: (state, action) => {
      state.hasUnreadNotification = action.payload
    },
  },
})

export const { setUnreadNotification } = notificationSlice.actions
export default notificationSlice.reducer
