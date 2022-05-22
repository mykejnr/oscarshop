import Form, { TFormFields } from './base'
import { requestLogin, requestSignup } from '../utils/user'
import { useDispatch } from 'react-redux'
import { newMessage, showDialog } from '../actions'


export const LoginForm = () => {
  const dispatch = useDispatch()
  const formFields: TFormFields<ILoginFormData> = {
    email: {type: 'email', required: true},
    password: {type: 'text', required: true}
  }

  const afterSubmitOk = () => {
    dispatch(showDialog('nodialog'))
    dispatch(newMessage("Login Successfull. You are now logged in."))

  }

  return (
    <Form<ILoginFormData>
      fields={formFields}
      asyncSubmit={requestLogin}
      afterSubmitOk={afterSubmitOk}
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

  const afterSubmitOk = () => {
    dispatch(showDialog('nodialog'))
    dispatch(newMessage("Signup Complete. You are now logged in."))

  }

  return (
    <Form<ISignupData>
      fields={fields}
      asyncSubmit={requestSignup}
      afterSubmitOk={afterSubmitOk}
    />
  )
}