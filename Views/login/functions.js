import * as apiFuncs from "../backend.js"
import { displayError } from "../general-helper-funcs.js"

const messageTag = document.getElementById("error-tag");
const form = document.getElementById("info-container")

export async function checkCredentials(username,password){
    const result = await apiFuncs.login(username,password)
    if (result.error){
        displayError("error",result.error)
    }else{
        sessionStorage.setItem("Username",username)
        sessionStorage.setItem("Message","Login Successful")
        window.location.href = "/home"
    }
}

export async function storeCredentials(username,password){
    const results = await apiFuncs.createAccount(username,password)
    if (results.error){
        messageTag.style.color = "red"
        displayError("error",results.error)
    }else{
        messageTag.style.color = "green"
        displayError("message",results.message)
        const inputTags = form.querySelectorAll("input")
        for (const tag of inputTags){
            tag.value = ""
        }
        form.classList.add("hidden")
    }
}