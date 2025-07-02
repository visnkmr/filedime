import { Switch } from "./ui/switch"
import React from "react";

export default function EachSetting({name,callback,currentstatus=false}){
    const [isSelected, setIsSelected] = React.useState(currentstatus);
    console.log(isSelected)
    return (

    <div className="flex flex-row ">
        <div className="pr-4">

        <Switch 
        checked={isSelected}
        onCheckedChange={() => {
            setIsSelected(!isSelected)
            callback()
            }
        } />
        </div>
        <div className="items-center flex font-bold">
            {name}
        </div>
        
        <div className="ps-2 items-center flex">

        {isSelected ? 'Enabled' : 'Disabled'}
        </div>
    </div>
    );
}
