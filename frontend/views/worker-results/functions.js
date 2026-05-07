import * as apiFuncs from '../backend.js'
import { deleteWorker } from "../../views/workers/functions.js"
import { objectCheck } from '../general-helper-funcs.js';

export async function showWorkers (){

    const workers = JSON.parse(localStorage.getItem("workerData"));
    
    for (const worker of workers){
        const workerArr = [
            worker.id,worker.first_name,worker.last_name,worker.middle_name,
            worker.gender,worker.address,worker.contact,worker.age,worker.id_number,
            worker.availability,worker.hours
        ]

        const tableRow = document.createElement("tr")

        for (const field of workerArr){
            const tableData = document.createElement("td")
            if (field){
                tableData.innerText = field
            }else{
                tableData.innerText = "Null"
            }
            tableRow.append(tableData)
        }
        const locationsRow = document.createElement("td")
        const locationsResults = await apiFuncs.workerLocationSearch("worker_id",worker.id)

        if (!objectCheck(locationsResults)){
            const tempArr = []
            for (const location of locationsResults){
                const locationInfo = await apiFuncs.findLocation("id",location.location_id)
                const locationName = locationInfo[0].location
                tempArr.push(locationName)
            }
            locationsRow.innerText = tempArr.join(', ')
        }else{
            locationsRow.innerText = "Unassigned"
        }

        tableRow.appendChild(locationsRow)

        const deleteBtn = document.createElement("button")
        deleteBtn.innerText = "Delete"
        deleteBtn.value = worker.id
        deleteBtn.classList.add("delete-btn")
        deleteBtn.addEventListener("click",(event)=>deleteWorker(event))

        tableRow.append(deleteBtn)
        table.append(tableRow)
    }
}
