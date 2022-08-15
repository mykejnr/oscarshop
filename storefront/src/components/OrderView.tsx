import { IAnonymousOrder, IOrderLine, TOrderSubTotalProps, TOrderViewProps, TShippingDetailsRowProps } from "../typedefs/order"
import { createRawHtml, formatPrice } from "../utils"
import { FailedRetry, ModelessLoading } from "../utils/components"
import moment  from "moment"
import { countries } from 'countries-list'


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


const Items = ({order}: {order: IAnonymousOrder}) => {
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


const ShippingDetails = ({order}: {order: IAnonymousOrder}) => {
  const sh = order.shipping_address
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


const OrderHead = ({order}: {order: IAnonymousOrder}) => {
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


const OrderTotals = ({order}: {order: IAnonymousOrder}) => {
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


export const OrderView = (props: TOrderViewProps) => {
  const {order, requestError, retryFetch} = props

  return (
    <>
      {requestError ?
        <div className="flex justify-center my-20">
          <FailedRetry text={requestError} actionText="Retry" action={retryFetch} />
        </div> :
        (!order ?
          <div className="flex justify-center my-20">
            <ModelessLoading text="Retrieving contents. Just a moment..." />
          </div> :
          <div className="max-w-[1200px] mx-auto flex gap-10">
            <div className="grow bg-white rounded-lg p-5">
              <OrderHead order={order} />
              <Items order={order} />
              <OrderTotals order={order} />
            </div>
            <ShippingDetails order={order} />
          </div>
        )
      }
    </>
  )
}