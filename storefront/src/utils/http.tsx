import { Action } from 'redux';
import { getCSRFcookie } from '.';
import { newMessage } from '../actions';


type RequestArgs = {
    url: string,
    ignore_errors?: number[],
    data: Record<string, string> | null,
    dispatch?: (action: Action) => {},
    options?: RequestInit,
}


export const makeRequest = (method: string) => async (props: RequestArgs) => {
    const {url, data, ignore_errors, dispatch, options} = props
    const defaultOpts: RequestInit = {
        method,
        credentials: 'same-origin',
        headers: {
            'Content-Type': 'application/json',
            "X-CSRFToken": getCSRFcookie(),
        },
    }
    const ie = ignore_errors

    let argOpts = options ? options : {}
    argOpts = data ? {...argOpts, body: JSON.stringify(data)} : argOpts

    try {
        const response = await fetch(url, { ...defaultOpts, ...argOpts })
        const responseClone = response.clone()
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
        // return the close to other function can do
        // response.json() again
        return responseClone
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
