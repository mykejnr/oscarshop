export type TTableRows<TableRowObject> = Iterable<TableRowObject>

export type TRowConfig = {
    cells: string[]
    index?: number
    link?: string
    className?: string
}

export type TTableConfig<TableRowObject> = {
    headers: string[]
    rows: TTableRows<TableRowObject>
    getRow: (row: TableRowObject) => string[] | TRowConfig
}

export type TTableProps<TableRowObject> = TTableConfig<TableRowObject>