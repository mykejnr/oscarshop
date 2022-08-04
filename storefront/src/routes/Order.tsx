import { TOrderSubTotalProps, TShippingDetailsRowProps } from "../typedefs/order"
import { formatPrice } from "../utils"


const Item = () => {
  return (
    <div className="flex gap-5 justify-between py-2 items-center border-b last-of-type:border-b-0">
      <div className="w-20"><img src="/images/momo.jpg" /></div>
      <div className="grow">Ladies Jamp suite is available</div>
      <div className="text-sm">{formatPrice(45.00)}</div>
      <div className="text-sm">x 3</div>
      <div className="text-sm">{formatPrice(45*3)}</div>
    </div>
  )
}


const Items = () => {
  const items = [1, 2, 3]
  
  return (
    <div className="px-5">
      {
        items.map((item) => (
          <Item />
        ))
      }
    </div>
  )
}


const ShippingDetailsRow = (props: TShippingDetailsRowProps) => {
  const {field, value} = props

  return (
    <div className="flex gap-2 mb-3">
      <div className="font-semibold text-right w-1/2 box-border">{field}:</div>
      <div>{value}</div>
    </div>
  )
}


const ShippingDetails = () => {
  return (
    <div className="bg-white rounded-lg p-5 w-[400px] shrink-0 box-border">
      <div className="font-bold text-center mb-5 border-b border-gray-400 pb-2">Delivery Details</div>
      <div>
        <ShippingDetailsRow field="Firstname" value="Michael" />
        <ShippingDetailsRow field="Lastname" value="Mensah" />
        <ShippingDetailsRow field="Country" value="Ghana" />
        <ShippingDetailsRow field="Phone Number" value="(+233) 0248352555" />
        <ShippingDetailsRow field="State/Region" value="Ahafo" />
        <ShippingDetailsRow field="City" value="Bechem" />
        <ShippingDetailsRow field="Address" value="NT #9 BLK D Brosankro" />
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


const Order = () => {
  return (
    <div className="bg-gray-100 px-5 pb-10 border-t border-gray-300">
      <div className="text-center py-4 uppercase text-accent-400 font-bold">
        Order
      </div>
      <div className="max-w-[1200px] mx-auto flex gap-10">
        <div className="grow bg-white rounded-lg p-5">
          <div className="flex justify-between border-b border-gray-400 px-2 pb-2 mb-5">
            <div>Date created: <time className="font-bold">25th March 2022</time></div>
            <div>Order Status: <span className="font-bold">Open</span></div>
          </div>
          <Items />
          <div className="border-t border-gray-400 mt-5 pt-2 px-2">
            <SubTotals label="Subtotal" amount={135.56} />
            <SubTotals label="Shipping" amount={15.00} />
            <SubTotals label="Discount" amount={0.00} />
          </div>
          <div className="border-t border-gray-400 mt-5 pt-2 px-2 font-bold">
            <SubTotals label="Order Total" amount={135.56} />
          </div>
        </div>
        <ShippingDetails />
      </div>
    </div>
  )
}


export default Order