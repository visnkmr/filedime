//exclude hidden
//restore tabs on open
//include folder in search
//show size of folders
//save history of tabs
//load search list
//showchildfoldercount
//config folder location
import { useTheme } from "next-themes";
import { Switch } from "../components/ui/switch"
import React from "react";
import { Label } from "../components/ui/label"


//display system info using os api
export default function FiledimeSettings({theme}){
    // const { theme, setTheme } = useTheme()
    const [isSelected, setIsSelected] = React.useState(false);
    console.log(isSelected)
    return (
    <>
    <div>

    <div className="flex flex-row ">
        <div className="items-center flex font-bold">
            Exclude hidden files
        </div>
        <div className="p-2">

        <Switch 
        checked={isSelected}
        onCheckedChange={() => setIsSelected(!isSelected)} />
        </div>
        <div className="ps-2 items-center flex">

        {isSelected ? 'Enabled' : 'Disabled'}
        </div>
    </div>
    </div>
    </>
    );
}
