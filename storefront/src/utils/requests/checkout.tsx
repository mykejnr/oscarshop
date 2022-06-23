import { Dispatch } from "redux"
import { getApi } from "../../api"
import { post } from "../http"


export const requestCheckout = async (data: IResetPasswordData, dispatch: Dispatch): Promise<TFormDataResponse<IResetPasswordData, TOrder>> => {
    const url = getApi('checkout')
    const ignore_errors = [ 400 ]

    const response = await post({url, ignore_errors, dispatch, data})
    const res = {ok: response.ok, errors: undefined}

    if (response.status === 400) {
        res.errors = await response.json()
    }

    return res
}
