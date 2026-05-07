import { editAccount,findAccount,logout,deleteAccount } from "../backend.js"
import { displayError } from "../general-helper-funcs.js"
import { toggleErrorContainer } from "./frontend.js"

const currentUsername = sessionStorage.getItem("Username")
const results = await findAccount(currentUsername)
const usernameInfo = document.getElementById("username")

if (results.error){
    displayError("error",results.error)
    throw new Error(results.error)
}

if (!results || !results[0]){
    displayError("error","Account not found")
    throw new Error("Account not found")
}

const userId = results[0].account_id
usernameInfo.innerText += results[0].username

export async function editInfo(){
    const usernameValue = document.getElementById("new-username").value
    const passwordValue = document.getElementById("new-password").value
    const pwdCheck = document.getElementById("confirm-password").value

    if(!usernameValue && !passwordValue){
        displayError("error","No Changes made")
        return
    }else if (passwordValue !== pwdCheck){
        displayError("error","Passwords do not match")
        return
    }

    const newUsername = usernameValue ? usernameValue : null
    const newPassword = passwordValue ? passwordValue : null

    const editResults = await editAccount(userId,newUsername,newPassword)

    if(editResults.error){
        displayError("error",editResults.error)
    }else{
        sessionStorage.setItem("Message",editResults.message + ",please login with new credentials")
    }

    await logout()
    window.location = "/login"
}

export async function accountLogout(){
    const results = await logout()
    if (results.error){
        displayError("error",results.error)
    }else{
        sessionStorage.setItem("Message",results.message)
        window.location = "/login"
    }
}

export async function removeAccount(){
    const results = await deleteAccount(userId)
    if (results.error){
        toggleErrorContainer(results.error)
    }else{
        sessionStorage.setItem("Message",results.message)
        await logout()
        window.location = "/login"
    }
}