import { Transition } from 'react-transition-group';
import { useDispatch, useSelector } from "react-redux"
import { showPopup } from "../actions"

export const PopupMessage = () => {
  const dispatch = useDispatch()
  const uiState = useSelector((state: IRootState) => state.ui)
  const show = Boolean(uiState.popupMessage)

  const styles = "dialog bg-white min-w-[280px] box-border py-3 px-5 rounded-md shadow-md max-w-[360px] border-t-4 border-accent-400"

  return (
    <Transition in={show} timeout={300} unmountOnExit>
      {state => (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex justify-center items-center">
          <div className={`${styles} dialog-${state}}`}>
            <div className="pb-8 text-black">{uiState.popupMessage}</div>
            <button type="button" className="button block ml-auto w-20" onClick={() => dispatch(showPopup())}>
              Ok
            </button>
          </div>
        </div>
      )}

    </Transition>
  )
}