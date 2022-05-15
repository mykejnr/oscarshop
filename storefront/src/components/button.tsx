import { MouseEventHandler } from "react";

export const submitStyles = "cursor-pointer bg-accent-400 hover:bg-accent-500 rounded p-1 px-2 border-accent-400 block text-center text-white"
export const buttonStyles = `${submitStyles} mx-auto`

export const Button = ({text, onClick}: {text: string, onClick?: MouseEventHandler}) => (
    <button
        onClick={onClick}
        className={buttonStyles}
    >
        {text}
    </button>
)

export const SubmitButton = () => {
    const styles = `${submitStyles} w-36`
    return(
        <input type='submit' className={styles} />
    )
}