import { useCallback, useEffect, useState, useRef } from "react"
import { atom, useRecoilValue, useRecoilState, selectorFamily } from 'recoil'
import { SubmitHandler, useForm, useWatch } from "react-hook-form"
import { useDispatch, useSelector } from "react-redux"
import { Field as GenericField, RadioField, TRadioOption, TSelectOptions } from "../forms/base"
import { formatPrice } from "../utils"
import { MdLocationCity, MdLocalShipping, MdAttachMoney, MdChecklist } from 'react-icons/md';
import { countries } from 'countries-list'
import { submitForm } from "../utils/requests"
import { showPopup } from "../actions"
import { useNavigate } from "react-router-dom"
import { clearCart } from "../reducers/cart_reducer"
import { IBasket, IBasketLine } from "../typedefs/basket"
import { TOrder } from "../typedefs/order"
import { TSubmitFormErrors } from "../typedefs/form"
import { extractFieldErros } from "../forms/utils"

import {
  ICheckoutFormData,
  IPaymentMethod,
  IShippingMethod,
  TFormSection, TFormSectionProps,
  TLocalFieldProps, TMethodProps, TNavButtonProps,
  TNavigatorProps, TPaymentRequestUIProps, TPaymentResponse, TPaymentStatusText, TSectionElement
} from "../typedefs/checkout"
import { ButtonSpinner, Failed, ModelessLoading, Spinner } from "../utils/components"
import { post } from "../utils/http"
import { getApi, getWsApi } from "../api"


const errorsState = atom<TSubmitFormErrors<ICheckoutFormData> | undefined>({
  key: 'CheckoutErrorState',
  default: undefined
})

const sectionState = atom<TFormSection>({
  key: 'CheckoutSectionState',
  default: 'ship_address'
})

const shipMethodsState = atom<TRadioOption[]>({
  key: 'CheckoutShipMethodState',
  default: []
})

const payMethodsState = atom<TRadioOption[]>({
  key: 'CheckoutPayMethodState',
  default: []
})

export const orderState = atom<TOrder>({
  key: 'CheckoutOrderState',
  default: undefined
})

const shipMethodSelected = selectorFamily<TRadioOption | undefined, string>({
  key: 'CheckoutShipMethodSelected',
  get: (ship_method) => ({get}) => {
    const methods = get(shipMethodsState)
    for (const method of methods) {
      if (method.value === ship_method) return method
    }
    return undefined
  }
})

