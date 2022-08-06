import { getApi } from "../../api"
import { TSubmitFormProps, TSubmitFormResponse } from "../../typedefs/form"
import { post } from "../http"

export const submitForm = async <TFormData, TResponseData = Record<string, string>>(props: TSubmitFormProps<TFormData>): Promise<TSubmitFormResponse<TFormData, TResponseData>> => {
    const { url_name, dispatch, ignore_errors, data } = props

    const url = getApi(url_name)

    const response = await post({url, ignore_errors, dispatch, data})
    let json: any = undefined
    try {
        json = await response.json()
    } catch { // perhaps there is no data
    }
    const res: TSubmitFormResponse<TFormData, TResponseData> = {
        ok: response.ok,
        status: response.status
    }

    if (response.ok) {
        res.response_data = json
    } else if (ignore_errors.includes(response.status)) {
        res.errors = json
    }

    return res
}