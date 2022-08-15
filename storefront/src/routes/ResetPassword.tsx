import { useDispatch } from "react-redux"
import { useParams, useNavigate} from "react-router-dom"
import { showPopup } from "../actions"
import Form, {TFormFields} from "../forms/base"
import { confirmPasswordReset } from "../utils/user"


const ResetPassword = () => {
  const dispatch = useDispatch()
  const {uuid, token} = useParams()
  const navigate = useNavigate()
  const disabled = true

  const formFields: TFormFields<IResetPasswordData> = {
    uuid: {type: 'text', required: true, disabled},
    token: {type: 'text', required: true, disabled},
    password: {type: 'text', required: true, placeholder: "Enter new password"}
  }
  const defaultValues = {uuid, token}

  const afterSubmitOk = () => {
    const msg = "Password reset successful. You can now login."
    navigate('/')
    dispatch(showPopup({message: msg}))
  }

  return (
    <div className="flex justify-center py-20">
      <div>
        <div className="bg-accent-400 text-center p-5 text-white font-semibold">
          Reset Your Password
        </div>
        <Form<IResetPasswordData>
          fields={formFields}
          asyncSubmit={confirmPasswordReset}
          afterSubmitOk={afterSubmitOk}
          defaultValues={defaultValues}
        />
      </div>
    </div>
  )
}

export default ResetPassword 

