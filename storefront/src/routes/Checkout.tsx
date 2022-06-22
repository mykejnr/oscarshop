import { useState } from "react"
import { useForm, UseFormReturn } from "react-hook-form"
import { useSelector } from "react-redux"
import { Field, RadioField, TSelectOptions } from "../forms/base"
import { formatPrice } from "../utils"
import { MdLocationCity, MdLocalShipping, MdAttachMoney, MdChecklist } from 'react-icons/md';
import { IconType } from "react-icons"
import { countries } from 'countries-list'


const Navigator = ({label, current, Icon}: TNavigatorProps) => {
  let styles = 'flex w-1 h-1 p-3 border-2 rounded-full items-center justify-center'
  let buttonStyle = 'flex items-center'

  if (current){
    styles = `${styles} border-accent-400`
    buttonStyle = `${buttonStyle} text-accent-400`
  } else {
    buttonStyle = `${buttonStyle} text-gray-300 hover:text-gray-500`
  }

  return (
  <button className={buttonStyle}>
    <span className={styles}>
      <span className="box-border text-center"><Icon /></span>
    </span>
    <span className="ml-4">{label}</span>
  </button>

  )
}


const Navigation = ({section}: {section: TFormSection}) => {
  return (
    <div className="flex justify-around">
      <Navigator key={1} Icon={MdLocationCity} label={'Address'} current={section==='ship_address'}/>
      <Navigator key={2} Icon={MdLocalShipping} label={'Shipping'}  current={section==='ship_method'}/>
      <Navigator key={3} Icon={MdAttachMoney} label={'Payment'} current={section==='pay_method'} />
      <Navigator key={4} Icon={MdChecklist} label={'Review'} current={section==='review'} />
    </div>
  )
}


const Shipping = (props: TFormSectionProps) => {
  const notes_label = "Any other thing we should know when delivering"
  const [ countriesOpts, setCountries ] = useState<TSelectOptions | undefined>(undefined)
  // create a dotted string to be used as name argument
  // i.e prepend 'shipping' to the name of the field
  const n = (name: string) => `shipping_address.${name}`
  // loop through countries to create a Record<country_code, conuntry_name> and
  // cache it, so that we don't have to perform this operation every time

  if (countriesOpts === undefined) {
    const c: Record<string, string> = {}
    Object.entries(countries).forEach(([country_code, {name}]) => {
      c[country_code] = name
    })
    setCountries(c)
  } 

  const country_code: keyof typeof countries =  props.watch(n('country'), 'AD') as keyof typeof countries
  const postcode = countries[country_code].phone
  props.setValue(n('postcode'), postcode)

  return (
    <>
      <div className="flex gap-5">
        <div className="grow"><Field name={n("first_name")} type="text" {...props} /></div>
        <div className="grow"><Field name={n("last_name")} type="text" {...props} /></div>
      </div>
      <div className="flex gap-5">
        <div className="shrink-0 grow"><Field options={countriesOpts} name={n("country")} type="select" {...props} /></div>
        <div className="w-24 shrink-0"><Field disabled name={n("postcode")} type="text" {...props} /></div>
        <div className="w-36 shrink-0"><Field name={n("phone_number")} type="tel" {...props} /></div>
      </div>
      <div className="flex gap-5">
        <div className="grow"><Field name={n("state")} type="text" label="State/County/Region" {...props} /></div>
        <div className="grow"><Field name={n("line4")} type="text" label="City" {...props} /></div>
      </div>
      <Field name={n("line1")} type="text" label="Address" {...props} />
      <Field name={n("notes")} rows={5} type="textarea" label={notes_label} {...props} />
    </>
  )
}
Shipping.label = 'Shipping Address'


const ShippingMethod = (props: TFormSectionProps) => {
  const caption = "Select shipping method"
  const description = "A very long but brief description of a shipping method"
  const options = [
    {value: 'free_shipping', label: "Free Shipping", description},
    {value: 'delivery_only', label: 'Delivery Only', description},
    {value: 'delivery_n_shipping', label: 'Delivery and Shipping', description}
  ]
  return (
    <fieldset>
      <legend className="font-bold mb-5">{caption}</legend>
      <RadioField name="shipping_method" {...props} options={options} />
    </fieldset>
  )
} 
ShippingMethod.label = 'Shipping Method'


const PaymentMethod = (props: TFormSectionProps) => {
  const caption = "Select payment method"
  const description = "A very long but brief description of a shipping method"
  const options = [
    {value: 'mtn_momo', label: "MTN MobileMoney", description, icon: 'momo.jpg'},
    {value: 'voda_cash', label: 'Vodafone Cash', description, icon: 'vfcash.jpg'},
  ]
  return (
    <fieldset>
      <legend className="font-bold mb-5">{caption}</legend>
      <RadioField name="payment_method" {...props} options={options} />
    </fieldset>
  )
}
PaymentMethod.label = "Payement Method"


const ReviewField = ({name, value}: {name: string, value: string}) => (
  <div className="mb-5">
    <div className="text-sm font-semibold">{name}</div>
    <div>{value}</div>
  </div>
)


