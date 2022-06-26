import { Dispatch } from "redux"
import { APIName, getApi } from "../../api"
import { post } from "../http"

type TSubmitFormProps<TFormData> = {
    url_name: APIName,
    dispatch: Dispatch,
    ignore_errors: number[]
    data: TFormData
}


export const submitForm = async <TFormData, TResponseData = Record<string, string>>(props: TSubmitFormProps<TFormData>): Promise<TFormDataResponse<TFormData, TResponseData>> => {
    const { url_name, dispatch, ignore_errors, data } = props

    const url = getApi(url_name)

    const response = await post({url, ignore_errors, dispatch, data})
    const json = await response.json()
    const res: TFormDataResponse<TFormData, TResponseData> = {ok: response.ok}

    if (response.ok) {
        res.response_data = json
    } else if (ignore_errors.includes(response.status)) {
        res.errors = json
    }

    return res
}