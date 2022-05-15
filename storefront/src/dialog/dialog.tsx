import { useDispatch, useSelector } from "react-redux"

import SignupForm from '../components/signup-form'
import { FaWindowClose, FaUser } from 'react-icons/fa';
import { IconType } from 'react-icons';
import { showDialog } from "../actions";

type TDialogHeadProps = {
  title: string
}
type TDialogTuple = [() => JSX.Element, string, IconType]
export type TDialogName = keyof typeof dialogs
// hack:... helps with type inference of type Record<T, T>
const asRecord = <T extends Record<string, TDialogTuple>>(arg: T): T => arg


const dialogs = asRecord({
  'signup': [SignupForm, 'Signup', FaUser],
  'nodialog': [() => <div data-testid='nodialog'></div>, '', FaWindowClose]
})


const DialogHead = ({title}: TDialogHeadProps ) => {
  const dispatch = useDispatch()

  return (
    <div className='text-white flex justify-between bg-accent-500 p-3 '>
      <FaUser size='20' />
      <div className='font-bold'>
        {title}
      </div>
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
  const ActiveDialog = dialogs[uiState.activeDialog][0]

  if (uiState.activeDialog === 'nodialog') {
    return <ActiveDialog />
  }
  return (
    <div className='fixed inset-0 bg-white bg-opacity-70'>
      <div className='absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 shadow-2xl'>
        <DialogHead title='Sign up' />
        <ActiveDialog />
      </div>
    </div>
  )
}

export default Dialog