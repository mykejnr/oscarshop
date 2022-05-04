import { MouseEventHandler } from "react";

export const Button = ({text, onClick}: {text: string, onClick?: MouseEventHandler}) => (
    <button
        onClick={onClick}
        className="bg-accent-400 hover:bg-accent-500 rounded p-1 px-2 border-accent-400 block mx-auto text-center text-white"
    >
        {text}
    </button>
)