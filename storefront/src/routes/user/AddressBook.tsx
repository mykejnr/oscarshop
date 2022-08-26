import { useEffect } from "react"
import { atom, useRecoilValue, useSetRecoilState } from "recoil"
import { userPageTitleState } from "."
import Table from "../../tables"
import { IUserAddress } from "../../typedefs/address"
import { TTableConfig } from "../../typedefs/tables"


const addressListState = atom<IUserAddress[] | undefined>({
  key: 'UserAddressListState',
  default: undefined
})


const AddressList = () => {
  const addressList = useRecoilValue(addressListState) || []

  const config: TTableConfig<IUserAddress> = {
    headers: ['Name', 'Address', 'Phone'],
    rows: addressList || [],
    getRow: (address) => ({
      cells: [
        address.first_name,
        address.line4,
        address.phone_number
      ],
      link: address.id
    })
  }

  return (
    <Table<IUserAddress> {...config} />
  )
}

const AddressBook = () => {
  const setTitle = useSetRecoilState(userPageTitleState)
  // eslint-disable-next-line
  useEffect(() => setTitle("Address Book"), [])

    //TODO design address book
  return (
    <div>
      <AddressList />
    </div>
  )
}


export default AddressBook