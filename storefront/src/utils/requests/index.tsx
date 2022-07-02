import { getApi } from "../../api"
import { TSubmitFormProps, TSubmitFormResponse } from "../../typedefs/form"
import { post } from "../http"

export const submitForm = async <TFormData, TResponseData = Record<string, string>>(props: TSubmitFormProps<TFormData>): Promise<TSubmitFormResponse<TFormData, TResponseData>> => {
    const { url_name, dispatch, ignore_errors, data } = props

    const url = getApi(url_name)

    const response = await post({url, ignore_errors, dispatch, data})
    const json = await response.json()
    const res: TSubmitFormResponse<TFormData, TResponseData> = {ok: response.ok}

    if (response.ok) {
        res.response_data = json
    } else if (ignore_errors.includes(response.status)) {
        res.errors = json
    }

    return res
}