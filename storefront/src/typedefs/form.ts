import { Dispatch } from "redux"
import { APIName } from "../api"
import { Path } from "react-hook-form";

export type TFieldName<TFormData> = Path<TFormData>

export type TSubmitFormProps<TFormData> = {
    url_name: APIName,
    dispatch: Dispatch,
    ignore_errors: number[]
    data: TFormData
}

export type TSubmitFormErrors<TFormData> = {
    // We arer using TSubmitFormErrors<any> here because as we recurse deep
    // into the nested object there is no way to pass down the type of the
    // other nested objects,
    // With this we get a type check for atleas the first level of the error
    // object
    [field in keyof Partial<TFormData>] : string[] | TSubmitFormErrors<any>
}

export type TSubmitFormResponse<TFormData, TResponseData = Record<string, string>> = {
    ok: boolean,
    errors?: TSubmitFormErrors<TFormData>,
    response_data?: TResponseData
}
