import { useEffect, useState } from "react"
import { useSetRecoilState } from "recoil"
import { userPageTitleState } from "."
import { IDetailedOrder } from "../../typedefs/order"
import { OrderView } from "../../components/OrderView"


const UserOrder = () => {
  const setTitle = useSetRecoilState(userPageTitleState)
  const [order, setOrder] = useState<IDetailedOrder | undefined>(undefined)
  // eslint-disable-next-line
  useEffect(() => setTitle("Order #000000"), [])
  const retryFetch = () => {
    // retry refetch order
  }
  return (
    <div>
      <OrderView
        order={order}
        retryFetch={retryFetch}
      />
    </div>
  )
}


export default UserOrder