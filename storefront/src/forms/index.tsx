import Form, { TFormFields } from './base'
import { requestLogin, requestPasswordReset, requestSignup } from '../utils/user'
import { useDispatch } from 'react-redux'
import { fetchBasket, newMessage, showDialog, showPopup } from '../actions'


const afterSubmitOk = (message: string, dispatch: (f: any) => any ) => () => {
  dispatch(showDialog('nodialog'))
  dispatch(newMessage(message))
  dispatch(fetchBasket()) // refresh basket
}


const ForgotPassowrdButton = () => {
  const dispatch = useDispatch()

  return (
    <div className='py-4'>
      <button
        type='button'
        className='block ml-auto text-accent-600 text-sm hover:text-accent-400'
        onClick={() => dispatch(showDialog('forgot_password'))}
        >
        forgot password? Reset it.
      </button>
    </div>
  )
}


export const LoginForm = () => {
  const dispatch = useDispatch()
  const formFields: TFormFields<ILoginFormData> = {
    email: {type: 'email', required: true},
    password: {type: 'password', required: true}
  }

  const msg = "Login Successfull. You are now logged in."

  // key=3.... number of fields + 1
  const getFields = () => ([
    <ForgotPassowrdButton key={2}/>
  ])

  return (
    <Form<ILoginFormData>
      fields={formFields}
      asyncSubmit={requestLogin}
      afterSubmitOk={afterSubmitOk(msg, dispatch)}
      getFields={getFields}
    />
  )
}


export const SignupForm = () => {
  const dispatch = useDispatch()
  const required = true
  const fields: TFormFields<ISignupData> = {
    first_name: {type: 'text', required},
    last_name: {type: 'text', required},
    email: {type: 'email', required},
    password: {type: 'password', required},
    confirm_password: {type: 'password', required}
  }
  const msg = "Signup Complete. You are now logged in."

  return (
    <Form<ISignupData>
      fields={fields}
      asyncSubmit={requestSignup}
      afterSubmitOk={afterSubmitOk(msg, dispatch)}
    />
  )
}


export const ForgotPasswordForm = () => {
  const dispatch = useDispatch()

  const fields: TFormFields<ILoginFormData> = {
    email: {type: 'email', required: true}
  }

  const afterSubmit = (responseData: Record<string, string> | void) => {
    dispatch(showDialog('nodialog'))
    responseData &&
    dispatch(showPopup(responseData.message))
  }

  // key=2.... number of fields + 1
  const getFields = () => ([
    <div key={2} className='w-full box-border text-accent-700'>
      Enter the email address associated with your account.
    </div>
  ])

  return (
    <Form<IForgotPasswordData>
      fields={fields}
      asyncSubmit={requestPasswordReset}
      afterSubmitOk={afterSubmit}
      getFields={getFields}
    />
  )
}