import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom"
import { Dispatch } from "redux";
import { LoginForm } from "../forms"



const LoginPage = () => {
  const navigate = useNavigate()
  const location = useLocation();

  const navigatePathname = useMemo(() => {
    const state = location.state as {from: Location}
    return (state && state.from?.pathname) || "/"
  }, [location])

  const afterSubmitOk = (message: string, dispatch: Dispatch ) => () => {
    navigate(navigatePathname, {replace: false})
  }

  return (
    <div className="flex justify-center py-20">
      <div>
        <div className="bg-accent-400 text-center p-5 text-white font-semibold">
          Login
        </div>
        <LoginForm afterSubmitOk={afterSubmitOk} />
      </div>
    </div>
  )
}


export default LoginPage