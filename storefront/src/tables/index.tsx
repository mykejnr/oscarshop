import React from "react"
import { Link, useNavigate } from "react-router-dom"
import { TRowConfig, TTableProps } from "../typedefs/tables"
import { TDProps } from "../typedefs/utils"


const TD = (props: TDProps) => {
  const {isth, children, className} = props
  const styles = `text-sm text-left px-2 py-3 ${className || ""}`

  if (isth) {
    return <th className={styles + "font-semibold bg-accent-400 text-white"}>{children}</th>
  }
  return (
    <td className={styles}>{children}</td>
  )
}


const TableHeader = ({headers}: {headers: string[]}) => {
  return (
    <thead>
      <tr>
        {headers.map((header_text) => <TD isth>{header_text}</TD>)}
      </tr>
    </thead>
  )
}


const TableRow = (props: TRowConfig) => {
  const {cells, index} = props
  const navigate = useNavigate()
  // elem:nth-of type is not enabled by default, so we do this
  // quick hack instead, of enabling it
  const exStyles = (index !== undefined && !(index % 2)) ? 'bg-gray-100' : ''

  const gotoLink = () => {
    if (props.link) navigate(props.link)
  }

  return (
    <tr
      data-testid="order-row-item"
      className={'hover:bg-gray-200 cursor-pointer '+exStyles}
      onClick={gotoLink}
    >
      {
        cells.map((row_text, idx) => <TD key={idx}>{row_text}</TD>)
      }
    </tr>
  )
}


const TableBody = <TableRowObject,>(props: TTableProps<TableRowObject>) => {
  const {rows, getRow} = props
    
  return (
    <tbody>
      {
        // rows is of type Iterator, so it could be a generator, But,
        // Since tsconfig target is 'es5' we can use for..of, .map is
        // also not supported directly on an iterator. So we have to 
        // first convert the iterator to an array, loosing the performance
        // we hoped to gain on a generator.
        // In future when we drop support for 'es5' we will go full iterator/generator
        Array.from(rows).map((rowObj, index) => {
          let row = getRow(rowObj)
          row = Array.isArray(row) ? {cells: row} : row
          return <TableRow key={index} {...row} index={index}/>
        })
      }
    </tbody>
  )
}


const Table = <TableRowObject, >(props: TTableProps<TableRowObject>) => {
  return (
    <table className="w-full">
      <TableHeader headers={props.headers}/>
      <TableBody<TableRowObject> {...props}/>
    </table>
  )
}


export default Table