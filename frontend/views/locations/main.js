import * as frontend from "./frontend.js"
import * as funcs from "./functions.js"
import { displayOptions } from "../general-helper-funcs.js"

const locationForm = document.getElementById("location-form")
const addLocationBtn = document.getElementById("add-location")
const findLocationBtn = document.getElementById("find-location")
const editLocationBtn = document.getElementById("edit-location")
const editLocationForm = document.getElementById("edit-location-form")
const inputTag = document.getElementById("location-input")
const resultsContainer = document.getElementById("search-items")

await funcs.loadLocations()

for (const btn of [addLocationBtn,findLocationBtn]){
    btn.addEventListener("click",(event)=>
        frontend.toogleDiv(event.target.id)
    )
}

inputTag.addEventListener("input",()=>{
    if (frontend.toogleStates["find-location"])displayOptions(inputTag,resultsContainer,funcs.locationsArr,"location")
})

locationForm.addEventListener("submit",(event)=>{
    event.preventDefault()
    if(frontend.toogleStates["add-location"]){
        funcs.newLocation()
    }else{
        funcs.findlocation()
    }
})

editLocationBtn.addEventListener("click",frontend.toogleEditDiv)

editLocationForm.addEventListener("submit",(event)=>funcs.editLocation(event))