import { createAsyncThunk } from "@reduxjs/toolkit";
import {USER_GET_USER } from '../constants/action-types'
import { getApi } from "../api";
import { get } from "../utils/http";

export const getUser = createAsyncThunk(USER_GET_USER, async (arg, {dispatch}) => {
    const url = getApi("user")

    const response = await get({url, dispatch, data:null})
    if (response.status === 403) {
        return null
    }
    return await response.json()
});