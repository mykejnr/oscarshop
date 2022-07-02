import { useState } from "react"
import { atom, useRecoilValue, useRecoilState } from 'recoil'
import { SubmitHandler, useForm } from "react-hook-form"
import { useDispatch, useSelector } from "react-redux"
import { Field as GenericField, RadioField, TSelectOptions } from "../forms/base"
import { formatPrice } from "../utils"
import { MdLocationCity, MdLocalShipping, MdAttachMoney, MdChecklist } from 'react-icons/md';
import { countries } from 'countries-list'
import { submitForm } from "../utils/requests"
import { showPopup } from "../actions"
import { useNavigate } from "react-router-dom"
import { clearCart } from "../reducers/cart_reducer"
import { IBasket, IBasketLine } from "../typedefs/basket"
import { TOrder } from "./Order"
import { TSubmitFormErrors } from "../typedefs/form"
import { extractFieldErros } from "../forms/utils"

import type {
  ICheckoutFormData,
  TFormSection, TFormSectionProps,
  TLocalFieldProps, TNavButtonProps,
  TNavigatorProps, TSectionElement
} from "../typedefs/checkout"
import { Spinner } from "../utils/components"


const errorsState = atom<TSubmitFormErrors<ICheckoutFormData> | undefined>({
  key: 'CheckoutErrorState',
  default: undefined
})


const sectionState = atom<TFormSection>({
  key: 'CheckoutSectionState',
  default: 'ship_address'
})



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


/**
 * Receives the entire server error object and returns the name of the form section
 * that the error occored. If there are multiple errors, it returns the section that
 * comes first on the form
 * @param errors 
 */
const getErrorSection = <TFormData, >(errors: TSubmitFormErrors<TFormData>): TFormSection => {
  let section: TFormSection = 'ship_address'

  if (errors['shipping_address' as never]) {
    section= 'ship_address'
  }
  else if (errors['shipping_method' as never]) {
    section = 'ship_method'
  } else if (errors['payment_method' as never]) {
    section = 'pay_method'
  }

  return section
}


const getCheckoutMessage = (order: TOrder) => (
  `<div>
    <div>
      An email has been sent to ${order.guest_email}. The email contains a link
      to check the status of your order.
    </div>
    <div>Order Number: ${order.number}</div>
  </div>`
)


