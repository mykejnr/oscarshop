import { useCallback, useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { Link } from "react-router-dom"
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil"
import { userPageTitleState } from "."
import { getApi } from "../../api"
import { IListedOrder, IOrdersRequestResults, TOrderRowItemProps } from "../../typedefs/order"
import { TDProps } from "../../typedefs/utils"
import { fmtDate, strAddress } from "../../utils"
import { FailedRetry, ModelessLoading } from "../../utils/components"
import { get } from "../../utils/http"


const orderListState = atom<IListedOrder[] | undefined>({
  key: 'UserOrderListState',
  default: undefined
})



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


const OrderItem = (props: TOrderRowItemProps) => {
  const {index, order} = props
  // elem:nth-of type is not enabled by default, so we do this
  // quick hack instead, of enabling it
  const exStyles = !(index % 2) ? 'bg-gray-50' : ''

  return (
    <tr data-testid="order-row-item" className={''+exStyles}>
      <TD><Link to={order.number} className="text-accent-400 font-semibold">{order.number}</Link></TD>
      <TD>{order.status}</TD>
      <TD>{order.total_incl_tax}</TD>
      <TD>{order.items}</TD>
      <TD>{strAddress(order.shipping_address)}</TD>
      <TD>{fmtDate(order.date_placed)}</TD>
    </tr>
  )
}


const EmptyOrderList = () => {
  //TODO 1. server side implementation of empty order list, should return status 204 - no content
  //TODO 2. design component
  return (
    <div data-testid="notify-noorders" role="alert">You haven't made any orders.</div>
  )
}



const OrderList = () => {
  const orders = useRecoilValue(orderListState) || []

  if (orders.length === 0) {
    return <EmptyOrderList />
  }

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
          orders.map((order, idx) => <OrderItem key={order.number} index={idx} order={order} />)
        }
      </tbody>
    </table>
  )
}

type TErrorState = {
  errorMsg: string
  allowRetry: boolean
}

const UserOrderList = () => {
  const dispatch = useDispatch()
  const setTitle = useSetRecoilState(userPageTitleState)
  const [orderList, setOrderList] = useRecoilState(orderListState)
  const [requestError, setRequestError] = useState<TErrorState | undefined>(undefined)
  const ignore_errors: number[] = [403]
  const [retries, setRetries] = useState(0)

  // eslint-disable-next-line
  useEffect(() => setTitle("Order History"), [])

  const fetchOrders = useCallback(async () => {
    const res = await get({ url: getApi('orders'), data: null, dispatch, ignore_errors})
    if (res.status === 403) { //This shoud never happen, unauthenticated user!!
      setRequestError({
        errorMsg: "An unexpected error occured. Please contact customer support for assistance.",
        allowRetry: false
      })
      return
    }
    if (res.ok) {
      if (res.status === 204) { // 204 - no content
        setOrderList([]) 
        return
      }
      // update state with response data
      const data = (await res.json()) as IOrdersRequestResults
      setOrderList(data.results)
    } else {
      setRequestError({
        errorMsg: "Sorry! An unexpected error occured.",
        allowRetry: true
      })
    }
  // eslint-disable-next-line
  }, [])

  useEffect(() => {
    fetchOrders()
  // eslint-disable-next-line
  }, [retries])

  const retryFetch = () => {
    setRequestError(undefined)
    setRetries(retries + 1)
  }

  const retryAction = requestError?.allowRetry ? retryFetch : null

  return (
    <div className="bg-white rounded-lg p-7">
      {requestError ?
        <FailedRetry text={requestError.errorMsg} actionText="Retry" action={retryAction} /> :
        <>
          {orderList ?
            <OrderList /> :
            <ModelessLoading text="Retrieving contents. Just a moment..." />
          }
        </>
      }
    </div>
  )
}


export default UserOrderList