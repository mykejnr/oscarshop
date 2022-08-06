export type FailedProps = {
    text: string
    action: () => void
    actionText?: string
}


export type ButtonSpinnerProps = {
    type: 'submit' | 'button'
    onClick?: () => void
    addCSS?: string
    showSpinner: boolean
    text: string
    spinText: string
}


// wrapped <td> element props
export type TDProps = {
    isth?: boolean // is <th> element
    className?: string
    children: any
}