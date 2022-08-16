import { useCallback, useEffect, useState } from "react"
import { useSetRecoilState } from "recoil"
import { userPageTitleState } from "."
import { IDetailedOrder } from "../../typedefs/order"
import { OrderView } from "../../components/OrderView"
import { get } from "../../utils/http"
import { getApi } from "../../api"
import { useDispatch } from "react-redux"
import { useParams } from "react-router-dom"


const UserOrder = () => {
  const dispatch = useDispatch()
  const setTitle = useSetRecoilState(userPageTitleState)
  const [order, setOrder] = useState<IDetailedOrder | undefined>(undefined)
  const [retries, setRetries] = useState(0)
  const [requestError, setRequestError] = useState<string | undefined>(undefined)
  const {orderNumber} = useParams()
  const ignore_errors: number[] = [403, 404]

  // eslint-disable-next-line
  useEffect(() => setTitle("Order #" + orderNumber), [])

  const fetchOrder = useCallback(async () => {
    const res = await get({ url: getApi('orderDetails', orderNumber), data: null, dispatch, ignore_errors})
    if (res.ok) {
      const data: IDetailedOrder = await res.json()
      setOrder(data)
      setRequestError(undefined)
      return
    }
    if (res.status === 403) {
      setRequestError("An unexpected error occurred.")
    } else if (res.status === 404) {
      setRequestError(`Sorry! Order #${orderNumber} does not exist, or might have been deleted.`)
    } else { // All other unexpected errors
      //TODO Log unexpected error
      setRequestError("Sorry! An unexpected error occurred. We are working to fix this issue.")
    }
  // eslint-disable-next-line
  }, [])

  useEffect(() => {
    fetchOrder()
  // eslint-disable-next-line
  }, [retries])

  const retryFetch = () => {
    // retry refetch order
    setRequestError(undefined)
    setRetries(retries+1)
  }

  return (
    <div>
      <OrderView
        order={order}
        requestError={requestError}
        retryFetch={retryFetch}
      />
    </div>
  )
}


export default UserOrder