import * as apiFuncs from "../backend.js"
import * as helperFuncs from "./helper-functions.js"
import { objectCheck,displayError, deleteConfirmation } from "../general-helper-funcs.js"

const errorTagId = "days-off-error"
const table = document.getElementById("table")
const emptyTableTag = document.getElementById("empty-table")
const workerIdCheckbox = document.getElementById("workerid-radio")
const breakIdCheckbox = document.getElementById("breakid-radio")
const valueInput = document.getElementById("value")
let message

let workers

try{
    workers = await apiFuncs.getWorkers()

    if (!workers || objectCheck(workers)){
        emptyTableTag.classList.remove('specified-hidden')
        console.warn("No workers found, script terminated")
        throw new Error("No workers found")
    }
}catch(err){
    emptyTableTag.classList.remove('specified-hidden')
    console.error("Error fetching workers:", err)
    throw err
}

const SHIFTOBJECT = {}
for (const worker of workers){
    for (const hour of worker.hours){
        if (SHIFTOBJECT[hour]){
            SHIFTOBJECT[hour]++
        }else{
            SHIFTOBJECT[hour] = 1
        }
    }
}

export async function displayDaysOff(){
    const results = await apiFuncs.getDaysOff()

    if (objectCheck(results)){
        emptyTableTag.classList.remove("specified-hidden")
        return
    }else{
        table.classList.remove("specified-hidden")
    }

    for (const result of results){
        const tableRow = document.createElement("tr")
        const idInfo = document.createElement("td")
        const workerId = document.createElement("td")
        const workerInfo = document.createElement("td")
        const startDate = document.createElement("td")
        const endDate = document.createElement("td")
        const deleteBtn = document.createElement("button")

        const rawWorkerData = await apiFuncs.findWorker("","","","",result.worker_id)
        const workerData = rawWorkerData[0]

        idInfo.innerText = result.break_id
        workerId.innerText = workerData.id
        workerInfo.innerText = `${workerData.first_name} ${workerData.last_name}`
        startDate.innerText = result.start_date.split("T")[0]
        endDate.innerText = result.end_date.split("T")[0]

        deleteBtn.id = `delete_${result.break_id}`
        deleteBtn.value = result.break_id
        deleteBtn.innerText = "Remove Days Off"
        deleteBtn.classList.add("delete-btn")
        deleteBtn.addEventListener("click",(event)=>{
            const confirmation = confirm(`Are you sure you want to delete these days off for ${workerData.first_name} ${workerData.last_name}`)
            if (confirmation){
                deleteDaysOff(event)
            }else{
                displayError(errorTagId,"Operation Canceled")
                return
            }
        })

        for (const cell of [idInfo,workerId,workerInfo,startDate,endDate,deleteBtn]){
            tableRow.appendChild(cell)
        }
        table.appendChild(tableRow)
    }
}

export async function newDaysOff(event){
    
    event.preventDefault()

    const workerId = document.getElementById("worker-id").value
    const startDate = document.getElementById("start-date").value
    const endDate = document.getElementById("end-date").value
    const workerDetails = await apiFuncs.findWorker("","","","",workerId)
    const workerLocations = await apiFuncs.workerLocationSearch("worker_id",workerId)

    if (workerLocations.error){
        displayError(errorTagId,"A worker with this ID does not exist")
        return
    }

    for(const result of workerLocations){
        const checkResults = await helperFuncs.validateCoverage(result.location_id,startDate,endDate,workerDetails[0])
        if (!checkResults){
            message = "Insufficient workers, cannot request day off"
            displayError(errorTagId,message)
            return
        }
    }

    const result = await apiFuncs.addDaysOff(workerId,startDate,endDate)
    console.log(result)

    if (objectCheck(result)){
        displayError(errorTagId,result.error)
        return
    }

    sessionStorage.setItem("Message",result.message)
    window.location.href = "/home"
}

export async function deleteDaysOff(event){
    const breakId = event.target.value

    if (deleteConfirmation("worker")){
        const result = await apiFuncs.removeDaysOff(breakId)

        if (objectCheck(result)){
            displayError(errorTagId,result.error)
            return
        }

        sessionStorage.setItem("Message",result.message)
        window.location.href = "/home"
    }else{
        displayError(errorTagId,"Operation Canceled")
    }
}

export async function findDaysOff(event){

    event.preventDefault()
    let result

    if (workerIdCheckbox.checked){
        result = await apiFuncs.getDaysOff("worker_id",valueInput.value)
    }else if (breakIdCheckbox.checked){
        result = await apiFuncs.getDaysOff("break_id",valueInput.value)
    }else{
        displayError(errorTagId,"Unknown search value")
        return
    }

    if (objectCheck(result)){
        displayDaysOff(errorTagId,result.error)
        return
    }

    localStorage.setItem("DaysOff",JSON.stringify(result))
    window.location.href = "/find-days-off"
}

export async function editDaysOff(event){

    event.preventDefault()

    const breakId = document.getElementById("breakId").value
    const newWorker_Id = document.getElementById("newWorkerId-value").value
    const newStartDate = document.getElementById("newStartTime-value").value
    const newEndDate = document.getElementById("newEndTime-value").value

    if (!breakId){
        displayError(errorTagId,"Day Off ID Required")
        return
    }

    const result = await apiFuncs.editDaysOff(breakId,newWorker_Id,newStartDate,newEndDate)

    if(objectCheck(result)){
        displayError(errorTagId,result.error)
        return
    }else{
        sessionStorage.setItem("Message",result.message)
        location.href = "/"
    }
}