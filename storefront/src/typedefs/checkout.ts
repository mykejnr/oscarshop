import { UseFormReturn } from 'react-hook-form'
import { TFieldInputProps, TRadioOption } from '../forms/base'
import { TSubmitFormErrors } from './form'
import { APIName } from '../api'
import { RecoilState } from 'recoil'
import { IShippingAddress as AIShippingAddress } from './address'


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

// kept here for legacy sake
export interface IShippingAddress extends AIShippingAddress {}

export interface ICheckoutFormData extends Record<string, string | Record<string, string>>  {
  guest_email: string,
  shipping_method: string,
  payment_method: string,
  shipping_address: IShippingAddress
}

export type TMethodProps<TFetchData> = {
  api: APIName,
  methodsState: RecoilState<TRadioOption[]>,
  sectionProps: TFormSectionProps,
  name: string,
  caption: string,
  transform: (responseData: TFetchData[]) => TRadioOption[]
}

export interface IShippingMethod {
  code: string,
  name: string,
  description: string,
  price: number
}

export interface IPaymentMethod {
  label: string,
  name: string
  description: string,
  icon: string
}

export type TCheckoutState = {
  serverErrors?: TSubmitFormErrors<ICheckoutFormData>,
  section: TFormSection
}

export type TPaymentStatusText = 'IDLE' | 'CONNECTING' | 'REQUESTING' | 'WAITING' | 'AUTHORIZED' | 'TIMEOUT' | 'ERROR' | 'DISCONNECTED'

export type TPaymentResponse = {
  status: number
  status_text: TPaymentStatusText
  message: string
}

export type TPaymentRequestUIProps = {
  response: TPaymentResponse
  processPayment: (momo_number: number) => void,
  paymentMethod: string
}