import { IShippingAddress } from "./address"

export interface IAnonOrderCredentials {
    uuid: string,
    token: string,
}

export type TOrder = {
    url: string,
    number: string,
    basket: string,
    items: number,
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
    anonymous?: IAnonOrderCredentials
}


export type TOrderSubTotalProps = {
    label: string
    amount: number 
}

export type TShippingDetailsRowProps = {
    field: string
    value: string,
    isHtml?: boolean
}

export interface IOrderLine {
    id: number,
    title: string,
    quantity: number,
    unit_price_incl_tax: number,
    unit_price_excl_tax: number,
    line_price_incl_tax: number,
    line_price_excl_tax: number,
    line_price_before_discounts_incl_tax: number,
    line_price_before_discounts_excl_tax: number,
    image: string,
}


export interface IListedOrder extends TOrder {
    shipping_address: IShippingAddress
}


export interface IOrdersRequestResults {
    count: number,
    next: number | null,
    previous: number | null,
    results: IListedOrder[]
}


export interface IDetailedOrder extends IListedOrder {
    lines: IOrderLine[]
}


// kept here for legacy reason
export interface IAnonymousOrder extends  IDetailedOrder{}


export type TOrderViewProps = {
    order?: IDetailedOrder
    requestError?: string
    retryFetch: () => void
}

export type TOrderRowItemProps = {
    order: IListedOrder,
    index: number
}