import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WritableDraft } from 'immer/dist/internal';
import { getUser } from "../actions";
import { USER } from '../constants/action-types';


// Shape of the reponse data from requesting for a
// basket (cart) from the api
const initialState: IUser = {
    auth: false
}


const setUser = (state: WritableDraft<IUser>, action: PayloadAction<IUserReturnBase>) => {
  state.auth = true
  state.profile = action.payload
}


export const userSlice = createSlice({
  name: USER,
  initialState,
  reducers: {
    signup(state, action: PayloadAction<ISignupReturn>) {
      setUser(state, action)
    },
    login(state, action: PayloadAction<ILoginReturn>) {
      setUser(state, action)
    },
    changeEmail(state, action: PayloadAction<string>) {
      if (state.profile) {
        state.profile.email = action.payload
      } else {
        return state
      }
    },
    logout(state) {
      state.auth = false
      state.profile = undefined
    }
  },
  extraReducers: (builder) => {
    builder.addCase(getUser.fulfilled, (state, action) => {
        if (action.payload) {
            state.auth = true
            state.profile = action.payload
        } else {
            return {auth: false}
        }
    })
    .addDefaultCase((state) => state)
  },
})


export const { signup, login, logout, changeEmail } = userSlice.actions
export const userReducer = userSlice.reducer