const Review = (props: TFormSectionProps) => {
  const { getValues } = props
  const {
    shipping_method,
    payment_method,
    shipping_address,
  } = getValues()
  const sa = shipping_address

  const fullname = `${sa.first_name} ${sa.last_name}`
  const city = `${sa.line4}, ${sa.state}`
  const phone = `(${sa.postcode}) ${sa.phone_number}`

  return (
    <div>
      <div className="font-bold mb-5">Shipping Address</div>
      <div className="grid grid-cols-2 pl-5">
        <ReviewField name='Name' value={fullname} />
        <ReviewField name='Country' value={sa.country} />
        <ReviewField name='City' value={city} />
        <ReviewField name='Address' value={sa.line1} />
        <ReviewField name='Phone' value={phone} />
      </div>
      <div className="font-bold mb-5">Other Information</div>
      <div className="grid grid-cols-2 pl-5">
        <ReviewField name='Shipping Method' value={shipping_method} />
        <ReviewField name='Payment Method' value={payment_method} />
      </div>
      <div className="font-bold mb-5">Notes</div>
      <div className="pl-5">{sa.notes}</div>
    </div>
  )
}
Review.label = 'Review'


const BasketLine = ({product, quantity}: IBasketLine) => (
  <div className="flex justify-between py-3 border-b last:border-0 gap-4">
    <div className="grow">
      <div className="">{product.title}</div>
      <div className="text-gray-400 text-sm">Qty {quantity} x {formatPrice(product.price)}</div>
    </div>
    <div className="shrink text-sm">{formatPrice(quantity * product.price)}</div>
  </div>
)


const TotalLine = ({item, amount}: {item: string, amount: number}) => (
  <div className="text-sm flex gap-4 justify-between py-1 font-semibold">
    <div className="">{item}</div>
    <div className="">{formatPrice(amount)}</div>
  </div>
)


const BasketSummary = () => {
  const cart = useSelector((state:IRootState) => state.cart)

  return (
    <div className="w-96 shrink-0 border-l p-7">
      <div className="font-semibold pb-3 border-b">Basket Summary</div>
      <div className="px-5 border-b">
        {
          cart.lines.map((line) => <BasketLine {...line} key={line.id} />)
        }
      </div>
      <div className="border-b py-3">
        <TotalLine item="Subtotal" amount={cart.total_price} />
        <TotalLine item="Shipping" amount={0} />
        <TotalLine item="Discount" amount={0} />
      </div>
      <div className="gap-4 justify-between flex pt-3">
        <div className="font-bold">Total</div>
        <div className="font-semibold text-accent-500">{formatPrice(cart.total_price)}</div>
      </div>
    </div>
  )
}


/**
 * Receives an name of a form section and returns a tuple of  Section element
 * the name of preview section and name of next section
 * @param section name of form section of type TFormSection
 * @returns [Section element, name of prev section, name of next section]
 */
const getSection = (section: TFormSection): [TSectionElement, TFormSection, TFormSection] => {
    switch(section) {
      case 'ship_address': return [Shipping, 'nosection', 'ship_method']
      case 'ship_method': return [ShippingMethod, 'ship_address', 'pay_method']
      case 'pay_method': return [PaymentMethod, 'ship_method', 'review']
      default: return [Review, 'pay_method', 'nosection']
    }
}


const Checkout = () => {
  const useFormReturn = useForm<ICheckoutFormData>({})
  const [ section, setSection ] = useState<TFormSection>('ship_address')
  const [CurrentSection, prevSection, nextSection]= getSection(section)

  const next = () => setSection(nextSection)
  const back = () => setSection(prevSection)

  return (
    <div>
      <div className="text-center bg-gray-50 py-4 uppercase text-accent-400 font-bold">
        Checkout
      </div>
      <div className="bg-white px-7">
      <div className="max-w-[1200px] mx-auto flex">
        <div className="w-full px-20 pr-24 py-7 box-border">
          <Navigation section={section} />
          <div className="text-accent-400 font-semibold border-b relative my-10 border-accent-400">
            <span className="absolute -top-4 block bg-white pr-3">{CurrentSection.label}</span>
          </div>
          <form className="red">
            <CurrentSection {...useFormReturn} />
          </form>
          <div className="flex justify-between mt-10">
            {prevSection === 'nosection' ? <div></div> :  <button onClick={back} className="button w-28">Back</button>}
            {nextSection === 'nosection' ? <div></div> : <button onClick={next} className="button w-28">Next</button>}
          </div>
        </div>
        <BasketSummary />
      </div>
      </div>
    </div>
  )
}


type TNavigatorProps = {
  label: string,
  current?: boolean,
  Icon: IconType
}

type TFormSection = 'ship_address' | 'ship_method' | 'pay_method' | 'review' | 'nosection'

type TFormSectionProps =  UseFormReturn<ICheckoutFormData>

type TSectionElement = {
  (props: TFormSectionProps): JSX.Element,
  label: string
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


export default Checkout