import { createSlice } from '@reduxjs/toolkit';
import { getUser } from "../actions";
import { USER } from '../constants/action-types';


// Shape of the reponse data from requesting for a
// basket (cart) from the api
const initialState: IUser = {
    auth: false
}


/**
 * Not a reducer per se
 * Helper function: We move logic of adding data
 * to the cart to this function for clarity
 */


export const userSlice = createSlice({
  name: USER,
  initialState,
  reducers: {},
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


export const userReducer = userSlice.reducer
