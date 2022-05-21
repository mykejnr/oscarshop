import { useState } from "react";
import { useForm, UseFormReturn } from "react-hook-form";
import { useDispatch } from "react-redux";
import { requestSignup } from "../utils/user";
import { nameToLabel } from "../utils";
import { submitStyles } from "./button";
import { newMessage, showDialog } from "../actions";
import { Spinner } from "../utils/components";


type TFieldName = keyof ISignupInit

type InputProps = {
    name: TFieldName,
    type: "text" | "email" | "password",
    placeholder?: string,
    fieldErrors?: string[],
    required?: boolean,
} & UseFormReturn<ISignupInit>


export const Input = (props: InputProps) => {
  const {
    register,
    name,
    type,
    placeholder,
    fieldErrors,
    required,
  } = props;

  const ph = placeholder ? placeholder : nameToLabel(name)

  return (
    <div className="w-72 border-box">
      <input
        className="block h-10 w-full px-4 rounded"
        type={type} {...register(name, {required})} placeholder={ph}
      />
      <div className="text-xs text-red-500 pb-2 min-h-[20px] leading-[1]">
        {fieldErrors && 
          fieldErrors.map((err_msg, i) => (
            <div className="bg-red-100" key={i}>{err_msg}</div>
          ))
        }
      </div>
    </div>
  )
}


const Form = () => {
    const [serverErrors, setServerErrors] = useState<ISignupResponseErrors>({})
    const useFormProps = useForm<ISignupInit>()
    const dispatch = useDispatch()
    const {
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useFormProps


    const onSubmit = async (data: ISignupInit) => {
      const res = await requestSignup(data, dispatch)
      if (res.ok) {
        dispatch(showDialog('nodialog'))
        dispatch(newMessage("Signup Complete. You are now logged in."))
      } else if (res.errors) {
        setServerErrors(res.errors)
      }
    }

    const getField = (f: TFieldName) => {
      let err: string | string[] | undefined
      err = serverErrors[f] || errors[f]?.message
      err = typeof err === "string" ? [err] : err
      return {name: f, fieldErrors: err}
    }

    const styles = "bg-gray-200 p-5 border-box rounded-b"
    let submitS = `${submitStyles} w-36 ml-auto h-10 font-semibold relative`
    let buttonText;
    let disabled: boolean

    if (isSubmitting) {
      buttonText = 'Submitting'
      submitS = `${submitS} text-gray-500 bg-accent-300 hover:bg-accent-300`
      disabled = true
    } else {
      buttonText = 'Submit'
      disabled = false
    }

    return (
        <form className={styles} onSubmit={handleSubmit(onSubmit)} data-testid="signup-form">
            <Input {...getField("first_name")} type="text" {...useFormProps} required/>
            <Input {...getField("last_name")} type="text" {...useFormProps} required/>
            <Input {...getField("email")} type="email" {...useFormProps} required/>
            <Input {...getField("password")} type="password" {...useFormProps} required/>
            <Input {...getField('confirm_password')} type="password" {...useFormProps} required/>
            <div className="mt-6">
              <button data-testid='signup-submit' type="submit" className={submitS} disabled={disabled}>
                {
                  isSubmitting && <span className="absolute left-2 top-[10px]"><Spinner /></span>
                }
                {buttonText}
              </button>
            </div>
        </form>
    )
}


export default Form