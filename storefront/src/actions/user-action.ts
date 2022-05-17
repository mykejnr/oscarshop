import { createAsyncThunk } from "@reduxjs/toolkit";
import {USER_GET_USER} from '../constants/action-types'
import { getApi } from "../api";
import { customGet } from "../utils";
import { newMessage } from ".";


export const getUser = createAsyncThunk(USER_GET_USER, async (arg, thunkAPI) => {
    try {
        const response = await customGet(getApi("user"))
        if (response.status === 403) {
            return null
        }
        return await response.json()
    }  catch(e: any) {
        thunkAPI.dispatch(newMessage(e.message))
    }
});
