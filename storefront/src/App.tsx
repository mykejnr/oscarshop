import { Suspense, lazy } from "react";
import { RecoilRoot } from "recoil";
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import Header from "./components/header";
import Footer from "./components/footer";
import MiniCart from "./components/mini-cart";
import Dialog from "./dialog/dialog";
import { PopupMessage } from "./dialog/popup";
import ResetPassword from "./routes/ResetPassword";
import ActivateEmailPage from "./routes/ActivateEmail";


const Home = lazy(() => import('./routes/Home'));
const Catalog = lazy(() => import('./routes/Catalog'));
const Checkout = lazy(() => import("./routes/Checkout"));
const Order = lazy(() => import("./routes/Order"));
const User = lazy(() => import("./routes/user"))
const Dashboard = lazy(() => import("./routes/user/Dashboard"));
const UserOrderList = lazy(() => import("./routes/user/OrderList"))
const AddressBook = lazy(() => import("./routes/user/AddressBook"))
const UserProfile = lazy(() => import("./routes/user/UserProfile"))
const UserOrder = lazy(() => import("./routes/user/UserOrder"))


const Layout = () => (
  <div className="App">
    <Header />
    <Outlet />
    <Footer />
    <MiniCart />
    <Dialog name="signup" />
    <Dialog name="login" />
    <Dialog name="forgot_password" />
    <Dialog name="change_password" />
    <Dialog name="change_email" />
    <PopupMessage />
  </div>
)

const App = () => (
  //TODO 404 page
  <RecoilRoot>
  <div className="bg-white text-neutral-500">
    <Router>
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="catalogue" element={<Catalog />} />
              <Route path="checkout" element={<Checkout />} />
              <Route path="account" element={<User/>} >
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<UserOrderList />} />
                <Route path="orders/:orderNumber" element={<UserOrder />} />
                <Route path="address" element={<AddressBook />} />
                <Route path="profile" element={<UserProfile />} />
              </Route>
              <Route path="order/:uuid/:token" element={<Order />} />
              <Route path="reset-password/:uuid/:token" element={<ResetPassword/>} />
              <Route path="activate-email/:uuid/:token" element={<ActivateEmailPage />} />
            </Route>
          </Routes>
        </Suspense>
    </Router>
  </div>
  </RecoilRoot>
);

export default App;