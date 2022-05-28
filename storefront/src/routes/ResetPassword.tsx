import { useParams } from "react-router-dom"
import Form, {TFormFields} from "../forms/base"
import { resetPassword } from "../utils/user"


const ResetPassword = () => {
  // const dispatch = useDispatch()
  const {uuid, token} = useParams()
  const formFields: TFormFields<IResetPasswordData> = {
    uuid: {type: 'text', required: true},
    token: {type: 'text', required: true},
    password: {type: 'text', required: true, placeholder: "Enter new password"}
  }
  const defaultValues = {
    uuid,
    token,
  }

  // key=3.... number of fields + 1
  const getFields = () => ([
    // <ForgotPassowrdButton key={2}/>
  ])

  return (
    <div className="flex justify-center py-20">
      <div>
        <div className="bg-accent-400 text-center p-5 text-white font-semibold">
          Reset Your Password
        </div>
        <Form<IResetPasswordData>
          fields={formFields}
          asyncSubmit={resetPassword}
          // afterSubmitOk={afterSubmitOk(msg, dispatch)}
          getFields={getFields}
          defaultValues={defaultValues}
        />
      </div>
    </div>
  )
}

export default ResetPassword 

