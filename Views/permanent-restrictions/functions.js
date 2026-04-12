import { objectCheck,displayError, deleteConfirmation } from '../general-helper-funcs.js'
import validateCoverage from './helper-functions.js'
import * as apiFuncs from "../backend.js";

const errorTagId = "restriction-error"
const emptyTableTag = document.getElementById("restriction-table-tag")

export async function getWorker(workerId){
    const workerData = await apiFuncs.findWorker("","","","",workerId)
    return workerData[0]
}

export async function displayRestrictions(){
    const table = document.getElementById("restriction-table")
    const results = await apiFuncs.getPermanentRestrictions()

    if (objectCheck(results)){
        emptyTableTag.classList.remove("specified-hidden")
        return
    }else{
        table.classList.remove("specified-hidden")
    }

    for (const restriction of results){
        const workerData = await getWorker(restriction.worker_id)
        const tableRow = document.createElement("tr")
        const restrictionIdData = document.createElement("td")
        const workerIdData = document.createElement("td")
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
        
        restrictionIdData.innerText  = restriction.id
        workerIdData.innerText = workerData.id
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

        for (const data of [restrictionIdData,workerIdData,firstNameData,lastNameData,dayOfWeekData,startTimeData,endTimeData,deleteBtn]){
            tableRow.appendChild(data)
        }

        table.appendChild(tableRow)
    }
}

export async function findRestriction(event) {

    event.preventDefault()

    const workerIdRadio = document.getElementById("restriction-worker-id")
    const idRadio = document.getElementById("restriction-id")
    const idValue = document.getElementById("id-value-input")
    let results

    if (!workerIdRadio.checked && !idRadio.checked || idValue.value === ""){
        displayError(errorTagId,"Please select an ID AND insert a search Value")
        return 
    }
    else if (workerIdRadio.checked){
        results = await apiFuncs.findPermanentRestrictions("worker_id",idValue.value)
    } else if (idRadio.checked){
        results = await apiFuncs.findPermanentRestrictions("id",idValue.value)
    }

    if(objectCheck(results)){
        displayError(errorTagId,results.error)
        return
    }

    localStorage.setItem("Restrictions",JSON.stringify(results))
    window.location.href = "/find-restrictions"
}

export async function addRestriction(event){

    event.preventDefault()

    let dayOfWeek
    let checked = false
    const options = document.querySelectorAll(".day-of-week-input")
    const workerId = document.getElementById("worker-id-input").value
    const startTime = document.getElementById("start-time-input").value
    const endTime = document.getElementById("end-time-input").value

    for (const input of options){
        if (input.checked){
            dayOfWeek = input.value
            checked = true
        }
    }

    if (!checked){
        dayOfWeek = "Any"
    }

    const locationId = await apiFuncs.workerLocationSearch("worker_id",workerId)
    const check = await validateCoverage(locationId[0].location_id,dayOfWeek,workerId)

    if (!check){
        displayError(errorTagId,"Insufficient Workers to set permanent day off")
        return
    }

    const result = await apiFuncs.createRestriction(workerId,dayOfWeek,startTime,endTime)

    if (objectCheck(result)){
        displayError(errorTagId,"Insufficient Workers to set permanent day off")
        return
    }

    sessionStorage.setItem("Message",result.message)
    window.location.href = "/home"
}

export async function deleteRestriction(id){
    if (deleteConfirmation("restriction")){
        const result = await apiFuncs.deletePermanentRestrictions(id)

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

export async function editRestriction(event){

    event.preventDefault()

    let newDay = null

    const newDayOptions = document.querySelectorAll('[name="newDay"]')

    newDayOptions.forEach(option=>{
        if (option.checked){
            newDay = option.value
            return
        }
    })

    const restrictionId = document.getElementById("restriction-target-id") .value
    const newWorker = document.getElementById("newWorker").value
    let newStartTime = document.getElementById("newRestrictionStart").value
    let newEndTime = document.getElementById("newRestrictionEnd").value
    const removeStartTime = document.getElementById("removeStartCheckbox")
    const removeEndTime = document.getElementById("removeEndCheckbox")

    if (!restrictionId){
        return{"error":"Restriction ID required"}
    }

    if (removeStartTime.checked){
        newStartTime = "99:99:99"
    }
    if (removeEndTime.checked){
        newEndTime = "99:99:99"
    }

    const result = await apiFuncs.editPermanentRestriction(restrictionId,newWorker,newDay,newStartTime,newEndTime)
}