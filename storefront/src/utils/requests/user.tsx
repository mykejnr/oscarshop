import { Dispatch } from 'redux';
import { getApi } from "../../api";
import { post } from "../../utils/http";
import { changeEmail, login, signup } from '../../reducers/user_reducer';


export const requestSignup = async (data: ISignupData, dispatch: Dispatch): Promise<TFormDataResponse<ISignupData>> => {
    const url = getApi('signup')
    const ignore_errors = [400]

    const response = await post({url, ignore_errors, dispatch, data,})
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


export const requestLogin = async (data: ILoginFormData, dispatch: Dispatch): Promise<TFormDataResponse<ILoginFormData>> =>{
    const url = getApi('login')
    const ignore_errors = [400, 401]

    const response = await post({url, ignore_errors, dispatch, data})
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

export const requestPasswordReset = async (data: IForgotPasswordData, dispatch: Dispatch): Promise<TFormDataResponse<IForgotPasswordData>> =>{
    const url = getApi('resetPassword')
    const ignore_errors = [400, 404]

    const response = await post({url, ignore_errors, dispatch, data})
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

export const confirmPasswordReset = async (data: IResetPasswordData, dispatch: Dispatch): Promise<TFormDataResponse<IResetPasswordData>> => {
    const url = getApi('confirmReset')
    const ignore_errors = [ 400 ]

    const response = await post({url, ignore_errors, dispatch, data})
    const res = {ok: response.ok, errors: undefined}

    if (response.status === 400) {
        res.errors = await response.json()
    }

    return res
}


export const requestChangePassword = async (data: IChangePasswordData, dispatch: Dispatch): Promise<TFormDataResponse<IChangePasswordData>> => {
    const url = getApi('changePassword')
    const ignore_errors = [ 400 ]

    const response = await post({url, ignore_errors, dispatch, data})
    const res = {ok: response.ok, errors: undefined}

    if (response.status === 400) {
        res.errors = await response.json()
    }

    return res
}


export const requestChangeEmail = async (data: IChangeEmailData, dispatch: Dispatch): Promise<TFormDataResponse<IChangeEmailData>> => {
    const url = getApi('changeEmail')
    const ignore_errors = [ 400 ]

    const response = await post({url, ignore_errors, dispatch, data})
    const res = {ok: response.ok, errors: undefined, response_data: undefined}

    if (response.ok) {
        res.response_data = await response.json()
    } else if (response.status === 400) {
        res.errors = await response.json()
    }

    return res
}


export const requestActivateEmail = async (data: IActivateEmailData, dispatch: Dispatch): Promise<TFormDataResponse<IActivateEmailData>> => {
    const url = getApi('activateEmail')
    const ignore_errors = [ 400 ]

    const response = await post({url, ignore_errors, dispatch, data})
    const res = {ok: response.ok, errors: undefined, response_data: undefined}

    if (response.ok) {
        const json = await response.json()
        res.response_data = json
        dispatch(changeEmail(json.new_email))
    } else if (response.status === 400) {
        res.errors = await response.json()
    }

    return res
}