import * as frontend from "./frontend.js"
import * as funcs from "./functions.js"

const messageTag = document.getElementById("message")
const rosterBtn = document.getElementById("create-roster")
const rosterDiv = document.getElementById("roster-div")
const loadLocationsBtn = document.getElementById("select-date-btn")
const viewRosterBtn = document.getElementById("view-roster")
const viewRosterForm = document.getElementById("view-rosters-form")

funcs.loadContents()

rosterDiv.addEventListener("submit",(event)=>{
    funcs.saveDateAndLocations(event)
})

// //add message to the main div
window.addEventListener("DOMContentLoaded",()=>{
    const message = sessionStorage.getItem("Message")

    if (message)
        messageTag.innerText = message
        sessionStorage.removeItem("Message")
        localStorage.removeItem("Message")
})

rosterBtn.addEventListener("click",()=>frontend.toogleDiv("roster-div"))

viewRosterBtn.addEventListener("click",()=>frontend.toogleDiv("view-roster-options"))

loadLocationsBtn.addEventListener("click",async ()=> await frontend.retrieveLocations())

viewRosterForm.addEventListener("submit",async (event)=>funcs.findRosters(event))

