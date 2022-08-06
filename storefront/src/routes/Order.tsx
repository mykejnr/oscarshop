import { useEffect, useState } from "react"
import { useDispatch } from "react-redux"
import { useParams } from "react-router-dom"
import { IAnonOrderCredentials, IAnonymousOrder } from "../typedefs/order"
import { submitForm } from "../utils/requests"
import { OrderView } from "../components/OrderView"


const Order = () => {
  let {uuid, token} = useParams()
  const dispatch = useDispatch()
  const [order, setOrder] = useState<IAnonymousOrder | undefined>(undefined)
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
      <OrderView
        order={order}
        requestError={requestError}
        retryFetch={retryFetch}
      />
    </div>
  )
}


export default Order