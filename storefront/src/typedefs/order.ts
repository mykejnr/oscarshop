export type TOrder = {
    url: string,
    number: string,
    basket: string,
    user: string,
    currency: string,
    total_incl_tax: number,
    total_excl_tax: number,
    shipping_incl_tax: number, 
    shipping_excl_tax: number, 
    shipping_method: string,
    shipping_code: string,
    status: string,
    guest_email: string,
    date_placed: string,
    anonymous?: {
        uuid: string,
        token: string
    }
}


export type TOrderSubTotalProps = {
    label: string
    amount: number 
}

export type TShippingDetailsRowProps = {
    field: string
    value: string
}