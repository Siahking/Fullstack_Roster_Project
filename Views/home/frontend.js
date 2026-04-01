import * as apiFuncs from "../backend.js"
import { displayError, objectCheck } from "../general-helper-funcs.js"

const rosterDiv = document.getElementById("roster-div")
const viewRosterDiv = document.getElementById("view-roster-options")
const lowerContainer = document.getElementById("view-roster-locations-container")

export function toogleDiv(divId){
    const transitionTime = 300

    if (divId === "roster-div"){
        if(rosterDiv.classList.contains("hidden")){
            viewRosterDiv.classList.remove("visible")
            viewRosterDiv.classList.add("hidden")

            setTimeout(()=>{
                rosterDiv.classList.remove("hidden")
                rosterDiv.classList.add("visible")
            }, transitionTime);
        }else{
            rosterDiv.classList.remove("visible")
            rosterDiv.classList.add("hidden")
        }
    }else{
        if(viewRosterDiv.classList.contains("hidden")){
            
            rosterDiv.classList.remove("visible")
            rosterDiv.classList.add("hidden")

            setTimeout(()=>{
                viewRosterDiv.classList.remove("hidden")
                viewRosterDiv.classList.add("visible")
            }, transitionTime);
            
        }else{
            viewRosterDiv.classList.remove("visible")
            viewRosterDiv.classList.add("hidden")
        }
    }
}

export async function retrieveLocations(){

    const [year,month] = document.getElementById("view-roster-date").value.split("-")
    const results = await apiFuncs.retrieveRosters("","",month,year)
    const locationsContainer = document.getElementById("view-roster-locations-div")
    const locationIdentifier = document.getElementById("locations-identifier")
    const submitBtn = document.getElementById("submitBtn")
    const errorContainer = document.getElementById("roster-error-container")

    if (objectCheck(results)){
        displayError("roster-error",results.error)
        for(const tag of [locationIdentifier,submitBtn,locationsContainer])tag.classList.add("specified-hidden")
        lowerContainer.classList.remove("specified-hidden")
        return
    }

    locationsContainer.innerHTML = ""
    for (const result of results) {
        const locationId = result.location_id

        const locationResult = await apiFuncs.findLocation("id",locationId) 
        const [location,id] = [locationResult[0].location,locationResult[0].id]

        const label = document.createElement("label")
        const input = document.createElement("input")

        input.setAttribute("type","checkbox")
        input.setAttribute("name","roster-location")
        input.setAttribute("value",id)
        input.setAttribute("id",`${id}-roster`)
        input.setAttribute("class","roster-option")
        input.setAttribute("data-location",location)
        input.setAttribute("data-rosterid",result.roster_id)

        const labelText = document.createTextNode(`${location}`)
        label.setAttribute("for",`${id}-roster`)

        label.appendChild(input)
        label.appendChild(labelText)
        locationsContainer.appendChild(label)
    };

    const allLabel = document.createElement("label")
    const allInput = document.createElement("input")
    const labelText = document.createTextNode("Select All")
    allLabel.setAttribute("for","select-all-rosters")

    allInput.setAttribute("type","checkbox")
    allInput.setAttribute("id","select-all-rosters")
    allInput.setAttribute("month",month)
    allInput.setAttribute("year",year)
    allLabel.addEventListener("click",()=>toggleBoxes())
    allLabel.appendChild(allInput)
    allLabel.appendChild(labelText)
    locationsContainer.appendChild(allLabel)

    errorContainer.classList.add("specified-hidden")
    for(const tag of [locationIdentifier,submitBtn])tag.classList.remove("specified-hidden")
    locationsContainer.classList.remove("specified-hidden")
    lowerContainer.classList.remove("specified-hidden")
}

function toggleBoxes(){
    const currentCheckbox = document.getElementById("select-all-rosters")
    const locationsContainer = document.getElementById("view-roster-locations-div")
    const boxes = locationsContainer.getElementsByClassName("roster-option")

    if (currentCheckbox.checked){
        for (const box of boxes){
            box.checked = true
        }
    }else{
        for (const box of boxes){
            box.checked = false
        }
    }
}