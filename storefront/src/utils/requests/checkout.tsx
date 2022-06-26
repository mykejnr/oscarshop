import { Dispatch } from "redux"
import { submitForm } from "."


export const requestCheckout = async (data: ICheckoutFormData, dispatch: Dispatch): Promise<TFormDataResponse<ICheckoutFormData, TOrder>> => {
    return submitForm({
        data,
        dispatch,
        ignore_errors: [400],
        url_name: 'checkout'
    })
}