const Navigator = ({label, Icon, name}: TNavigatorProps) => {
  let styles = 'flex w-1 h-1 p-3 border-2 rounded-full items-center justify-center'
  let buttonStyle = 'flex items-center'
  const section = useRecoilValue(sectionState)

  if (name===section){
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


const Navigation = () => {
  return (
    <div className="flex justify-around">
      <Navigator Icon={MdLocationCity} label={'Address'} name='ship_address'/>
      <Navigator Icon={MdLocalShipping} label={'Shipping'}  name='ship_method'/>
      <Navigator Icon={MdAttachMoney} label={'Payment'} name='pay_method'/>
      <Navigator Icon={MdChecklist} label={'Review'} name='review'/>
    </div>
  )
}


const Field = (props: TLocalFieldProps) => {
  const {name, type, radioOptions } = props
  const errors = useRecoilValue(errorsState)
  const fieldErrors = errors ? extractFieldErros(errors, name) : undefined
  const args = {...props, fieldErrors }

  if (type === 'radio') {
    const options = radioOptions || []
    return (
      <RadioField {...args} options={options} />
    )
  }
  return (
    <GenericField {...args} />
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

  type TC = keyof typeof countries
  const country_code: TC =  props.watch(n('country'), 'AD') as TC
  const postcode = countries[country_code]?.phone
  postcode && props.setValue(n('postcode'), `+${postcode}`)

  return (
    <>
      <div className="flex gap-5">
        <div className="grow"><Field name={n("first_name")} {...props} /></div>
        <div className="grow"><Field name={n("last_name")} {...props} /></div>
      </div>
      <div className="flex gap-5 box-border">
        <div><Field type="select" options={countriesOpts} name={n("country")} {...props} /></div>
        <div className="w-24 shrink-0"><Field disabled name={n("postcode")} {...props} /></div>
        <div className="w-36 shrink-0"><Field name={n("phone_number")} type="tel" {...props} /></div>
      </div>
      <div className="flex gap-5">
        <div className="grow"><Field name={n("state")} label="State/County/Region" {...props} /></div>
        <div className="grow"><Field name={n("line4")} label="City" {...props} /></div>
      </div>
      <Field name={n("line1")} label="Address" {...props} />
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
      <Field type='radio' name="shipping_method" {...props} radioOptions={options} />
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
      <Field type='radio' name="payment_method" {...props} radioOptions={options} />
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
  const country = countries[sa.country as keyof typeof countries]

  return (
    <div>
      <div className="font-bold mb-5">Shipping Address</div>
      <div className="grid grid-cols-2 pl-5">
        <ReviewField name='Name' value={fullname} />
        <ReviewField name='Country' value={country.name} />
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
  const cart: IBasket = useSelector((state:IRootState) => state.cart)

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


const ButtonSpinner = () => (
  <>
    <span className="absolute left-2 top-[8px]">
      <Spinner />
    </span>
    Submitting
  </>
)


const NavButtons = (props: TNavButtonProps) => {
  const { onNext, onPrev, submitting } = props
  const section = useRecoilValue(sectionState)
  const [, prevSection, nextSection]= getSection(section)

  let styles ="relative w-[160px] rounded"
  if (submitting) {
    styles = `${styles} bg-green-300 text-gray-500`
  } else {
    styles = `${styles} bg-green-500 hover:bg-green-600 text-white`
  }

  return (
    <div className="flex justify-between mt-10">
      {
        prevSection === 'nosection' ?
        <div></div> :
        <button disabled={submitting} type="button" onClick={() => onPrev()} className="button w-28">Back</button>
      }
      {
        nextSection === 'nosection' ?
        <div></div> :
        <button type="button" data-testid='chonext' onClick={() => onNext()} className="button w-28">Next</button>
      }
      {
        section === 'review' &&
        <button type="submit" data-testid="chosubmit"
          disabled={submitting}
          className={styles}
        >
          {submitting ? <ButtonSpinner /> : 'Submit'}
        </button>
      }
    </div>
  )
}


const Checkout = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const useFormReturn = useForm<ICheckoutFormData>({})
  const [section, setSection ] = useRecoilState(sectionState)
  const [serverErrors, setServerErrors] = useRecoilState(errorsState)
  const [CurrentSection, prevSection, nextSection]= getSection(section)

  const { handleSubmit, formState: {isSubmitting} } = useFormReturn

  const next = () => setSection(nextSection)
  const back = () => setSection(prevSection)

  const ignore_errors = [400]

  const onSubmit: SubmitHandler<ICheckoutFormData> = async (data) => {
    const res = await submitForm<ICheckoutFormData, TOrder>({
        data, dispatch, ignore_errors, url_name: 'checkout'
    })
    if (res.ok) {
      dispatch(clearCart()) // Reset cart
      if (res.response_data) {
        const { anonnymous } = res.response_data
        anonnymous &&  navigate(`/order/${anonnymous.uuid}/${anonnymous.token}`)
        dispatch(showPopup({
          title: 'Order Placed',
          type: 'html',
          message: getCheckoutMessage(res.response_data)
        }))
      }
    } else {
      if (res.errors) {
        setServerErrors(res.errors)
        setSection(getErrorSection(res.errors))
      }
    }
  }

  return (
    <div>
      <div className="text-center bg-gray-50 py-4 uppercase text-accent-400 font-bold">
        Checkout
      </div>
      <div className="bg-white px-7">
      <div className="max-w-[1200px] mx-auto flex">
        <div className="w-full px-20 pr-24 py-7 box-border">
          {
            serverErrors && 
            <div className="text-red-500 bg-red-100 mb-5">
              There are errors in your form please fix them and resubmit
            </div>
          }
          <Navigation />
          <div className="text-accent-400 font-semibold border-b relative my-10 border-accent-400">
            <span className="absolute -top-4 block bg-white pr-3">{CurrentSection.label}</span>
          </div>
          <form onSubmit={handleSubmit(onSubmit)}>
            <CurrentSection {...useFormReturn} />
            <NavButtons onPrev={back} onNext={next} submitting={isSubmitting} />
          </form>
        </div>
        <BasketSummary />
      </div>
      </div>
    </div>
  )
}


export default Checkout