'use client';

import { DataTable } from './data-table';
import React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { FileItem } from '../../shared/types';

  interface dtableprops{
    columns:ColumnDef<FileItem>[];
    data:FileItem[];
  }
  export default function Dtable({columns,data}:dtableprops) {
    
    return (
      
        <DataTable columns={columns} data={data} />
          
    );
  }