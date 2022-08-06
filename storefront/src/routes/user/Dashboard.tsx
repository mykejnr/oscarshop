import { useEffect } from "react"
import { useSetRecoilState } from "recoil"
import { userPageTitleState } from "."

const Dashboard = () => {
  const setTitle = useSetRecoilState(userPageTitleState)
  // eslint-disable-next-line
  useEffect(() => setTitle("Dashboard"), [])
    //TODO design user dashboard, before homepage

  return (
    <div>
      User dashboard
    </div>
  )
}


export default Dashboard