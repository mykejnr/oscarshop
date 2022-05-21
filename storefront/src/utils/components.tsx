import { CgSpinner } from 'react-icons/cg'
import { IconBaseProps } from 'react-icons'

export const Spinner = (props: IconBaseProps) => (
    <CgSpinner {...props} size='20' className="icon-spin" />
)
