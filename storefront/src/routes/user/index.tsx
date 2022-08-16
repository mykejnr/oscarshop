import { Link, Navigate, Outlet, useLocation, useMatch } from "react-router-dom"
import { FaAddressBook, FaShoppingCart, FaUserEdit, FaUserCircle} from 'react-icons/fa';
import {  AiFillDashboard, AiOutlineFundView } from 'react-icons/ai';
import { SideLinkProps } from "../../typedefs/useraccout";
import { atom, useRecoilValue } from "recoil";
import { useSelector } from "react-redux";
import { ModelessLoading } from "../../utils/components";


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
  const user = useSelector((state: IRootState) => state.user)
  return (
    <div className="pb-5">
      <div className="flex items-center gap-3 py-4 px-5 mb-5 text-ellipsis overflow-hidden whitespace-nowrap border-b font-semibold">
        <span><FaUserCircle size={25}/></span><span>{user.profile?.first_name}</span>
      </div>
      <div className="px-5">
        <SideLink to="" text="Dashboard" Icon={AiFillDashboard} />
        <SideLink to="orders" text="Orders" Icon={FaShoppingCart} match="/account/orders/*" />
        <SideLink to="address" text="Address Book" Icon={FaAddressBook} />
        <SideLink to="profile" text="Edit Profile" Icon={FaUserEdit} />
      </div>
    </div>
  )
}


const User = () => {
  const pageTitle = useRecoilValue(userPageTitleState)
  const user = useSelector((state: IRootState) => state.user)
  const location = useLocation()

  // When the site first loads (or on page refresh), 
  // components.header.MiniButton attempts to fetch the current
  // session user. But before that, the state user.status is set to
  // To NEW, to indicated that, we haven't attempted fetcing the user
  // so we can't possibly conclude that they are not logged in.
  if (user.status === 'NEW' || user.status === 'REQUESTING') {
    return (
      <div className="fixed inset-0 z-50">
        <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2">
          <ModelessLoading text="Signing in . . .  " />
        </div>
      </div>
    )
  }

  // At this stage user.status is set to 'REQUESTED'. so if user.auth is still
  // false, the requested for the current session user failed. (AKA. they are 
  // not loggged in)
  if (!user.auth) {
    return <Navigate to={'/login'} state={{from: location}} replace/>
  }

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