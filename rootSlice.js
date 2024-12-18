/* eslint-disable no-param-reassign */
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { auth } from './lib/auth'
import api from './lib/api-client'

export const refreshToken = createAsyncThunk('tokenRefresh', async () => {
  try {
    console.log('refreshToken thunk')
    const response = await fetch(`${process.env.API_V2_URL}/refreshToken`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        Accept: 'application/json,text/*;q=0.99',
        'Content-Type': 'application/json; charset=UTF-8',
      },
    })
    const data = await response.json()
    console.log('thunk refresh token data is', data)
    if (data.name === 'TokenExpiredError' || data.name === 'MissingTokenError') {
      console.log('thunk refresh failed')
      return { user: null, token: null }
    }
    return data
  } catch (error) {
    console.error('Error refreshing token in thunk:', error)
  }

  return { user: null, token: null }
})

const rootSlice = createSlice({
  name: 'root',
  initialState: auth(),
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload.user
      state.token = action.payload.token
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.token = action.payload.token
        state.isRefreshing = false
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.user = null
        state.token = null
        state.isRefreshing = false
      })
      .addCase(refreshToken.pending, (state, action) => {
        state.isRefreshing = true
      })
  },
})

export const { setUser } = rootSlice.actions
export default rootSlice.reducer
