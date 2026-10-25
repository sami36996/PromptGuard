"use client";

import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
 DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";


interface Props {

open:boolean;

title:string;

description:string;

onConfirm:()=>void;

onCancel:()=>void;

}


export function ConfirmDialog({
 open,
 title,
 description,
 onConfirm,
 onCancel
}:Props){


return (

<Dialog open={open}>

<DialogContent>

<DialogHeader>

<DialogTitle>
{title}
</DialogTitle>

<p>
{description}
</p>

</DialogHeader>


<DialogFooter>

<Button
variant="outline"
onClick={onCancel}
>
Cancel
</Button>


<Button
onClick={onConfirm}
>
Confirm
</Button>


</DialogFooter>


</DialogContent>

</Dialog>

);


}