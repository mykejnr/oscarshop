import { Dispatch } from "redux"
import { submitForm } from "."
import { ICheckoutFormData } from "../../typedefs/checkout"
import { TSubmitFormResponse } from "../../typedefs/form"
import { TOrder } from "../../typedefs/order"


export const requestCheckout = async (data: ICheckoutFormData, dispatch: Dispatch): Promise<TSubmitFormResponse<ICheckoutFormData, TOrder>> => {
    return submitForm({
        data,
        dispatch,
        ignore_errors: [400],
        url_name: 'checkout'
    })
}