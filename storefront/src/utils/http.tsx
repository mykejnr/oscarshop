import { Action } from 'redux';
import { getCSRFcookie } from '.';
import { newMessage } from '../actions';


type RequestArgs = {
    url: string,
    options?: RequestInit,
    dispatch?: (action: Action) => {},
    ignore_errors?: number[]
}


export const makeRequest = (method: string) => async ({url, options, dispatch, ignore_errors}: RequestArgs) => {
    const defaultOpts: RequestInit = {
        method,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            "X-CSRFToken": getCSRFcookie(),
        },
    }

    const argOpts = options || {}
    const ie = ignore_errors

    try {
        const response = await fetch(url, { ...defaultOpts, ...argOpts })
        // all http error responses (400+) which are not included
        // in 'ignore_errors' are handled here, generically.
        // We also only attempt to handle unhandled errors if the 'ignore_errors'
        // argument is provided. Else we just return the response and assume
        // The caller will deal with it themselves
        if (!response.ok && ie && !ie.includes(response.status)) {
            // chech if the json has a message attribute else
            // we show a generic message
            const json = (await response.json()) || {}
            const msg = json.message || "Request failed. Please try again later."
            dispatch && dispatch(newMessage(msg))
        }
        return response
    } catch(e: any) {
        // deal with client side errors (like network connectivity) generically
        // Catch the error (client side erros) and show the error message
        // We still return a custom Response to have a uniform API
        dispatch && dispatch(newMessage(e.message))
        const res = new Response(null, {status: 600})
        return new Promise<Response>(resolve => resolve(res))
    }
}


export const get = makeRequest("GET")
export const post = makeRequest("POST")
