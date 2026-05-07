const locationDiv = document.getElementById("add-location-div")
const input = document.getElementById("location-input")
const editLocationDiv = document.getElementById("edit-location-div")
const resultsContainer = document.getElementById("search-items")

export const toogleStates = {
    "find-location":false,
    "add-location":false
}

export function toogleDiv(btnId){
    editLocationDiv.classList.add("hidden")
    if (btnId === "find-location"){
        if(toogleStates["add-location"]){
            toogleStates["add-location"] = false
        }
    }
    else {
        if(toogleStates["find-location"]){
            toogleStates["find-location"] = false
        }
    }
    toogleStates[btnId] = !toogleStates[btnId]
    if (!toogleStates["find-location"] && !toogleStates["add-location"]){
        locationDiv.classList.add("hidden")
    }else{
        locationDiv.classList.remove("hidden")
    }
    input.value = ""
    resultsContainer.classList.add("hidden")
}

export function toogleEditDiv(){
    toogleStates["add-location"] = false
    toogleStates["find-location"] = false

    locationDiv.classList.add("hidden")

    if(editLocationDiv.classList.contains("hidden")){
        editLocationDiv.classList.remove("hidden")
    }else{
        editLocationDiv.classList.add("hidden")
    }
}