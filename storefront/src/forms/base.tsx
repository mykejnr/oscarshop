import { HTMLInputTypeAttribute, useState } from "react";
import { Action, Dispatch } from 'redux';
import { SubmitHandler, useForm, UseFormReturn , UnpackNestedValue, DeepPartial} from "react-hook-form";
import { useDispatch } from "react-redux";
import { nameToLabel } from "../utils";
import { Spinner } from "../utils/components";
import { TFieldName } from "./base copy";
import { TSubmitFormErrors } from "../typedefs/form";
import { extractFieldErros } from "./utils";


// See type definitions at the bottom of the page
// ================================================================================


/**
 * Build a string that will be used as a value for id attribute
 * for an <input> filed
 * @param value 
 * @returns returns the value preapended with 'fip' (form input)
 */
const getid = (value: string) => `fip_${value}`


const Options = ({options}: {options: TSelectOptions}) => {
  return (
    <>
    {
      Object.keys(options).map((value, index) => (
        <option key={index} value={value}>{options[value]}</option>
      ))
    }
    </>
  )
}


const RawInput = <TFormData, >(props: TInputProps<TFormData>) => {
  const {
    register,
    name,
    disabled,
    placeholder,
    required,
    cols, rows,
    options
  } = props;
  const type: TInputType = props.type || 'text'
  const disAstyles = disabled ? 'bg-gray-100 text-gray-300' : ''
  const ph = placeholder ? placeholder : nameToLabel(props.name)

  const attrs = {
      className: `block w-full max-w-full px-4 rounded outline-none ${disAstyles}`,
      placeholder: ph, type, disabled, id: getid(name), ...register(name, {required})
  }

  if (type === 'textarea') {
    const t_attrs = {...attrs, rows, cols}
    t_attrs.className = t_attrs.className + ''
    return (
      <textarea {...t_attrs}>{props.content}</textarea>
    )
  }

  attrs.className = attrs.className + ' h-10'

  if (type === 'select') {
    return (
      <select {...attrs}>
        {options && <Options options={options} /> }
      </select>
    )
  }

  return (
    <input {...attrs}/>
  )
}


/**
 * Render form errors of a given field
 * @param props of type TInputProps 
 * @returns JSX.Element
 */
const FieldError = ({fieldErrors}: {fieldErrors?: string[]}) => {
  return (
    <div className="text-xs text-red-500 pb-2 min-h-[20px] leading-[1] mb-4">
      {fieldErrors && 
        fieldErrors.map((err_msg, i) => (
        <div data-testid="field-error" className="bg-red-100" key={i}>{err_msg}</div>
        ))
      }
    </div>
  )
}


/**
 * A Generic Components that renderes a form input of a given type.
 * The state of the inputs is manage by "react-hook-forms" library
 * @param props The folowing properties are espected
 *  name, type, placeholder, required. In addition to these all properties
 * returned fron 'useForm' of 'react-hook-forms' are also reqired.
 *    const useFormData = useForm()
 *    <Input {...userFormData} />
 * @returns 
 */
export const Input = <TFormData, >(props: TInputProps<TFormData>) => {
  return (
    <div className="w-full box-border">
      <RawInput {...props} />
      <FieldError {...props} />
    </div>
  )
}


export const Field = <TFormData, > (props: TFieldInputProps<TFormData>) => {
  const { label, fieldErrors } = props
  const displayLabel = label ? label : nameToLabel(props.name)

  return (
    <>
    <div className="border border-gray-200 rounded relative">
      <label htmlFor={getid(props.name)} className="absolute -top-3 left-3 bg-white font-semibold text-sm px-1 text-gray-400">{displayLabel}</label>
      <RawInput {...props} placeholder={' '} />
    </div>
    <FieldError fieldErrors={fieldErrors} />
    </>
  )
}


export const RadioField = <TFormData, >(props: TRadioInputProps<TFormData>) => {
  const { register, name, required, options, fieldErrors } = props;

  const attrs = {
      type: 'radio',  ...register(name, {required})
  }

  return (
    <>
      <FieldError fieldErrors={fieldErrors} />
      {
        options.map((option, index) => (
          <label
            htmlFor={getid(option.value)} key={index}
            className="flex justify-start items-start gap-5 mb-5"
          >
            <input className="block mt-2"  {...attrs}  id={getid(option.value)} value={option.value}/>
            {option.icon &&
              <div className="w-[80px]">
                <img className="w-full" src={`images/${option.icon}`} alt={option.label} />
              </div>
            }
            <span>
              <span className='block font-semibold'>{nameToLabel(option.label)}</span>
              <span className='block border-b border-gray-300 pb-5'>{option.description}</span>
            </span>
          </label>
        ))
      }
    </>
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
  const [serverErrors, setServerErrors] = useState<TSubmitFormErrors<TFormData> | undefined>(undefined)
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
    // err = (serverErrors && serverErrors[f]) || errors[f]?.message
    err = (serverErrors && extractFieldErros(serverErrors, f)) || errors[f]?.message

    return {
      name: f,
      fieldErrors: typeof err === "string" ? [err] : err,
      type: fields[f].type,
      required: fields[f].required,
      placeholder: fields[f].placeholder,
      disabled: fields[f].disabled,
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

// TYPES .............................................................................................
export type TFormDataBase = { [key: string]: string }

export type TInputType = HTMLInputTypeAttribute | "textarea";

export type TSelectOptions = {
  [value: string]: string
}

export type TRadioOption = {
  value: string,
  label: string,
  description: string,
  icon?: string,
  [extraValue: string]: any,
}

export type TFormFieldProps = {
  type?: TInputType,
  placeholder?: string,
  required?: boolean,
  disabled?: boolean,
}

type TBaseInputProps<TFormData> = {
  name: TFieldName<TFormData>,
  fieldErrors?: string[],
} & TFormFieldProps & UseFormReturn<TFormData>

export type TRadioInputProps<TFormData> = {
    options: TRadioOption[],
} & TBaseInputProps<TFormData>

export type TInputProps<TFormData> = {
    // for textarea
    cols?: number,
    rows?: number,
    content?: string,
    // for <select> fields
    options?: TSelectOptions,
} & TBaseInputProps<TFormData>

export type TFieldInputProps<TFormData> = {
  label?: string
} & TInputProps<TFormData>

export type TGetInputProps<TFormData> = (field_name: TFieldName<TFormData>) => TInputProps<TFormData>

export type TGetFieldsProps<TFormData> = {
  getInputProps: TGetInputProps<TFormData>
  serverErrors?: TSubmitFormErrors<TFormData>
  useFormReturn: UseFormReturn<TFormData>
}

export type TGetFields<TFormData> = (props: TGetFieldsProps<TFormData>) => JSX.Element[]

export type TAsyncSubmit<TFormData> = (data: UnpackNestedValue<TFormData>, dispatch: Dispatch) => Promise<TAsyncSubmitResponse<TFormData>>

export type TAsyncSubmitResponse<TFormData> = {
  ok: boolean,
  errors?: TSubmitFormErrors<TFormData>,
  response_data?: Record<string, string> | void
}

export type TFormFields<TFormData> = Record<TFieldName<TFormData>, TFormFieldProps>

export type TFormProps<TFormData> = {
  asyncSubmit: TAsyncSubmit<TFormData>,
  fields: TFormFields<TFormData>,
  afterSubmitOk?: (responseData: Record<string, string> | void) => void,
  getFields?: TGetFields<TFormData>,
  defaultValues?: UnpackNestedValue<DeepPartial<TFormData>>
}


export default Form