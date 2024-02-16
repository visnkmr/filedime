export interface tabinfo  {
    id: number,
    path: string,
    ff: string,
    tabname: string,
    history:string[]
  };
  export interface mark  {
    path:string,
    name:string,
    is_dir:string,
    id:string
  };
  export interface wininfo{
    winname:string,
    tablist:tabinfo[],
    tabidsalloted:number
  }
  export interface pathsplit{
    interfolpath:string,
    pathtofol:string
  }
  export interface  operationfileinfo{
    sourcepath:String,
    destpath:String,
    existingfilesize:String,
    existingdate:String,
    srcfilesize:String,
    srcfiledate:String,
    replace:boolean
  }
  export interface existingfileinfo{
    sourcepath:String,
    destpath:String,
    existingfilesize:String,
    existingdate:String,
    srcfilesize:String,
    srcfiledate:String
  }
  export interface wtd{
    functionname:string,
    arguments:string[]
  } 
   export interface parentprops{
    path:string,
    tabid:string
  }
  export interface stateinfo{
    excludehidden:boolean,
    sessionstore:boolean,
    includefolder:boolean,
    childcount:boolean,
    folsize:boolean,
    cfpath:string,
    cfpathsize:string,
}