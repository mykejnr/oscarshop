import { useEffect } from "react"
import { useSetRecoilState } from "recoil"
import { userPageTitleState } from "."

const AddressBook = () => {
  const setTitle = useSetRecoilState(userPageTitleState)
  // eslint-disable-next-line
  useEffect(() => setTitle("Address Book"), [])

    //TODO design address book
  return (
    <div>
      Your Address Book
    </div>
  )
}


export default AddressBook