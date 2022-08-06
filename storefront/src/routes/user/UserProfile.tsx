import { useEffect } from "react"
import { useSetRecoilState } from "recoil"
import { userPageTitleState } from "."

const UserProfile = () => {
  const setTitle = useSetRecoilState(userPageTitleState)
  // eslint-disable-next-line
  useEffect(() => setTitle("Profile"), [])

    //TODO design user profile page
  return (
    <div>
      User profile page
    </div>
  )
}


export default UserProfile