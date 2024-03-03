import {React} from "react"
interface FileItem {
    name: string;
    path: string;
    is_dir: boolean;
    size: number;
    rawfs: number;
    lmdate: number;
    timestamp: number;
    foldercon: number;
    ftype: string;
    parent: string;
  }
interface DriveItem {
    name: string;
    mount_point: string;
    total: string;
    free: string;
    is_removable: boolean;
    disk_type: string;
    file_system: string;
    uuid:string;
    vendormodel:string;
  }