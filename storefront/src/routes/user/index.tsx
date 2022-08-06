import { Link, Outlet, useMatch } from "react-router-dom"
import { FaAddressBook, FaShoppingCart, FaUser} from 'react-icons/fa';
import {  AiFillDashboard, AiOutlineFundView } from 'react-icons/ai';
import { SideLinkProps } from "../../typedefs/useraccout";
import { atom, useRecoilValue } from "recoil";


export const userPageTitleState = atom({
  key: 'UserPageTitleState',
  default: ''
})


const SideLink = (props: SideLinkProps) => {
  const {to, text, Icon, match} = props

  let exStyles = ''
  if (useMatch(match || "/account/"+to)) {
    exStyles = ' bg-accent-100 text-accent-500 rounded border-l-4 border-accent-500'
  } else {
    exStyles = ' hover:text-black'
  }

  return (
    <Link
      to={to}
      className={"flex w-full gap-4 items-center py-2 mb-2 px-5" + exStyles}
    >
      <span><Icon size={20} /></span>
      <span>{text}</span>
    </Link>
  )
}


const SideBar = () => {
  return (
    <div className="pb-5">
      <div className="py-4 px-5 mb-5 text-ellipsis overflow-hidden whitespace-nowrap border-b font-semibold">
        Michael Kwasi Mensah Yeboah Junior
      </div>
      <div className="px-5">
        <SideLink to="" text="Dashboard" Icon={AiFillDashboard} />
        <SideLink to="orders" text="Orders" Icon={FaShoppingCart} match="/account/orders/*" />
        <SideLink to="address" text="Address Book" Icon={FaAddressBook} />
        <SideLink to="profile" text="Edit Profile" Icon={FaUser} />
      </div>
    </div>
  )
}


const User = () => {
  const pageTitle = useRecoilValue(userPageTitleState)
  return (
    <div className="relative mt-[65px] bg-gray-100">
      <div className="fixed h-screen mt-[65px] left-0 w-[250px] top-0 bottom-0 bg-white">
        <SideBar />
      </div>
      <div className="p-5 ml-[250px] h-screen w-[calc(100% - 250px)] box-border">
        <div className="flex gap-3 items-center pl-5 pb-5 font-bold">
          <AiOutlineFundView size={25} /> <span>{pageTitle}</span>
        </div>
        <Outlet />
      </div>
    </div>
  )
}


export default User