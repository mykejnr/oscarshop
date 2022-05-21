import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getUser } from "../actions";
import { USER } from '../constants/action-types';


// Shape of the reponse data from requesting for a
// basket (cart) from the api
const initialState: IUser = {
    auth: false
}


export const userSlice = createSlice({
  name: USER,
  initialState,
  reducers: {
    signup(state, action: PayloadAction<ISignupReturn>) {
      state.auth = true
      state.profile = action.payload
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


export const { signup } = userSlice.actions
export const userReducer = userSlice.reducer
