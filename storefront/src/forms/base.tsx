import { useState } from "react";
import { Action, Dispatch } from 'redux';
import { SubmitHandler, useForm, UseFormReturn , UnpackNestedValue, Path, DeepPartial} from "react-hook-form";
import { useDispatch } from "react-redux";
import { nameToLabel } from "../utils";
import { Spinner } from "../utils/components";


export type TFormDataBase = { [key: string]: string }

export type TFieldName<TFormData> = Path<TFormData>

export type TInputType = 'text' | "email" | "password";

export type TInputProps<TFormData> = {
    name: TFieldName<TFormData>,
    type: TInputType
    placeholder?: string,
    fieldErrors?: string[],
    required?: boolean,
} & UseFormReturn<TFormData>

export type TGetInputProps<TFormData> = (field_name: TFieldName<TFormData>) => TInputProps<TFormData>

export type TGetFieldsProps<TFormData> = {
  getInputProps: TGetInputProps<TFormData>
  serverErrors: TAsyncSubmitErrors<TFormData>
  useFormReturn: UseFormReturn<TFormData>
}

export type TGetFields<TFormData> = (props: TGetFieldsProps<TFormData>) => JSX.Element[]

export type TAsyncSubmit<TFormData> = (data: UnpackNestedValue<TFormData>, dispatch: Dispatch) => Promise<TAsyncSubmitResponse<TFormData>>

export type TAsyncSubmitErrors<TFormData> = Partial<Record<keyof TFormData, string[]>>

export type TAsyncSubmitResponse<TFormData> = {
  ok: boolean,
  errors?: TAsyncSubmitErrors<TFormData>,
  response_data?: Record<string, string> | void
}

export type TFormFieldProps = {
  type: TInputType,
  placeholder?: string,
  required?: boolean,
}

export type TFormFields<TFormData> = Record<TFieldName<TFormData>, TFormFieldProps>

export type TFormProps<TFormData> = {
  asyncSubmit: TAsyncSubmit<TFormData>,
  fields: TFormFields<TFormData>,
  afterSubmitOk?: (responseData: Record<string, string> | void) => void,
  getFields?: TGetFields<TFormData>,
  defaultValues?: UnpackNestedValue<DeepPartial<TFormData>>
}



/**
 * A Generic Components that renderes a form input of a given type.
 * The state of the inputs is manage by "react-hook-forms" library
 * @param props The folowing properties ere espected
 *  name, type, placeholder, required. In addition to these all properties
 * returned fron 'useForm' of 'react-hook-forms' are also reqired.
 *    const useFormData = useForm()
 *    <Input {...userFormData} />
 * @returns 
 */
export const Input = <TFormData, >(props: TInputProps<TFormData>) => {
  const {
    register,
    name,
    type,
    placeholder,
    fieldErrors,
    required,
  } = props;

  const ph = placeholder ? placeholder : nameToLabel(props.name)

  return (
    <div className="w-full box-border">
      <input
        className="block h-10 w-full px-4 rounded"
        type={type} {...register(name, {required})} placeholder={ph}
      />
      <div className="text-xs text-red-500 pb-2 min-h-[20px] leading-[1]">
        {fieldErrors && 
          fieldErrors.map((err_msg, i) => (
            <div data-testid="field-error" className="bg-red-100" key={i}>{err_msg}</div>
          ))
        }
      </div>
    </div>
  )
}

const ButtonSpinner = () => (
  <>
    <span className="absolute left-2 top-[10px]">
      <Spinner />
    </span>
    Submitting
  </>
)


/**
 * A Generic Components that renders an html form
 * @param props.asyncSubmit an asynchronouse function that receives and sbmit
 * the form data after it has been submitted. The function is expected to
 * return a Promise.resolve(response). response should be in the form
 * {ok: boolean, errors?: {'field_name': ['list of field errors']}}
 * @param props.fields is a object describing the input fields, their types and
 * other properties of the field eg.
 * {
 *    first_name: {type: 'text', required: true, placeholder},
 *    email: [type: 'email', required: false]
 * }
 * see type TFormFiels of this module
 * @param props.afterSubmitOk a callback function that is invocked after
 * the form has submited successfully (That is after the return of props.asyncSubmit)
 * without any errors. This function is called without any argument and expects no
 * return value. You can use this function to alert the user that their form was
 * submitted successfully or do other after sumit operations.
 * @param props.getFields an optional callback that if provided will be called
 * to generate a list of <Input> components or other JSX.Elelemts which will
 * be concatenated with the Inputs created from the information provided
 * in @param props.fields this callback will be called with the following object
 * {
 *  getInputProps: A function(field_name) that generate the properties requried by <Inputs>
 *  serverErrors: {'field_name': ['list of errors from the server']}
 *  userFormReturn: the return value of calling useForm hook of 'react-hook-forms'
 * }
 * 
 * @returns JSX.ELemenent
 */
const Form = <TFormData extends TFormDataBase>(props: TFormProps<TFormData>) => {
  let { asyncSubmit, fields, afterSubmitOk, getFields, defaultValues } = props
  const [serverErrors, setServerErrors] = useState<TAsyncSubmitErrors<TFormData>>({})
  const useFormReturn = useForm<TFormData>({defaultValues})
  const dispatch = useDispatch<Dispatch<Action>>()
  const {
      handleSubmit,
      formState: { errors, isSubmitting },
  } = useFormReturn


  const onSubmit: SubmitHandler<TFormData> = async (data) => {
    const res = await asyncSubmit(data, dispatch)
    if (res.ok) {
      afterSubmitOk && afterSubmitOk(res.response_data)
    } else if (res.errors) {
      setServerErrors(res.errors)
    }
  }

  const getInputProps = (f/*field name*/: TFieldName<TFormData>) => {
    let err: string | string[] | undefined
    err = serverErrors[f] || errors[f]?.message

    return {
      name: f,
      fieldErrors: typeof err === "string" ? [err] : err,
      type: fields[f].type,
      required: fields[f].required,
      placeholder: fields[f].placeholder,
      ...useFormReturn
    }
  }

  const getInputs = (): JSX.Element[] => {
    return Object.keys(fields).map((field_name, i) => (
      <Input<TFormData> key={i} {...getInputProps(field_name as TFieldName<TFormData>)} />
    ))
  }

  let fieldComps = getInputs()
  if (getFields) {
    fieldComps = fieldComps.concat(getFields({getInputProps, serverErrors, useFormReturn})) 
  }

  return (
    <form
      className="bg-gray-200 p-5 box-border rounded-b w-80 block"
      onSubmit={handleSubmit(onSubmit)}
      data-testid="signup-form"
    >
      {fieldComps} {/* List of inputs conponents */}

      <div className="mt-6">
        <button
          disabled={isSubmitting}
          data-testid='genform-submit' type="submit"
          className='button w-36 ml-auto h-10 relative'
        >
          {isSubmitting ? <ButtonSpinner /> : 'Submit'}
        </button>
      </div>
    </form>
  )
}


export default Form