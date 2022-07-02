import { UseFormReturn } from 'react-hook-form'
import { TFieldInputProps, TRadioOption } from '../forms/base'
import { TSubmitFormErrors } from './form'


export type TFormSection = 'ship_address' | 'ship_method' | 'pay_method' | 'review' | 'nosection'

export type TNavigatorProps = {
  label: string,
  Icon: import('react-icons').IconType,
  name: TFormSection
}

export type TFormSectionProps = UseFormReturn<ICheckoutFormData>

export type TSectionElement = {
  (props: TFormSectionProps): JSX.Element,
  label: string
}

export type TLocalFieldProps = {
  radioOptions?: TRadioOption[],
} & TFieldInputProps<ICheckoutFormData>

export type TNavButtonProps = {
  onNext: Function,
  onPrev: Function,
  submitting: boolean,
}

export interface IShippingAddress extends Record<string, string> {
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

export interface ICheckoutFormData extends Record<string, string | Record<string, string>>  {
  guest_email: string,
  shipping_method: string,
  payment_method: string,
  shipping_address: IShippingAddress
}

export type TCheckoutState = {
  serverErrors?: TSubmitFormErrors<ICheckoutFormData>,
  section: TFormSection
}