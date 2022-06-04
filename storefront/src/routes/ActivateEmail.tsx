import { useEffect, useRef } from "react"
import { useDispatch } from "react-redux"
import { useParams, useNavigate} from "react-router-dom"
import { showPopup } from "../actions"
import Form, {TFormFields} from "../forms/base"
import { requestActivateEmail } from "../utils/user"


// This should have gone inside useEffect of ActivateEmailPage.
// But react-router somehow complains that we should call 'navigate'
// inside useEffect. This happens when we mock useEffect in our
// tests. And we realy needed to mock useEffect in other to prevent the
// form from submitting authomatically after render.
// By pulling the formElem.submit() into this function we can mock
// this function, instead of 'useEffect'
export const submitForm = (formElem: HTMLFormElement | undefined) => {
  const btnElem = formElem?.getElementsByTagName('button')[0]
  // submit form 1/2 seconds after page load
  // ... This is IMPORTANT... some redux ui state seems to be messed
  // up if we submit form too quickly
  setTimeout(() => {
    btnElem?.click()
  }, 500);
}


const ActivateEmailPage = () => {
  const dispatch = useDispatch()
  const {uuid, token} = useParams()
  const navigate = useNavigate()
  const disabled = true
  const selfRef = useRef<HTMLDivElement>(null)

  const formFields: TFormFields<IActivateEmailData> = {
    uuid: {type: 'text', required: true, disabled},
    token: {type: 'text', required: true, disabled},
  }
  const defaultValues = {uuid, token}

  // since all fields (uuid, token) are populated authomatically
  // automatically subit form
  useEffect(() => {
    const formElem = selfRef.current?.getElementsByTagName('form')[0]
    submitForm(formElem)
  // eslint-disable-next-line
  }, [])

  const afterSubmitOk = (responseData: TOkResponse | void) => {
    navigate('/')
    responseData &&
    dispatch(showPopup({
      title: 'Email change successful',
      message: responseData.message
    }))
  }

  return (
    <>
    <div className="flex justify-center py-20"
      ref={selfRef}
    >
      <div>
        <div className="bg-accent-400 text-center p-5 text-white font-semibold">
          Email Address Confimation
        </div>
        <Form<IActivateEmailData>
          fields={formFields}
          asyncSubmit={requestActivateEmail}
          afterSubmitOk={afterSubmitOk}
          defaultValues={defaultValues}
        />
      </div>
    </div>
    </>
  )
}

export default ActivateEmailPage