const payMethodSelected = selectorFamily<TRadioOption | undefined, string>({
  key: 'CheckoutPayMethodSelected',
  get: (pay_method) => ({get}) => {
    const methods = get(payMethodsState)
    for (const method of methods) {
      if (method.value === pay_method) return method
    }
    return undefined
  }
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
    <div>Payment received. Thank you for doing business with us.</div>
    <div className="py-2">
      An email has been sent to ${order.guest_email}. The email contains a link
      to check the status and details of your order.
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


const Method = <TFetchData, >(props: TMethodProps<TFetchData>) => {
  const {
    api,
    methodsState,
    sectionProps,
    caption,
    name,
    transform
  } = props

  const dispatch = useDispatch()
  const url = getApi(api)
  const [options, setOptions] = useRecoilState(methodsState)
  const [fetchFailed, setFetchFailed] = useState(false)
  const [retries, setRetries] = useState(0)
  const loadingName  = name.replaceAll('_', ' ')

  const fetchOptions = useCallback(() => {
    // fetch methods on first render
    // ignore_errors: []; post() handles all server errors for now
    post({url, ignore_errors: [], dispatch, data: null})
    .then(response => {
      if (response.ok) return response.json()
      // error already dealth with inside 'post()'
      throw new Error()
    })
    .then((data: TFetchData[]) => {
      setOptions(transform(data))
    })
    .catch((err) => {
      setFetchFailed(true)
    })
  // eslint-disable-next-line
  }, [])
  
  useEffect(() => {
    fetchOptions()
  }, [retries, fetchOptions])

  const reFetch = () => {
    setFetchFailed(false)
    setRetries(retries+1)
  }

  if (fetchFailed) {
    return (
      <div className="w-max m-auto py-20">
        <Failed
          text="Fetching items failed. Please contact customer support if problem persists."
          action={reFetch}
        />
      </div>
    )
  }
  if (!options.length) {
    return (
      <div className="w-max m-auto py-20">
        <ModelessLoading text={`Fetching ${loadingName}...`} />
      </div>
    )
  }
  return (
    <fieldset>
      <legend className="font-bold mb-5">{caption}</legend>
      <Field type='radio' name={name} {...sectionProps} radioOptions={options} />
    </fieldset>
  )
}


const ShippingMethod = (props: TFormSectionProps) => {
  const transformData = (data: IShippingMethod[]): TRadioOption[] => {
    return data.map(({code, name, description, price}) => ({
      value: code,
      label: name,
      price,
      description,
    }))
  }

  return (
    <Method<IShippingMethod>
      caption="Select shipping method"
      name="shipping_method"
      sectionProps={props}
      api="shippingMethods"
      methodsState={shipMethodsState}
      transform={transformData}
    />
  )
} 
ShippingMethod.label = 'Shipping Method'


const PaymentMethod = (props: TFormSectionProps) => {
  const transformData = (data: IPaymentMethod[]): TRadioOption[] => {
    return data.map(({label, name, description, icon}) => ({
      value: label,
      label: name,
      icon,
      description,
    }))
  }

  return (
    <Method<IPaymentMethod>
      caption="Select payment method"
      name="payment_method"
      sectionProps={props}
      api="paymentMethods"
      methodsState={payMethodsState}
      transform={transformData}
    />
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

  const ship_method_name = useRecoilValue(shipMethodSelected(shipping_method))?.label || ""
  const pay_method_name = useRecoilValue(payMethodSelected(payment_method))?.label || ""

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
        <ReviewField name='Shipping Method' value={ship_method_name} />
        <ReviewField name='Payment Method' value={pay_method_name} />
      </div>
      <div className="font-bold mb-5">Notes</div>
      <div className="pl-5">{sa.notes}</div>
    </div>
  )
}
Review.label = 'Please Review Your Details Before You Submit'


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


const BasketSummary = (props: TFormSectionProps) => {
  const cart: IBasket = useSelector((state:IRootState) => state.cart)
  const order = useRecoilValue(orderState)
  // const ship_method = props.watch('shipping_method', '')
  const ship_method = useWatch({control: props.control, name: "shipping_method", defaultValue: ""})
  const ship_fee = useRecoilValue(shipMethodSelected(ship_method as string))?.price || 0
  let total: number, subtotal: number

  // As soon as order is created then, the cart should have been emptied
  if (order !== undefined) {
    total = order.total_excl_tax
    subtotal = total - ship_fee
  } else {
    subtotal = cart.total_price
    total = subtotal + ship_fee
  }

  return (
    <div className="w-96 shrink-0 border-l p-7">
      <div className="font-semibold pb-3 border-b">Basket Summary</div>
      <div className="px-5 border-b">
        {
          cart.lines.map((line) => <BasketLine {...line} key={line.id} />)
        }
      </div>
      <div className="border-b py-3">
        <TotalLine item="Subtotal" amount={subtotal} />
        <TotalLine item="Shipping" amount={ship_fee} />
        <TotalLine item="Discount" amount={0} />
      </div>
      <div className="gap-4 justify-between flex pt-3">
        <div className="font-bold">Total</div>
        <div className="font-semibold text-accent-500">{formatPrice(total)}</div>
      </div>
    </div>
  )
}


const PaymentRequestUI = (props: TPaymentRequestUIProps) => {
  const {response, processPayment, paymentMethod} = props
  const order = useRecoilValue(orderState)
  const numberRef = useRef<HTMLInputElement>(null)
  const [numberValid, setNumberValid] = useState(true)
  const pay_method_options = useRecoilValue(payMethodSelected(paymentMethod))
  const pay_method_name = pay_method_options?.label
  const pay_method_icon = pay_method_options?.icon

  const inputStyle = 'border rounded h-10 px-1 inline-block box-border'
  const showSpinner = response.status === 102 // processing
  let resMessage = ''

  // All statuses > 0 has some important message to show
  if (response.status > 0 ) {
    resMessage = `(${response.status_text}) ${response.message}`
  }

  const initPayment = () => {
    const momo_number = Number(numberRef.current?.value.trim())
    const isNumber = !(Number.isNaN(momo_number)) && (momo_number !== 0)
    setNumberValid(isNumber)
    isNumber && processPayment(momo_number)
  }

  return (
    <div className="w-full p-10">
    <div className="mx-auto w-[300px] box-border border rounded-b-md">
      <div className="bg-accent-500 text-white p-5 text-center">
        <div className="font-semibold uppercase">Make Payment</div>
        <div className="text-2xl font-bold py-1">{formatPrice(order.total_excl_tax)}</div>
        <div className="flex gap-2 mx-auto w-max">
          <div className="w-10">
            <img className="w-full" src={`images/${pay_method_icon}`} alt="payment gateway logo" />
          </div>
          <span>{pay_method_name}</span>
        </div>
      </div>
      <div className="w-full box-border p-5">
        <div className="font-semibold mb-2">Enter Mobile Money Number</div>
        <div className="flex gap-2 box-border">
          <input className={`${inputStyle} w-[60px] grow-0 text-center`} type='text' value='+233' disabled />
          <input ref={numberRef} className={`${inputStyle}`} type='text' placeholder="Eg. 248352555" />
        </div>
        {
          !numberValid && <div>Enter a valid phone number. Eg. (0248352555)</div>
        }
        <div className="my-7 flex gap-2 align-middle">
          {
            showSpinner && <span className="shrink-0"><Spinner /></span>
          }
          <div role={'status'} className="text-red-600 text-semibold text-sm">{resMessage}</div>
        </div>
        <ButtonSpinner
          type="button"
          showSpinner={showSpinner}
          text="Pay"
          spinText="Processing payment"
          addCSS="button w-full"
          onClick={initPayment}
        />
      </div>
    </div>
    </div>
  )

}


export const PaymentRequest = ({paymentMethod}: {paymentMethod: string}) => {
  const order = useRecoilValue(orderState)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [response, setResponse] = useState<TPaymentResponse>({status: 0, status_text: 'IDLE', message: ""})

  const processMessage = (ev: MessageEvent<TPaymentResponse>) => {
    let data: TPaymentResponse = JSON.parse(ev.data as never as string)
    if (data.status === 200) {
      dispatch(showPopup({
        title: 'Order Successfully Placed.',
        type: 'html',
        message: getCheckoutMessage(order)
      }))
      const { anonymous } = order
      anonymous &&  navigate(`/order/${anonymous.uuid}/${anonymous.token}`)
      data = {...data, status: 0, status_text: 'IDLE'}
    }
    setResponse(data)
  }

  const processError = (ev: Event) => {
    setResponse({
      status: 500,
      status_text: "ERROR", 
      message: "Sorry! An unexpected error occured. We will fix this issue shortly."
    })
  }

  const processClose = (ev: CloseEvent) => {
    if (ev.code > 1000) { // If close event is caused by an error
      let status_text: TPaymentStatusText = 'ERROR'
      let message = "Sorry! An unexpected error occured. We will fix this issue shortly."

      // or check for network connectivity
      if (!navigator.onLine) {
        message = 'Network connectivity error. Please check your internet connection.'
      }

      // payment gateway timed out
      if (ev.code === 4008) {
        status_text = 'TIMEOUT'
        message = 'Timed out waiting for payment confirmation.'
      }
      setResponse({status: 500, status_text, message })
    }
  }

  const processPayment = (momo_number: number) => {
    setResponse({status: 102, status_text: 'CONNECTING', message: 'Connecting to server...'})
    const ws = new WebSocket(getWsApi('payCheckout'))
    ws.onmessage = processMessage
    ws.onerror = processError
    ws.onclose = processClose
    ws.onopen = () => {
      ws.send(JSON.stringify({order_number: order.number, momo_number}))
    }
  }

  return <PaymentRequestUI
          response={response}
          processPayment={processPayment}
          paymentMethod={paymentMethod}
        />
}


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
        <ButtonSpinner type="submit" showSpinner={submitting} text="Submit" spinText="Submitting..." addCSS={styles}/>
      }
    </div>
  )
}


