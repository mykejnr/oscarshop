import { useDispatch, useSelector } from "react-redux"
import { showPopup } from "../actions"


const createRawHtml = (rawHtml: string) => ({
  __html: rawHtml
})

export const PopupMessage = () => {
  const dispatch = useDispatch()
  const popup = useSelector((state: IRootState) => state.ui.popupMessage)

  if (popup === 'nopopup') return <></>

  let message_type = popup.type || "raw"

  const styles = "dialog bg-white w-[600px] box-border rounded-b-md shadow-md border-b-4 border-accent-400"

  return (
  <div className="fixed inset-0 bg-black bg-opacity-10 flex justify-center items-start pt-2">
    <div className={`${styles}`}>
      <div className='border-b py-3 px-5 text-accent-500'>{popup.title || "Message"}</div>
      <div className=' py-3 px-5'>
        {
          message_type === 'html' ?
          <div dangerouslySetInnerHTML={createRawHtml(popup.message)} /> :
          <div data-testid="popup-msg" className="pb-8">{popup.message}</div>
        }
        <button type="button" className="button block ml-auto w-20" onClick={() => dispatch(showPopup('nopopup'))}>
          Ok
        </button>
      </div>
    </div>
  </div>
  )
}