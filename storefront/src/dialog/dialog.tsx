import { useDispatch, useSelector } from "react-redux"

import SignupForm from '../components/signup-form'
import { FaWindowClose, FaUser } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { showDialog } from "../actions";

type TDialogHeadProps = {
  title: string,
  Icon: IconType
}
type TDialogTuple = [() => JSX.Element, string, IconType]
export type TDialogName = keyof typeof dialogs
// hack:... helps with type inference of type Record<T, T>
const asRecord = <T extends Record<string, TDialogTuple>>(arg: T): T => arg


const dialogs = asRecord({
  'signup': [SignupForm, 'Signup', FaUser],
  'nodialog': [() => <div data-testid='nodialog'></div>, '', FaWindowClose]
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


const Dialog = () => {

  const uiState = useSelector((state: IRootState) => state.ui);
  const dialog_props = dialogs[uiState.activeDialog]
  const [ActiveDialog, title, Icon] = dialog_props

  if (uiState.activeDialog === 'nodialog') {
    return <ActiveDialog />
  }
  return (
    <div className='fixed inset-0 bg-white bg-opacity-70'>
      <div className='absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 shadow-2xl'>
        <DialogHead title={title} Icon={Icon} />
        <ActiveDialog />
      </div>
    </div>
  )
}

export default Dialog