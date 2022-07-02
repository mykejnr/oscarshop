import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"
import { fetchBasket, toggleMiniCart } from "../actions";
import { BsPlus, BsDash, BsArrowRight, BsTrash } from 'react-icons/bs';
import { Button } from "./button";
import { useNavigate } from "react-router-dom";

import type { IconType } from "react-icons";
import type { IBasketLine } from "../typedefs/basket";

const CartHeader = () => {
  const dispatch = useDispatch();
  return (
    <div className=" relative flex justify-between items-center h-14 px-5 border-box text-black bg-white shadow-lg z-20">
      <button>
        <BsTrash />
      </button>
      <div className="font-semibold">My Basket</div>
      <button
        data-testid="toogle-mini-cart"
        onClick={() => dispatch(toggleMiniCart())}
      >
        <BsArrowRight />
      </button>
    </div>
  )
}

const CartFooter = ({cart_total}: {cart_total: number}) => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const ltshadow = "shadow-[0px_35px_60px_15px_rgba(0,0,0,0.3)]"
  const footerStyles = `
        absolute bg-white bottom-3 inset-x-5
        flex justify-between items-center
        border-box px-5 h-14 rounded-2xl ${ltshadow}`

  const gotoCheckout = () => {
    navigate('/checkout')
    dispatch(toggleMiniCart()) // close this mini cart
  }

  return (
    <div className={footerStyles}>
      <div className="grow">
        <span className="text-xs align-baseline">GH&#8373;</span>
        <span className="font-semibold align-top text-lg">{cart_total}</span>
      </div>
      <Button text="Checkout" onClick={gotoCheckout}/>
    </div>
  )
}


const QuantityButton = ({Icon}: {Icon: IconType}) => (
  <div className="rounded bg-gray-200 border-box p-0.5">
    <button 
      className="block bg-white rounded p-0.5 hover:text-accent-500"
    >
      <Icon className="text-sm" />
    </button>
  </div>
)


const CartItem = ({line}: {line: IBasketLine}) => (
    <div
      data-testid="mini-cart-item"
      className="w-full flex gap-4 space-between rounded-md mt-3 bg-white border-box p-5"
    >
        <div className="w-20">
          <img
            src={line.product.image} alt="Basket line item"
            className="w-full rounded-md"
          />
        </div>
        <div className="grow flex flex-col space-between">
            <div className="leading-tight text-sm grow">{line.product.title}</div>
            <div className="text-accent-500 pb-2">
              <span className="text-xs align-baseline">GH&#8373;</span>
              <span className="font-semibold align-top text-lg">
                {line.product.price}
              </span>
            </div>
        </div>
        <div className="flex flex-col gap-1">
            <QuantityButton Icon={BsDash} />
            <div className="text-sm text-center">{line.quantity}</div>
            <QuantityButton Icon={BsPlus} />
        </div>
    </div>
)


const CartItemList = ({lines}: {lines: IBasketLine[]}) => (
    <div
      className="absolute inset-x-0 inset-y-14 bg-none border-box px-3 rounded-tl-xl"
    >
      <div className="h-full overflow-y-auto">
        {lines.map(line => <CartItem key={line.id} line={line} />)}
      </div>
    </div>
)


const MiniCart = () => {
    const dispatch = useDispatch();
    const cart = useSelector((state: IRootState) => state.cart)
    const ui = useSelector((state: IRootState) => state.ui)

    let conStyles = ui.miniCartVisible ? "right-0 shadow-2xl" : "-right-96 shadow-none"
    const styles = `fixed bg-gray-100 inset-y-0 ${conStyles} bg-white
                    w-96 rounded-l-lg
                    transition-[right] duration-500 ease-out`

    useEffect(() => {
        dispatch(fetchBasket())
    // eslint-disable-next-line
    }, [])

    return (
        <div className={styles}>
            <CartHeader />
            <CartItemList lines={cart.lines} />
            <CartFooter cart_total={cart.total_price} />
        </div>
    )
}

export default MiniCart