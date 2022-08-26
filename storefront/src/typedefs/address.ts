export interface IShippingAddress extends Record<string, any> {
  first_name: string,
  last_name: string,
  state: string,
  line4: string,
  line1: string,
  postcode: string,
  phone_number: string,
  country: string,
  notes: string,
}


export interface IUserAddress extends IShippingAddress {
  user: number 
  is_default_for_shipping: boolean
  is_default_for_billing: boolean
  num_orders_as_shipping_address: number
  num_orders_as_billing_address: number
  date_created: string
}