import { useDispatch, useSelector } from "react-redux"
import { CSSTransition } from 'react-transition-group';
import { Link, NavLink } from 'react-router-dom';
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
  title?: string,
}

const MiniButton = ({Icon, onClick, testid, title}: MiniButonProps) => (
  <button title={title} data-testid={testid} className="px-5 inline-block" onClick={onClick}>
    <Icon color="#888"/>
  </button>
)


export const MiniButtons = () => {
  const dispatch = useDispatch()
  const uiState = useSelector((state:IRootState) => state.ui)
  const userState = useSelector((state:IRootState) => state.user)

  useEffect(() => {
    dispatch(getUser())
  // eslint-disable-next-line
  }, [])

  return (
    <>
      <div className="actions flex justify-between items-center">
        <MiniButton title="Search" Icon={FaSearch} />
        <div className="relative">
          <MiniButton title="Account" testid="show-user" Icon={FaUser} onClick={() => dispatch(toggleMiniUser())} />
          {
            userState.auth &&
            <div className="w-[6px] h-[6px] bg-green-500 absolute bottom-[5px] right-[30%] rounded-full"></div>
          }
        </div>
        <MiniButton title="Cart" Icon={FaShoppingBag} onClick={() => dispatch(toggleMiniCart())} />
      </div>
      <CSSTransition in={uiState.miniUserVisible} timeout={200} classNames="appear" unmountOnExit>
        <div className="fixed top-5 right-5"><MiniProfile /></div>
      </CSSTransition>
    </>
  )
}


const Header = () => {
  return(
    <header className="header shadow z-50">
      <div className="border-box px-10 flex justify-between max-w-7xl mx-auto">
        <div className="logo my-auto text-sky-500 font-bold text-lg">
          <Link to='/'>JonaShop</Link>
        </div>
        <ProductTypesNav />
        <MiniButtons />
      </div>
    </header>
  )
}


export default Header