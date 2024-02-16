'use client';

import * as React from 'react';
import { Button } from '../../components/ui/button';
import {
  ColumnDef,
  getPaginationRowModel,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
  createColumnHelper,
} from '@tanstack/react-table';
export const hovercolor="hover:bg-gray-200 hover:dark:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-50";
export const focuscolor="focus:bg-gray-200 focus:dark:bg-gray-700 focus:text-gray-900 dark:focus:text-gray-50";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';


interface DataTableProps<TData, TValue,String> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchstring:String;
  filetype:String;
}

export function DataTable<TData, TValue,String>({
  columns,
  data,
  searchstring,
  filetype
}: DataTableProps<TData, TValue,String>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    initialState: {
      pagination: {
          pageSize: 15,
      },
  },
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    enableRowSelection: true,
    // onRowSelectionChange: setRowSelection,
    // onSortingChange: setSorting,
    // onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    // getCoreRowModel: getCoreRowModel(),
    // getFilteredRowModel: getFilteredRowModel(),
    // getPaginationRowModel: getPaginationRowModel(),
    // getSortedRowModel: getSortedRowModel(),
    // getFacetedRowModel: getFacetedRowModel(),
    // getFacetedUniqueValues: getFacetedUniqueValues(),
  });
  // React.useEffect(() => {
    
  //     table.getColumn('reponame')?.setFilterValue(reponame);
  //     table.getColumn('message')?.setFilterValue(message);
  //     // console.log("ran once")
        
  //   // code to run after render goes here
  // }, []) // <-- empty array means 'run once'

  React.useEffect(()=>{
    table.getColumn('name')?.setFilterValue(searchstring)
  },[searchstring])
  React.useEffect(()=>{
    if(!!filetype){ 
      filetype==="all"?table.getColumn('ftype')?.setFilterValue(""):
      table.getColumn('ftype')?.setFilterValue(filetype)
    }
  },[filetype])
  return (
    // <div className=''>

    <div className='mt-2'>
      <div className='mb-2'>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant='outline' 
            className='ml-auto'>
            Choose Columns
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='bg-white dark:bg-gray-900'>
          {table
            .getAllColumns()
            .filter((column) => column.getCanHide())
            .map((column) => {
              return (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className='capitalize text-black dark:text-white'
                  checked={column.getIsVisible()}
                  onCheckedChange={(value:boolean) => column.toggleVisibility(!!value)}
                >
                  {column.id}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu>
      </div>
      <div className=''>
        <div className='flex flex-row'>
      <div className='flex space-x-2 py-4'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className='shadow-md'
        >
          Previous
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className='shadow-md'
        >
          Next
        </Button>
      </div>
      <p className='ms-3 pt-4'>Total {table.getPageCount()} pages.</p>
      
        
          </div>
        <Table className='rounded-md border shadow-md text-center'>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow 
                className={`${row.getIsSelected()?"bg-gray-200 dark:bg-gray-700":hovercolor}`}
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className='flex flex-row'>
      <div className='flex space-x-2 py-4'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          className='shadow-md'
        >
          Previous
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          className='shadow-md'
        >
          Next
        </Button>
      </div>
      <p className='ms-3 pt-4'>Total {table.getPageCount()} pages.</p>
      
        
          </div>
      </div>
        
      </div>
    // </div>
  );
}
