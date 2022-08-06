import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useParams } from "react-router-dom"
import { atom, useRecoilState, useRecoilValue } from "recoil"
import { IAnonOrderCredentials, IAnonymousOrder, IOrderLine, TOrderSubTotalProps, TShippingDetailsRowProps } from "../typedefs/order"
import { createRawHtml, formatPrice } from "../utils"
import { FaileRtry, ModelessLoading } from "../utils/components"
import { submitForm } from "../utils/requests"
import moment  from "moment"
import { countries } from 'countries-list'


const orderState = atom<IAnonymousOrder>({
  key: 'AnonOrderState',
  default: undefined,
})


const Item = (props: {orderLine: IOrderLine}) => {
  const { orderLine } = props
  return (
    <div role='row' className="flex gap-5 justify-between py-2 items-center border-b last-of-type:border-b-0">
      <div className="w-20"><img src={orderLine.image} alt="order line item" /></div>
      <div className="grow">{orderLine.title}</div>
      <div className="text-sm">{formatPrice(orderLine.unit_price_incl_tax)}</div>
      <div className="text-sm">x {orderLine.quantity}</div>
      <div className="text-sm">{formatPrice(orderLine.line_price_incl_tax)}</div>
    </div>
  )
}


const Items = () => {
  const order = useRecoilValue(orderState)
  
  return (
    <div className="px-5">
      {
        order.lines.map((line, ) => (
          <Item key={line.id} orderLine={line} />
        ))
      }
    </div>
  )
}


const ShippingDetailsRow = (props: TShippingDetailsRowProps) => {
  const {field, value, isHtml} = props

  return (
    <div className="flex gap-2 mb-3">
      <div className="font-semibold text-right w-1/2 box-border">{field}:</div>
      { isHtml ?
        <div dangerouslySetInnerHTML={createRawHtml(value)} /> :
        <div>{value}</div>
      }
    </div>
  )
}


const ShippingDetails = () => {
  const sh = useRecoilValue(orderState).shipping_address
  const country = countries[sh.country as keyof typeof countries]

  return (
    <div className="bg-white rounded-lg p-5 w-[400px] shrink-0 box-border">
      <div className="font-bold text-center mb-5 border-b border-gray-400 pb-2">Delivery Details</div>
      <div>
        <ShippingDetailsRow field="Firstname" value={sh.first_name} />
        <ShippingDetailsRow field="Lastname" value={sh.last_name} />
        <ShippingDetailsRow field="Country" value={country.name} />
        <ShippingDetailsRow field="Phone Number" value={`(${sh.postcode}) ${sh.phone_number}`} />
        <ShippingDetailsRow field="State/Region" value={sh.state} />
        <ShippingDetailsRow field="City" value={sh.line4} />
        <ShippingDetailsRow field="Address" value={sh.line1} />
      </div>
    </div>
  )
}


const SubTotals = (props: TOrderSubTotalProps) => {
  const {label, amount} = props

  return (
    <div className="flex justify-between mb-2">
        <div>{label}</div>
        <div className="text-sm">{formatPrice(amount)}</div>
    </div>
  )
}


const OrderHead = () => {
  const order = useRecoilValue(orderState)
  const orderDate = moment(order.date_placed).format("Do MMM, YYYY")
  return (
    <div className="flex justify-between border-b border-gray-400 px-2 pb-2 mb-5">
      <div>Date created: <time dateTime={order.date_placed} className="font-bold">
        {orderDate}
      </time></div>
      <div>Order Status: <span className="font-bold">{order.status}</span></div>
    </div>
  )
}


const OrderTotals = () => {
  const order = useRecoilValue(orderState)
  return (
    <>
      <div className="border-t border-gray-400 mt-5 pt-2 px-2">
        <SubTotals label="Subtotal" amount={order.total_incl_tax - order.shipping_incl_tax} />
        <SubTotals label="Shipping" amount={order.shipping_incl_tax} />
        <SubTotals label="Discount" amount={0.00} />
      </div>
      <div className="border-t border-gray-400 mt-5 pt-2 px-2 font-bold">
        <SubTotals label="Order Total" amount={order.total_incl_tax} />
      </div>
    </>
  )
}


const Order = () => {
  let {uuid, token} = useParams()
  const dispatch = useDispatch()
  const [order, setOrder] = useRecoilState(orderState)
  const [requestError, setRequestError] = useState<string | undefined>(undefined)
  const [retries, setRetries] = useState(0)

  useEffect(() => {
    submitForm<IAnonOrderCredentials, IAnonymousOrder>({
      dispatch,
      url_name: 'anonymousOrder',
      ignore_errors: [400, 403, 404],
      data: {uuid: uuid || "", token: token || ""}
    })
    .then((response) => {
      if (response.ok) {
        setRequestError(undefined)
        response.response_data &&
        setOrder(response.response_data)
      } else {
        if (response.status === 404) {
          const msg = "The url is either incorrect or the order you requested might no longer exist. Please contact customer support for further assistance."
          setRequestError(msg)
        } else if (response.status === 403) {
          setRequestError("The url is incorrect.")
        } else if (response.status === 400) {
          const msg = "Something happened while requesting order. Please try again or contact customer support."
          setRequestError(msg)
        } else { // all order issues
          // setRequestError handles unexpected errors and shows a popup message
          // however we indicate that "something is wrong" on the page itself
          //TODO log unexpected error
          const msg = "An unexpected error occured. We are working to fix this issue."
          setRequestError(msg)
        }
      }
    })
  // eslint-disable-next-line
  }, [retries])

  const retryFetch = () => {
    setRequestError(undefined)
    setRetries(retries+1)
  }

  return (
    <div className="bg-gray-100 px-5 pb-10 border-t border-gray-300">
      <div className="text-center py-4 uppercase text-accent-400 font-bold">
        Order
        {order ? ` #${order.number}` : ""}
      </div>
      {requestError ?
        <div className="flex justify-center my-20">
          <FaileRtry text={requestError} actionText="Retry" action={retryFetch} />
        </div> :
        (!order ?
          <div className="flex justify-center my-20">
            <ModelessLoading text="Retrieving contents. Just a moment..." />
          </div> :
          <div className="max-w-[1200px] mx-auto flex gap-10">
            <div className="grow bg-white rounded-lg p-5">
              <OrderHead />
              <Items />
              <OrderTotals />
            </div>
            <ShippingDetails />
          </div>
        )
      }
    </div>
  )
}


export default Order