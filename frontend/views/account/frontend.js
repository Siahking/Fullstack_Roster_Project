import { displayError } from "../general-helper-funcs.js"

const errorTag = document.getElementById("error-tag")
const errorContainer = document.getElementById("error-container")
const editOptions = document.getElementById("edit-options-container")
const newPassword = document.getElementById("new-password")
const confirmPasswordLabel = document.getElementById("confirmation-label")
const confirmPasswordInput = document.getElementById("confirm-password")
newPassword.addEventListener("input",()=>{

    if(newPassword.value.trim()!== ""){
        confirmPasswordLabel.classList.remove("hidden")
    }else{
        confirmPasswordInput.value = ""
        confirmPasswordLabel.classList.add("hidden")
    }
})

export function toggleContainer(check=false){
    if (check && editOptions.classList.contains("hidden")){
        editOptions.classList.remove("hidden")
    }else{
        editOptions.classList.add('hidden')
    }
}

export function toggleErrorContainer(errorMessage){
    displayError("error",errorMessage)
    setTimeout(()=>{
        errorContainer.classList.add("specified-hidden")
        errorTag.innerText = ""
    },3000)
}