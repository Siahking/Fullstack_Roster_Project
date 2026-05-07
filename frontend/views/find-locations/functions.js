import { deleteLocation } from "../locations/functions.js";

export function displayLocations(){
    const locations = JSON.parse(localStorage.getItem("locationsData"));

    locations.forEach(data=>{
        const listItem = document.createElement("li")
        const text = document.createTextNode(data.location)

        const deleteBtn = document.createElement("button")
        deleteBtn.innerText = "Delete"
        deleteBtn.value = data.id
        deleteBtn.id = `delete-${data.id}`
        deleteBtn.classList.add("delete-btn")

        deleteBtn.addEventListener("click",(event)=>
            deleteLocation(event.target.value)
        )

        listItem.appendChild(text)
        listItem.appendChild(deleteBtn)

        list.appendChild(listItem)
    })
}