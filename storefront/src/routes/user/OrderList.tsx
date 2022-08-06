import { useEffect } from "react"
import { Link } from "react-router-dom"
import { useSetRecoilState } from "recoil"
import { userPageTitleState } from "."
import { TDProps } from "../../typedefs/utils"

const TD = (props: TDProps) => {
  const {isth, children, className} = props
  const styles = `border text-left px-2 py-1 ${className || ""}`

  if (isth) {
    return <th className={styles + "font-semibold"}>{children}</th>
  }
  return (
    <td className={styles}>{children}</td>
  )
}


const OrderItem = ({index}: {index: number}) => {
  // elem:nth-of type is not enabled by default, so we do this
  // quick hack instead, of enabling it
  const exStyles = !(index % 2) ? 'bg-gray-50' : ''

  return (
    <tr className={''+exStyles}>
      <TD><Link to="100012" className="text-accent-400 font-semibold">100012</Link></TD>
      <TD>Pending</TD>
      <TD>236.23</TD>
      <TD>5</TD>
      <TD>KNT/A 147 Kunka, Obuasi, ASHANTI,</TD>
      <TD>28th Jan, 2021</TD>
    </tr>
  )
}



const OrderList = () => {
  const items = [1, 2, 3, 4, 5]

  return (
    <table className="w-full">
      <thead>
        <tr>
          <TD isth>Order number</TD>
          <TD isth>Status</TD>
          <TD isth>Order Total</TD>
          <TD isth>Items</TD>
          <TD isth>Shipping address</TD>
          <TD isth>Date</TD>
        </tr>
      </thead>
      <tbody>
        {
          items.map((item, idx) => <OrderItem key={idx} index={idx} />)
        }
      </tbody>
    </table>
  )
}


const UserOrderList = () => {
  const setTitle = useSetRecoilState(userPageTitleState)
  // eslint-disable-next-line
  useEffect(() => setTitle("Order History"), [])
  return (
    <div className="bg-white rounded-lg p-7">
      <OrderList />
    </div>
  )
}


export default UserOrderList