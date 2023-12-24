'use client';

import * as React from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
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
import { DateTime } from 'luxon';
import { useSearchParams } from 'next/navigation'


interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  // const searchParams = useSearchParams()
 
  // const reponame = searchParams.get('reponame')!==null?searchParams.get('reponame'):""
  // const message = searchParams.get('message')!==null?searchParams.get('message'):""
  // console.log(columns);
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  
  // const columnHelper = createColumnHelper<eCommits>()
  // columns=[columnHelper.accessor('time', 
  // {
    
  //   cell: props => {
  //     const dateTime = DateTime.fromMillis(props.getValue() * 1000); // Convert timestamp to DateTime object
  //           const utcDateTime = dateTime.toUTC(); // Convert DateTime object to UTC time
  //           const utcTime = utcDateTime.toFormat('dd MMM yy'); // Format UTC time in ddmmyyhhss format
  //   <span>{`${dateTime}`}</span>
  //   },
  // }),columnHelper.accessor('reponame', 
  // {
    
  //   cell: props => {
  //   <span>{`${props.getValue()}`}</span>
  //   },
  // }),columnHelper.accessor('additions', 
  // {
    
  //   cell: props => {
  //   <span>{`${props.getValue()}`}</span>
  //   },
  // }),columnHelper.accessor('deletions', 
  // {
    
  //   cell: props => {
  //   <span>{`${props.getValue()}`}</span>
  //   },
  // }),columnHelper.accessor('message', 
  // {
    
  //   cell: props => {
  //   <span>{`${props.getValue()}`}</span>
  //   },
  // })];
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

  return (
    <div className=''>
      <div className='flex items-center py-5'>
        <Input
          placeholder='Search in filename...'
          value={(table.getColumn('filename')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            {
              table.getColumn('filename')?.setFilterValue(event.target.value)
              // || table.getColumn('reponame')?.setFilterValue(event.target.value)
            }
          }
          className='max-w-sm'
        />
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            // variant='outline' 
            className='ml-auto'>
            Columns
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
      {/* <div className='flex items-center py-5'>
        <Input
          placeholder='Filter by reponame...'
          value={(table.getColumn('reponame')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('reponame')?.setFilterValue(event.target.value)
          }
          className='max-w-sm'
        />
      </div> */}
      {/* <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            // variant='outline' 
            className='ml-auto'>
            Reponame
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
                  {column}
                </DropdownMenuCheckboxItem>
              );
            })}
        </DropdownMenuContent>
      </DropdownMenu> */}
      <div className='rounded-md border shadow-md'>
        <Table className='text-center'>
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
      </div>
        <p className='flex justify-start pt-4'>Total {table.getPageCount()} pages.</p>
      <div className='flex justify-end space-x-2 py-4'>
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
    </div>
  );
}
