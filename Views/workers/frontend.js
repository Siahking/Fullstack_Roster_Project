import { workerLocationSearch,getLocations } from "../backend.js"
import { displayError } from "../general-helper-funcs.js"

const idCheckbox = document.getElementById("id")
const firstNameCheckbox = document.getElementById("first-name")
const lastNameCheckbox = document.getElementById("last-name")
const middleNameCheckbox = document.getElementById("middle-name")
const idNumberCheckbox = document.getElementById("id-number")
const idInput = document.getElementById("id-input")
const firstNameInput =  document.getElementById("first-name-input")
const lastNameInput =  document.getElementById("last-name-input")
const middleNameInput =  document.getElementById("middle-name-input")
const hoursDiv = document.getElementById("hours-div")
const hoursOptions = document.getElementsByClassName("hours-options")
const hoursContainer = document.getElementById("hours-container")

const unimportantCheckboxArr =[firstNameCheckbox,lastNameCheckbox,middleNameCheckbox]
const unimportantInputArr = [firstNameInput,lastNameInput,middleNameInput]
const fieldsArr = ['id','first-name','middle-name','last-name','id-number']

const editIdArray = [
    "newFirstName","newLastName","newMiddleName","newAddress","newContact","newIdNumber","editLocations","newAvailability","newGender"
]

const availabilityOptions = document.querySelectorAll('[name="edit-availability"]')

availabilityOptions.forEach(option=>{
    option.addEventListener("click",()=>{
        if (option.id === "specified-availability"){
            hoursContainer.classList.remove("hidden")
        }else{
            hoursContainer.classList.add("hidden")
        }
    })
})

editIdArray.forEach(inputId=>{
    toogleEditCheckboxes(inputId)
})

for (const field of fieldsArr){
    const checkbox = document.getElementById(field)
    const input = document.getElementById(`${field}-input`)
    checkbox.addEventListener("click",()=>
        toogleInputs(checkbox,input)
    )
}

function toogleInputs(checkbox,input){
    if (checkbox.id === "id" || checkbox.id === 'id-number'){
        let otherCheckbox,otherInput
        if (checkbox.id === "id"){
            otherCheckbox = idNumberCheckbox
            otherInput = idInput
        }else{
            otherCheckbox = idCheckbox
            otherInput = idInput
        }
        if (checkbox.checked){
            for (const value of [...unimportantCheckboxArr,otherCheckbox]){
                value.setAttribute("disabled","true")
                value.checked = false
            }
            for (const item of [...unimportantInputArr,otherInput]){
                item.value = ""
                item.classList.add("hidden")
            }
            input.classList.remove("hidden")
        }else{
            for (const checkbox of [...unimportantCheckboxArr,otherCheckbox]){
                checkbox.removeAttribute('disabled')
            }
            input.classList.add("hidden")
        }
        
    }else if (checkbox.checked){
        input.classList.remove("hidden")
    }else{
        input.classList.add("hidden")
        input.innerText = ""
    }
}

export function toogleDisplay(div,otherDivs=""){
    if (div.classList.contains("hidden")){
        div.classList.remove("hidden")
        if (otherDivs){
            otherDivs.forEach(div => {
                div.classList.add("hidden")
            });

            div.scrollIntoView({
                behavior:"smooth",
                block:"start"
            })
        }
    }else{
        div.classList.add("hidden")
    }
}

export function displayHours(event){
    if (event.target.id === "specified-option"){
        hoursDiv.classList.remove("hidden")
    }else{
        hoursDiv.classList.add("hidden")
        for (const checkbox of hoursOptions){
            checkbox.checked = false
        }
    }
}

function toogleEditCheckboxes(Id){
    const checkbox = document.getElementById(Id + "Checkbox")
    let toogleItem
    if (Id === "newAvailability"){
        toogleItem = document.getElementById("availabilities-container")
    }else{
        toogleItem = document.getElementById(Id)
    }

    checkbox.addEventListener("click",()=>{
        if (checkbox.checked){
            toogleItem.classList.remove("hidden")
            toogleItem.required = true
        }else{
            toogleItem.classList.add("hidden")
            toogleItem.required = false
            if (checkbox.id === "newAvailabilityCheckbox"){
                hoursContainer.classList.add("hidden")
                availabilityOptions.forEach(option=>{
                    option.checked = false
                })
            }
        }
    })
}

export async function toggleEditLocations(checkboxId){
    const LOCATIONS = await getLocations() //add error message if no locations exist
    const newLocationsCheckbox = document.getElementById("new-location-checkbox")
    const newLocationsContainer = document.getElementById("add-locations-container")
    const removeLocationsCheckbox = document.getElementById("remove-location-checkbox")
    const removeLocationsContainer = document.getElementById("remove-locations-container")
    const targetId = document.getElementById("target-id").value
    const container = document.getElementById("editLocations")
    const locationsCheckbox = document.getElementById("editLocationsCheckbox")

    if (!targetId){
        displayError("workers-error","Worker Id required")
        container.classList.add("hidden")
        for (const checkbox of [newLocationsCheckbox,removeLocationsCheckbox,locationsCheckbox]){
            checkbox.checked = false
        }
        return
    }

    const workerLocations = await workerLocationSearch("worker_id",targetId)
    const workerLocationsArr = workerLocations.error ? [] : workerLocations.map(obj=>obj.location_id)

    if (checkboxId === "new-location-checkbox"){
        const displayArr = LOCATIONS.filter(obj => !workerLocationsArr.includes(obj.id))
        populateEditContainer(
            newLocationsCheckbox,newLocationsContainer,displayArr,
            removeLocationsContainer,removeLocationsCheckbox
        )
    }else{            
        const displayArr = LOCATIONS.filter(obj => workerLocationsArr.includes(obj.id))
        populateEditContainer(
            removeLocationsCheckbox,removeLocationsContainer,displayArr,
            newLocationsContainer,newLocationsCheckbox
        )
    }
}

function populateEditContainer(checkbox,container,displayArr,opposingContainer,opposingCheckbox){
    if(displayArr.length === 0){
        const locationsTag = document.createElement("p")
        locationsTag.innerText = "No Locations available for display"
        container.appendChild(locationsTag)
        container.classList.remove("hidden")
    }
    if (checkbox.checked){
        opposingCheckbox.checked = false
        opposingContainer.innerHTML = ""
        opposingContainer.classList.add("hidden")

        for (const object of displayArr){
            const label = document.createElement("label")
            const input = document.createElement("input")

            input.setAttribute("id",`${object.id}-location`)
            input.setAttribute("type","checkbox")
            input.setAttribute("value",`${object.id}`)

            label.appendChild(input)
            label.setAttribute("for",`${object.id}-location`)
            label.classList.add("bold")
            label.append(object.location)

            container.appendChild(label)
        }

        container.classList.remove("hidden")
    }else{
        container.classList.add("hidden")
        container.innerHTML = ""
        checkbox.checked = false
    }
}