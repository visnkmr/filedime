export default function showdialog(e:string){
    var _dialog = document.getElementById('dialogExample') as HTMLDialogElement;
    var wte = document.getElementById('wte') as HTMLDialogElement;
    wte.textContent=e;
    _dialog.showModal();
    var hdbutton=document.getElementById('hideDialog') as HTMLButtonElement;
    hdbutton.onclick= function () {
        _dialog.close();
    }
}