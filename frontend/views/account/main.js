import { displayError } from "../general-helper-funcs.js"
import { toggleContainer } from "./frontend.js"
import { accountLogout,editInfo,removeAccount } from "./functions.js"

const editBtn = document.getElementById("edit-account-btn")
const deleteBtn = document.getElementById("delete-account-btn")
const logoutBtn = document.getElementById("logout")
const saveBtn = document.getElementById("save-new-info")

editBtn.addEventListener("click",()=>{
    toggleContainer(true)
})

deleteBtn.addEventListener("click",async ()=>{
    toggleContainer()
    if (window.confirm("Would you like to proceed with deleting account?")){
        await removeAccount()
    }
})

logoutBtn.addEventListener("click",async ()=>{

    if (window.confirm("Please confirm logout")){
        await accountLogout()
    }else{
        displayError("error","Logout canceled")
    }
    toggleContainer()
})

saveBtn.addEventListener("click",async (event)=>{
    event.preventDefault()
    await editInfo()
})