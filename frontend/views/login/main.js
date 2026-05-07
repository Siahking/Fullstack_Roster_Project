import { displayError } from "../general-helper-funcs.js";
import { toggleDiv } from "./frontend.js";
import { storeCredentials,checkCredentials } from "./functions.js";

const loginBtn = document.getElementById("login-button")
const signupBtn = document.getElementById("signup-button")
const submitBtn = document.getElementById("submit-button")
const usernameTag = document.getElementById("username")
const passwordTag = document.getElementById("password")
const form = document.getElementById("info-container")
const messageTag = document.getElementById("message-tag")
const message = sessionStorage.getItem("Message")

if (message){
    displayError("message",message)
    messageTag.innerText = message
    messageTag.classList.remove("hidden")
    sessionStorage.removeItem("Message")
}

loginBtn.addEventListener("click",()=>{
    toggleDiv("login-button")
})

signupBtn.addEventListener("click",()=>{
    toggleDiv("signup-button")
})

form.addEventListener("submit",(event)=>{
    event.preventDefault()

    if (passwordTag.type === "password"){
        checkCredentials(usernameTag.value,passwordTag.value)
    }else{
        storeCredentials(usernameTag.value,passwordTag.value)
    }
})