import { useDispatch, useSelector } from "react-redux"
import { MdEmail } from 'react-icons/md';
import { FaUser, FaShoppingBag, FaKey, FaSignOutAlt } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { buttonStyles } from "./button";
import { formatPrice } from "../utils";
import { showDialog, toggleMiniUser } from "../actions";
import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";


type ActionButtonProps = {
  text: string,
  Icon: IconType,
  onClick: () => void,
}

const ActionButton = ({text, Icon, onClick}: ActionButtonProps) => (
  <button
    className="flex gap-4 items-center mb-4 hover:text-accent-400"
    onClick={onClick}
  >
    <Icon size="18" />
    <span>{text}</span>
  </button>
)

const Cart = () => {
  const navigate = useNavigate()
  const cart = useSelector((state: IRootState) => state.cart)
  const dispatch = useDispatch()

  const navChekout = () => {
    navigate('/checkout')
    dispatch(toggleMiniUser())
  }

  return (
    <div className="border-b border-gray-200 p-4 flex gap-4">
      <div><FaShoppingBag size="18" /></div>
      <div className="grow">
        <div className="flex justify-between items-center">
          <span>{cart.total_quantity} Items</span>
          <span className="font-semibold">{formatPrice(cart.total_price)}</span>
        </div>
        <div className="flex justify-end mt-2">
          <button className={buttonStyles} onClick={navChekout}>
            checkout
          </button>
        </div>
      </div>
    </div>
  )
}


const SignedInUser = () => {
  const dispatch = useDispatch()

  return (
    <>
      <Cart />
      <div className="p-5">
        <ActionButton text="Edit profile" Icon={FaUser} onClick={() => {}} />
        <ActionButton text="Change email address" Icon={MdEmail} onClick={() => dispatch(showDialog('change_email'))} />
        <ActionButton text="Change password" Icon={FaKey} onClick={() => dispatch(showDialog('change_password'))} />
      </div>
      <div className="bg-gray-50 p-4 ">
          <button className="flex justify-end gap-1 font-semibold hover:text-accent-400 items-center ml-auto">
            <FaSignOutAlt size="18" />
            <span className="">Logout</span>
          </button>
      </div>
    </>
  )
}


const SignedOutUser = () => {
  const bStyles = `${buttonStyles} mx-auto w-28 h-8`
  const dispatch = useDispatch()

  return (
    <div className="py-7 border-box px-5">
      <div className="mx-auto">
        <FaUser size="80" className="mx-auto"/>
      </div>
      <div className="text-center my-7">
        Sign in to preserve your cart for as long as it takes
      </div>
      <button
        className={bStyles}
        onClick={() => dispatch(showDialog('login'))}
      >
        Sign in
      </button>
      <div className="italic text-center text-sm pt-2">
        Don't have an account? 
        <button
          className="text-accent-500 hover:text-accent-400 pl-2"
           onClick={() => dispatch(showDialog('signup'))}
        >Sign up</button>
      </div>
    </div>
  )
}


export const MiniProfile = () => {
  let AuthUser;
  let caption;
  const dispatch = useDispatch()
  const selfRef = useRef<HTMLDivElement>(null)
  const authUser = useSelector((state: IRootState) => state.user)

  useEffect(() => {
    selfRef.current?.focus()
  // eslint-disable-next-line
  }, [])

  const onFocusOut = (e: React.FocusEvent) => {
    // ignore event if it was triggerd by an element inside
    // on this current element
    if (e.currentTarget.contains(e.relatedTarget)) return
    dispatch(toggleMiniUser())
  }

  if (authUser.auth) {
    AuthUser = SignedInUser
    const uName = `${authUser.profile?.first_name} ${authUser.profile?.last_name}`.trim()
    caption = [uName, authUser.profile?.email]
  } else {
    AuthUser = SignedOutUser
    caption = ["Oops!", "You are not signed in"]
  }

  return (
    <div
      ref={selfRef}
      tabIndex={1}
      onBlur={(e) => onFocusOut(e)}
      className="bg-white shadow-md rounded-md text-sm w-[280px] z-50"
    >
      <div className="w-full text-white bg-accent-500 p-4 rounded-t-md text-center">
        <div data-testid='username' className="text-base font-bold">{caption[0]}</div>
        <div data-testid='user-email'>{caption[1]}</div>
      </div>
      <AuthUser />
    </div>
  )
}