const Checkout = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const [order, setOrder] = useRecoilState(orderState)
  const cart: IBasket = useSelector((state:IRootState) => state.cart)

  const cart_n = cart.lines.length
  const order_n = order === undefined ? undefined  : order.number

  useEffect(() => {
    if (!cart_n && order_n === undefined) {
      const message = "Your basket is empty. Please add some items."
      dispatch(showPopup({message}))
      navigate('/catalogue/')
    }
  // eslint-disable-next-line
  }, [cart_n, order_n])

  const useFormReturn = useForm<ICheckoutFormData>({})
  const [section, setSection ] = useRecoilState(sectionState)
  const [serverErrors, setServerErrors] = useRecoilState(errorsState)
  const [CurrentSection, prevSection, nextSection]= getSection(section)

  const { handleSubmit, getValues, formState: {isSubmitting} } = useFormReturn

  const next = () => setSection(nextSection)
  const back = () => setSection(prevSection)

  const ignore_errors = [400]

  const onSubmit: SubmitHandler<ICheckoutFormData> = async (form_data) => {
    // first properly format phone number
    const {postcode, phone_number} = form_data.shipping_address
    const phone = postcode + Number(phone_number)
    const data = {...form_data}
    data.shipping_address.phone_number = phone

    const res = await submitForm<ICheckoutFormData, TOrder>({
        data, dispatch, ignore_errors, url_name: 'checkout'
    })
    if (res.ok) {
      dispatch(clearCart()) // Reset cart
      res.response_data && setOrder(res.response_data)
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
        {
          order ? <PaymentRequest paymentMethod={getValues().payment_method} /> :
          // true ? <PaymentRequest /> :
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
        }
        <BasketSummary {...useFormReturn}  />
      </div>
      </div>
    </div>
  )
}


export default Checkout