import { useDispatch, useSelector } from "react-redux"
import { NavLink } from 'react-router-dom';
import { FaSearch, FaUser, FaShoppingBag } from 'react-icons/fa';
import { IconType } from "react-icons";
import { getUser, toggleMiniCart, toggleMiniUser } from "../actions";
import { MiniProfile } from "./user";
import { useEffect } from "react";


const ProductType = ({product_type}: {product_type: IProductType}) => (
    <li>
        <NavLink className="p-5 inline-block" to={'/catalogue/bags'}>
            {product_type.name}
        </NavLink>
    </li>
)


const ProductTypesNav = () => {
  const product_types = useSelector((state: IRootState) => state.global.product_types);

  return (
      <nav className="">
          <ul className="list-none flex">
              {product_types.map(pt => <ProductType key={pt.id} product_type={pt} />)}
          </ul>
      </nav>

    )
};


type MiniButonProps = {
  Icon: IconType,
  onClick?: () => void,
  testid?: string,
  title?: string
}

const MiniButton = ({Icon, onClick, testid, title}: MiniButonProps) => (
  <button title={title} data-testid={testid} className="px-5 inline-block" onClick={onClick}>
    <Icon color="#888"/>
  </button>
)


export const MiniButtons = () => {
  const dispatch = useDispatch()
  const uiState = useSelector((state:IRootState) => state.ui)

  useEffect(() => {
    dispatch(getUser())
  // eslint-disable-next-line
  }, [])

  return (
    <>
      <div className="actions flex justify-between items-center">
        <MiniButton title="Search" Icon={FaSearch} />
        <MiniButton title="Account" testid="show-user" Icon={FaUser} onClick={() => dispatch(toggleMiniUser())} />
        <MiniButton title="Cart" Icon={FaShoppingBag} onClick={() => dispatch(toggleMiniCart())} />
      </div>
      {
        uiState.miniUserVisible &&
        <div className="fixed top-5 right-5"><MiniProfile /></div>
      }
    </>
  )
}


const Header = () => {
  return(
    <header className="header shadow z-50">
      <div className="border-box px-10 flex justify-between max-w-7xl mx-auto">
        <div className="logo my-auto text-sky-500 font-bold text-lg">JonaShop</div>
        <ProductTypesNav />
        <MiniButtons />
      </div>
    </header>
  )
}


export default Header