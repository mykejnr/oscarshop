import { useForm, UseFormReturn } from "react-hook-form";
import { submitStyles } from "./button";

type TFormValues = {
    first_name: string,
    last_name: string,
    email: string,
    password: string,
    confirm_password: string
}

type InputProps = {
    name: keyof TFormValues,
    type: "text" | "email" | "password",
    placeholder?: string,
} & UseFormReturn<TFormValues>


/**
 * Convert a name (valid variable) to a more approriate version that
 * can be use as label names for inputs
 * @param inputName a name of the input (which may contain understores)
 * @returns 
 */
const nameToLabel = (inputName: string): string => {
  const capitalized = inputName.charAt(0).toUpperCase() + inputName.slice(1);
  return capitalized.replace('_', " ")
}


export const Input = (props: InputProps) => {
  const {
    register,
    name,
    type,
    placeholder
  } = props;

  const ph = placeholder ? placeholder : nameToLabel(name)

  return (
    <input
      className="block h-10 mb-4 w-64 px-4 rounded"
      type={type} {...register(name)} placeholder={ph}
    />
  )
}


const Form = () => {
    const useFormProps = useForm<TFormValues>()
    const {
        handleSubmit,
        formState: { errors }
    } = useFormProps

    const onSubmit = (data: TFormValues) => console.log(data)

    const styles = "bg-gray-200 p-5 border-box rounded-b"
    const submitS = `${submitStyles} w-36 ml-auto h-10 font-semibold`

    return (
        <form className={styles} onSubmit={handleSubmit(onSubmit)} data-testid="signup-form">
            <Input name="first_name" type="text" {...useFormProps}/>
            <Input name="last_name" type="text" {...useFormProps} />
            <Input name="email" type="email" {...useFormProps} />
            <Input name="password" type="password" {...useFormProps} />
            <Input name="confirm_password" type="password" {...useFormProps} />
            <div className="mt-8">
              <input type='submit' className={submitS} />
            </div>
        </form>
    )
}


export default Form