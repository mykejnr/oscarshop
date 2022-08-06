import { CgSpinner } from 'react-icons/cg'
import { BiError } from 'react-icons/bi'
import { IconBaseProps } from 'react-icons'
import { ButtonSpinnerProps, FailedProps } from '../typedefs/utils'

export const Spinner = (props: IconBaseProps) => (
  <CgSpinner {...props} size='20' className="icon-spin" />
)


export const ButtonSpinner = (props: ButtonSpinnerProps) => {
  const {addCSS, showSpinner, text, spinText} = props
  const addStyles = addCSS || ""
  return (
    <button
      onClick={props.onClick}
      className={`button ${addStyles}`}
      type={props.type}
      disabled={showSpinner}
      data-testid="button-spinner"
    >
      {
        !showSpinner ? <>{text}</> :
        <span className="flex align-middle gap-2 justify-center">
          <Spinner /><span>{spinText}</span>
        </span>
      }
    </button>
  )
}


export const ModelessLoading = ({text}: {text: string}) => (
  <div role="alert" aria-label="Loading" className='flex gap-2 align-middle bg-gray-50 border border-gray-200 p-1 text-sm w-max rounded'>
    <Spinner />
    <span>{text}</span>
  </div>
)


export const Failed = ({text, action, actionText}: FailedProps) => (
  <div data-testid="failed-retry-container">
    <div role='alert' className='flex gap-2 align-middle bg-red-50 border border-red-200 text-red-600 p-1 text-sm w-max rounded'>
      <BiError size={20} />
      <span>{text}</span>
    </div>
    <button onClick={action} type='button' className='mx-auto mt-5 button w-[120px]' data-testid='failed-retry'>
      {actionText || 'Try again'}
    </button>
  </div>
)


export const FaileRtry = Failed