import { Action } from 'redux';
import { getApi } from "../api";
import { post } from "../utils/http";
import { login, signup } from '../reducers/user_reducer';


// LT = "Local Type" - incase redux make theirs public
// in the future
export type LTDispatch = (action: Action) => {}

export const requestSignup = async (data: ISignupData, dispatch: LTDispatch): Promise<TFormDataResponse<ISignupData>> => {
    const url = getApi('signup')
    const ignore_errors = [400]

    const response = await post({
        url,
        ignore_errors,
        dispatch,
        options: {
            body: JSON.stringify(data)
        }
    })
    const json = await response.json()

    if (response.ok) {
        dispatch(signup(json))
        return {
            ok: true
        }
    }

    let res = {ok: false, errors: undefined}

    if (response.status === 400) {
        res.errors = json
    }

    return res
}


export const requestLogin = async (data: ILoginFormData, dispatch: LTDispatch): Promise<TFormDataResponse<ILoginFormData>> =>{
    const url = getApi('login')
    const ignore_errors = [400, 401]
    const response = await post({
        url,
        ignore_errors,
        dispatch,
        options: { body: JSON.stringify(data) }
    })
    const json = await response.json()
    if (response.ok) {
        dispatch(login(json))
        return {ok: true}
    }
    if (response.status === 400) {
        return {ok: false, errors: json}
    }
    if (response.status === 401) { // Authentication failed
        return {ok: false, errors: {password: [json['message']]}}
    }
    return {ok: false}
} 

export const requestPasswordReset = async (data: IForgotPasswordData, dispatch: LTDispatch): Promise<TFormDataResponse<IForgotPasswordData>> =>{
    const url = getApi('resetPassword')
    const ignore_errors = [400, 404]
    const response = await post({
        url,
        ignore_errors,
        dispatch,
        options: { body: JSON.stringify(data) }
    })
    const json = await response.json()
    if (response.ok) {
        return {ok: true, response_data: json}
    }
    if (response.status === 400) {
        return {ok: false, errors: json}
    }
    if (response.status === 404) {
        return {ok: false, errors: {email: [json.message]}}
    }
    return {ok: false}
}

export const resetPassword = async (data: IResetPasswordData, dispatch: LTDispatch): Promise<TFormDataResponse<IResetPasswordData>> => {
    return {ok: true}
}
