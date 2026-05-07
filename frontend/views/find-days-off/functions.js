import * as apiFuncs from "../backend.js" 
import { deleteDaysOff } from "../days-off/functions.js"

const table = document.getElementById("table")
const errorTag = document.getElementById("error-tag")

export async function displayDaysOff(){
    const daysOffs = JSON.parse(localStorage.getItem("DaysOff"));

    for (const result of daysOffs){
        const tableRow = document.createElement("tr")
        const idInfo = document.createElement("td")
        const workerInfo = document.createElement("td")
        const startDate = document.createElement("td")
        const endDate = document.createElement("td")
        const deleteBtn = document.createElement("button")

        const rawWorkerData = await apiFuncs.findWorker("","","","",result.worker_id)
        const workerData = rawWorkerData[0]

        idInfo.innerText = result.break_id
        workerInfo.innerText = `${workerData.first_name} ${workerData.last_name}`
        startDate.innerText = result.start_date.split("T")[0]
        endDate.innerText = result.end_date.split("T")[0]

        deleteBtn.id = `delete_${result.break_id}`
        deleteBtn.classList.add("delete-btn")
        deleteBtn.value = result.break_id
        deleteBtn.innerText = "Remove Days Off"
        deleteBtn.addEventListener("click",(event)=>{
            const confirmation = confirm(`Are you sure you want ot delete these days off for ${workerData.first_name} ${workerData.last_name}`)
            if (confirmation){
                deleteDaysOff(event)
            }else{
                errorTag.innerText = "Operation Canceled"
                return
            }
        })

        for (const cell of [idInfo,workerInfo,startDate,endDate,deleteBtn]){
            tableRow.appendChild(cell)
        }
        table.appendChild(tableRow)
    }
}