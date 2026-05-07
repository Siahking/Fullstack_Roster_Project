import { getWorker } from '../permanent-restrictions/functions.js'
import { deleteRestriction } from '../permanent-restrictions/functions.js'

const table = document.getElementById("table")

export async function displayRestrictions() {
    const restrictions = JSON.parse(localStorage.getItem("Restrictions"))

    for (const restriction of restrictions){
        const workerData = await getWorker(restriction.worker_id)
        const tableRow = document.createElement("tr")
        const idData = document.createElement("td")
        const firstNameData = document.createElement("td")
        const lastNameData = document.createElement("td")
        const dayOfWeekData= document.createElement("td")
        const startTimeData = document.createElement("td")
        const endTimeData = document.createElement("td")
        const deleteBtn = document.createElement("button")

        deleteBtn.innerText = "Delete Restriction"
        deleteBtn.value = restriction.id
        deleteBtn.id = `delete-${restriction.id}`
        deleteBtn.classList.add("delete-btn")
        deleteBtn.addEventListener("click",(event)=>
            deleteRestriction(event.target.value)
        )
        
        idData.innerText  = restriction.id
        firstNameData.innerText = workerData.first_name
        lastNameData.innerText = workerData.last_name
        dayOfWeekData.innerText = restriction.day_of_week

        if (restriction.start_time){
            startTimeData.innerText = restriction.start_time.split(":").splice(0,2).join(":")
        }else{
            startTimeData.innerText = "--"
        }

        if (restriction.end_time){
            endTimeData.innerText = restriction.end_time.split(":").splice(0,2).join(":")
        }else{
            endTimeData.innerText = "--"
        }
        
        for (const data of [idData,firstNameData,lastNameData,dayOfWeekData,startTimeData,endTimeData,deleteBtn]){
            tableRow.appendChild(data)
        }

        table.appendChild(tableRow)
    }
}