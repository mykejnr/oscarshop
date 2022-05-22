import { Action } from 'redux';
import { getApi } from "../api";
import { post } from "../utils/http";
import { signup } from '../reducers/user_reducer';


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
    return Promise.resolve({
        ok: true
    })
} 