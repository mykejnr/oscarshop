type TNavigatorProps = {
  label: string,
  current?: boolean,
  Icon: import('react-icons').IconType
}

type TFormSection = 'ship_address' | 'ship_method' | 'pay_method' | 'review' | 'nosection'

type TFormSectionProps =  UseFormReturn<ICheckoutFormData>

type TSectionElement = {
  (props: TFormSectionProps): JSX.Element,
  label: string
}

type TNavButtonProps = {
  section: TFormSection,
  onNext: Function,
  onPrev: Function
}

interface IShippingAddress extends Record<string, string> {
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

interface ICheckoutFormData extends Record<string, string | Record<string, string>>  {
  guest_email: string,
  shipping_method: string,
  payment_method: string,
  shipping_address: IShippingAddress
}
