import { createAsyncThunk } from "@reduxjs/toolkit";
import {USER_GET_USER, USER_SIGNUP} from '../constants/action-types'
import { getApi } from "../api";
import { get } from "../utils/http";


export const getUser = createAsyncThunk(USER_GET_USER, async (arg, thunkAPI) => {
    const url = getApi("user")

    const response = await get({url, thunkAPI})
    if (response.status === 403) {
        return null
    }
    return await response.json()
});


export const signUp = createAsyncThunk(USER_SIGNUP, async (args, thunkAPI) => {

})