import { useCallback, useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil"
import { userPageTitleState } from "."
import { getApi } from "../../api"
import Table from "../../tables"
import { IListedOrder, IOrdersRequestResults } from "../../typedefs/order"
import { TTableConfig } from "../../typedefs/tables"
import { fmtDate, strAddress } from "../../utils"
import { FailedRetry, ModelessLoading } from "../../utils/components"
import { get } from "../../utils/http"


const orderListState = atom<IListedOrder[] | undefined>({
  key: 'UserOrderListState',
  default: undefined
})


const EmptyOrderList = () => {
  //TODO 1. server side implementation of empty order list, should return status 204 - no content
  //TODO 2. design component
  return (
    <div data-testid="notify-noorders" role="alert">You haven't made any orders.</div>
  )
}


const OrderList = () => {
  const orderList = useRecoilValue(orderListState) || []

  const config: TTableConfig<IListedOrder> = {
    headers: ['Order Number', 'Status', 'Order Total', 'Shipping Address', 'Date'],
    rows: orderList || [],
    getRow: (row: IListedOrder) => ({
      cells: [
        row.number,
        row.status,
        row.total_incl_tax.toString(),
        strAddress(row.shipping_address),
        fmtDate(row.date_placed)
      ],
      link: row.number
    })
  }

  if (orderList.length === 0) {
    return <EmptyOrderList />
  }

  return (
    <Table<IListedOrder> {...config} />
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
        <div className="mx-auto w-max">
          <FailedRetry text={requestError.errorMsg} actionText="Retry" action={retryAction} />
        </div> :
        <>
          {orderList ?
            <OrderList /> :
            <div className="mx-auto w-max">
              <ModelessLoading text="Retrieving contents. Just a moment . . ." />
            </div>
          }
        </>
      }
    </div>
  )
}


export default UserOrderList