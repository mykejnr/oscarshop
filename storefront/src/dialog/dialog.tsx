import { useDispatch, useSelector } from "react-redux"
import { Transition } from 'react-transition-group';
import { FaWindowClose, FaUser, FaKey } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
import { IconType } from 'react-icons';
import { showDialog } from "../actions";
import { ChangeEmailForm, ChangePasswordForm, ForgotPasswordForm, LoginForm, SignupForm } from "../forms";

type TDialogHeadProps = {
  title: string,
  Icon: IconType
}
type TDialogTuple = [(props: any) => JSX.Element, string, IconType]
export type TDialogName = keyof typeof dialogs
// hack:... helps with type inference of type Record<T, T>
const asRecord = <T extends Record<string, TDialogTuple>>(arg: T): T => arg


const dialogs = asRecord({
  'signup': [SignupForm, 'Signup', FaUser],
  'login': [LoginForm, 'Login', FaUser],
  'nodialog': [() => <div data-testid='nodialog'></div>, '', FaWindowClose],
  'forgot_password': [ForgotPasswordForm, 'Forgot Password', FaUser],
  'change_password': [ChangePasswordForm, 'Change Password', FaKey],
  'change_email': [ChangeEmailForm, 'Change Email', MdEmail],
})


const DialogHead = ({title, Icon}: TDialogHeadProps ) => {
  const dispatch = useDispatch()

  return (
    <div className='text-white flex justify-between bg-accent-500 p-3 '>
      <Icon size='20' />
      <div className='font-bold'>{title}</div>
      <button
        className='text-gray-300 hover:text-white'
        onClick={() => dispatch(showDialog('nodialog'))}
        data-testid='close-dialog'
      >
        <FaWindowClose size='20'/>
      </button>
    </div>
  )
}


type TDialogProps = {
  name: keyof typeof dialogs
}

const Dialog = ({name}: TDialogProps) => {
  const uiState = useSelector((state: IRootState) => state.ui);
  const dialog_props = dialogs[name]
  const [ActiveDialog, title, Icon] = dialog_props


  let styles = 'fixed inset-0 bg-white bg-opacity-70 flex justify-center items-center'
  const show = name === uiState.activeDialog

  const cStyles = 'dialog shadow-2xl'
  return (
    <Transition in={show} timeout={300} unmountOnExit>
      {state => (
        <div className={styles}>
          <div className={`${cStyles} dialog-${state}`} >
            <DialogHead title={title} Icon={Icon} />
            <ActiveDialog />
          </div>
        </div>
      )
      }
    </Transition>
  )
}

export default Dialog