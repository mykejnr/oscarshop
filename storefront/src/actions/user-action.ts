import { createAsyncThunk } from "@reduxjs/toolkit";
import {USER_GET_USER} from '../constants/action-types'
import { getApi } from "../api";


export const getUser = createAsyncThunk(USER_GET_USER, () => {
    const opts: RequestInit = {
        credentials: 'include',
    }
    return fetch(getApi("user"), opts)
    .then(response => {
        // not authenticated
        if (response.status === 403) {
            return null
        }
        return response.json()
    })
    .then(json => json)
});
