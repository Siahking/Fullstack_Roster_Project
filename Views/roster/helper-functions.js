import * as apiFuncs from "../backend.js"
import { adjustEditDiv } from "./frontend.js"
import { objectCheck } from "../general-helper-funcs.js"
import { restrictions } from "./functions.js"

export async function retrieveWorkers(day,month,year,workers,daysOff,hours){
    let array = []
    const excludedWorkers = await dayOffCheck(day,month,year,daysOff)
    const stringDay = getDayName(`${year}-${month}-${day}`)

    for (const worker of workers){
        if (
            excludedWorkers[`${worker.id}`] ||
            !restrictionCheck(stringDay,worker.id,hours,restrictions)
        )continue
        if (worker.hours.includes(hours) || worker.hours.includes("24hrs")){
            array.push(worker)
        }
    }
    return array.sort(() => Math.random() - 0.5);
}

export function setDayNightWorker(idStart,tag,worker,shift,time){
    //selecting the first index of each first name to get the first letter in the name
    const pTag = document.createElement("p")
    const workerName = document.createElement("span")
    const shiftType = document.createElement("span")
    shiftType.classList.add ("shiftType")
    workerName.classList.add("workerInfo")
    workerName.innerText = `${shift[worker].first_name[0]}.${shift[worker].last_name}`
    tag.setAttribute("workerId",shift[worker].id)
    if (time === "day"){
        if (shift.shift === "12hr"){
            shiftType.innerText = "(6am-6pm)"
            tag.setAttribute("shiftType","6am-6pm")
        }else{
            shiftType.innerText = "(6am-2pm)"
            tag.setAttribute("shiftType","6am-2pm")
        }
    }else{
        if (shift.shift === "12hr"){
            shiftType.innerText = "(6pm-6am)"
            tag.setAttribute("shiftType","6pm-6am")
        }else{
            shiftType.innerText = "(10pm-6am)"
            tag.setAttribute("shiftType","10pm-6am")
        }
    }
    workerName.setAttribute("id",`${idStart}-${time}-worker`)
    shiftType.setAttribute("id",`${idStart}-${time}-shift`)

    pTag.appendChild(workerName)
    pTag.appendChild(shiftType)
    tag.appendChild(pTag)
    setupEditBtn(`${idStart}-${time}-editBtn`,tag)
    tag.classList.add("workerContainer")
    return tag
}

export function setAfternoonWorker(idStart,tag,shift){
    const pTag = document.createElement("p")
    const workerName = document.createElement("span")
    const shiftType = document.createElement("span")
    shiftType.classList.add ("shiftType")
    workerName.classList.add("workerInfo")
    workerName.innerText = `${shift.afternoonWorker.first_name[0]}.${shift.afternoonWorker.last_name}`
    shiftType.innerText = "(2pm-10pm)"
    tag.setAttribute("workerId",shift.afternoonWorker.id)
    tag.setAttribute("shiftType","2pm-10pm")

    workerName.setAttribute("id",`${idStart}-afternoon-worker`)
    shiftType.setAttribute("id",`${idStart}-afternoon-shift`)

    pTag.innerText = ""
    pTag.appendChild(workerName)
    pTag.appendChild(shiftType)
    tag.appendChild(pTag)
    setupEditBtn(`${idStart}-afternoon-editBtn`,tag)
    tag.classList.add("workerContainer")
    return tag
}

export function setWorkerToUnavailable(workerId,arrayOfArrays,constraints){
    const workersToExclude = []
    const worker1Constraints = constraints.worker1Constraints[workerId]
    const worker2Constraints = constraints.worker2Constraints[workerId]
    if (worker1Constraints){
        for (const constraint of worker1Constraints){
            workersToExclude.push(constraint.worker2_id)
        }
    }
    if (worker2Constraints){
        for (const constraint of worker2Constraints){
            workersToExclude.push(constraint.worker1_id)
        }
    }
    for (const array of arrayOfArrays){
        for (const [index,worker] of array.entries()){
            if(worker.id === workerId || workersToExclude.includes(worker.id)){
                array.splice(index,1)
                break
            }
        }
    }
}

export function checkShifts(strShift,shift){
    if (shift.length < 3){
        return {"error":strShift}
    }
    return {"success":""}
}

function getDayName(dateString){
    const date = new Date(dateString);
    const options = { weekday: 'long' };
    return date.toLocaleDateString('en-US',options);
}

function restrictionCheck(day,workerId,hours){
    //returns true if a worker has a restriction which obstructs the roster hours, else returns false
    let restrictionStartTime,restrictionEndTime,shiftStart,shiftEnd
    if (restrictions[workerId]){
        const workerRestrictions = restrictions[workerId]
        for (const restriction of workerRestrictions){
            if (restriction.day_of_week === day){
                if (!restrictionStartTime && !restrictionEndTime){
                    return false
                }
                const strStartTime = restriction.start_time.split(":")[0]
                const strEndTime = restriction.end_time.split(":")[0]
                restrictionStartTime = parseInt(strStartTime)
                restrictionEndTime = parseInt(strEndTime)

                switch (hours){
                    case "6am-6pm":
                        shiftStart = 6;
                        shiftEnd = 18;
                        break
                    case "6am-2pm":
                        shiftStart = 6;
                        shiftEnd = 14;
                        break
                    case "2pm-10pm":
                        shiftStart = 14;
                        shiftEnd = 22;
                        break
                    case "6pm-6am":
                        shiftStart = 18;
                        shiftEnd = 6;
                        break
                    case "10pm-6am":
                        shiftStart = 22;
                        shiftEnd = 6;
                        break
                }

                if (
                    (restrictionStartTime > shiftStart && restrictionEndTime < shiftEnd) ||
                    (restrictionEndTime > shiftStart && restrictionEndTime < shiftEnd) ||
                    (restrictionStartTime < shiftStart && restrictionEndTime > shiftEnd) ||
                    (restrictionStartTime > shiftEnd && restrictionEndTime < shiftEnd)
                ){
                    return false
                }
            }
        }
    }
    
    return true
}

 async function dayOffCheck(day,month,year,daysOff){
    const occupancies = await apiFuncs.retrieveOccupancies("event_date",`${year}-${month}-${day}`)

    //stores all workers off on this day
    //stores the workers which requested days off first
    const obj = {}
    for (const result of daysOff){
        const startDate = new Date(result.start_date)
        const endDate = new Date(result.endDate)
        const currentDate = new Date(year, month, day);

        if (currentDate >= startDate && currentDate <= endDate ) {
            obj[result.worker_id] = true;
        }
    }

    //stores all workers already working on this day
    if (!objectCheck(occupancies)){
        for (const occupancy of occupancies){
            obj[occupancy.worker_id] = true;
        }
    }

    return obj
}

export function dateToString(day,month,year){
    const newDay = day < 10 ?`0${day}` : `${day}`
    const newMonth = month < 10 ? `0${month}` : `${month}`

    return `${year}-${newMonth}-${newDay}`
}

export async function setWorkerForShift(workerArray,date,shiftWorkersArray,constraints){
    while(true){
        if (workerArray.length === 0){
            console.log("Array is empty")
            return
        }
        const worker = workerArray.pop()
        const result = await apiFuncs.createOccupancy(worker.id,date,"Work") 
        if (!objectCheck(result)){
            setWorkerToUnavailable(worker.id,shiftWorkersArray,constraints)
            return worker
        }
    }
}

export function displayDataDiv(dataDiv,loadDiv){
    dataDiv.classList.remove("specified-hidden")
    loadDiv.classList.add("specified-hidden")
}

export function setLoadingContainer(){
    const loadingContainer = document.createElement("div")
    const loadingMessage = document.createElement("p")
    loadingMessage.innerText = "Loading"
    loadingMessage.classList.add("loading-message")
    loadingContainer.classList.add("loading-container")
    loadingContainer.appendChild(loadingMessage)
    return loadingContainer
}

export function setAttributes(tag,tagName,locationId,monthYear,dayNumber){
    if (!tag)return
    tag.classList.add(`${dayNumber}-${locationId}-worker`)
    tag.setAttribute("locationId",locationId)
    tag.setAttribute("day",dayNumber)
    tag.setAttribute("monthYear",monthYear)
    tag.setAttribute("name",`${locationId}-workerDetails`)
    tag.setAttribute("id",`${dayNumber}-${locationId}-${tagName}`)
}

function setupEditBtn(id,container){
    const editBtn = document.createElement("button")
    editBtn.innerText = "✏️"
    editBtn.classList.add("editBtn")
    editBtn.setAttribute("id",id)
    editBtn.addEventListener("click",(event)=>adjustEditDiv(event))
    
    container.appendChild(editBtn)
}

export async function filterWorkers(workerId,shiftType,locationId,date,otherWorkers,allWorkersObj){
    const [year,month,day] = date.split('-')
    const dayName = new Date(date).toLocaleDateString("en-US", { weekday: "long" })
    const shiftConflicts = {
        "6am-2pm":  ["6am-2pm", "6am-6pm"],
        "6am-6pm":  ["6am-6pm", "6am-2pm", "2pm-10pm"],
        "2pm-10pm": ["2pm-10pm", "6am-6pm", "6pm-6am"],
        "6pm-6am":  ["6pm-6am", "10pm-6am", "2pm-10pm"],
        "10pm-6am": ["10pm-6am", "6pm-6am"]
    };

    console.log(allWorkersObj)

    const relevantShifts = shiftConflicts[shiftType] || []
    const workersToExclude = relevantShifts.flatMap(shift => allWorkersObj[shift] || [])

    let excludedWorkers = []

    const [workers,daysOff,constraints] = await Promise.all([
        apiFuncs.retrieveWorkerOrLocations("location_id",locationId),
        apiFuncs.getDaysOff("worker_id",workerId),
        apiFuncs.getConstraints("",workerId)
    ])

    if (!daysOff.error){
        excludedWorkers = await dayOffCheck(day,month,year,daysOff)
    }
        
    const workerOptions = workers.filter(worker =>{
        const isAvailable = worker["hours"].includes(shiftType) || worker["hours"].includes("24hrs")
        if (!isAvailable)return false

        if (workersToExclude.some(id => parseInt(id) === worker.id))return false

        if (worker.id == workerId)return false

        if (excludedWorkers[workerId])return false

        const isRestricted = restrictionCheck(dayName,workerId,shiftType)
        if (!isRestricted)return false

        return true
    })

    console.log(workerOptions)
    return validateConstraint(constraints,workerOptions,otherWorkers)
}

export async function filterGeneralShiftWorkers(shiftType,locationId,date,otherWorkers,optionalWorkers=[]) {
    const shiftConflicts = {
        "6am-2pm":  ["6am-2pm", "6am-6pm"],
        "6am-6pm":  ["6am-6pm", "6am-2pm", "2pm-10pm"],
        "2pm-10pm": ["2pm-10pm", "6am-6pm", "6pm-6am"],
        "6pm-6am":  ["6pm-6am", "10pm-6am", "2pm-10pm"],
        "10pm-6am": ["10pm-6am", "6pm-6am"]
    }
    const [year, month, day] = date.split("-")
    const dayCell = document.getElementById(`${locationId}-day-${day}`)
    const dateWorkersCells = Array.from(dayCell.querySelectorAll(".workerContainer"))

    const dateWorkers = {}
    for (const value of ["6am-6pm","6am-2pm","2pm-10pm","10pm-6am","6pm-6am"]){
        dateWorkers[value] = dateWorkersCells
        .filter(cell => cell.getAttribute("shifttype") === value)
        .map(cell => cell.getAttribute("workerid"))
        .filter(id => id !== null)
    }

    const relevantShifts = shiftConflicts[shiftType] || []
    const workersToExclude = relevantShifts.flatMap(shift => dateWorkers[shift] || [])

    const workers = await apiFuncs.retrieveWorkerOrLocations("location_id", locationId)
    const shiftWorkers = []
    const availableWorkers = []

    for (const worker of workers){
        if (Array.isArray(optionalWorkers) && optionalWorkers.some(id => id === worker.id))continue
        
        if (!worker["hours"].includes(shiftType))continue

        if (workersToExclude.some(id => parseInt(id) === worker.id))continue
        
        const daysOff = await apiFuncs.getDaysOff("worker_id",worker.id)
        let isOff = false
        if (!daysOff.error){
            const excluded = await dayOffCheck(day, month, year, daysOff)
            if (excluded[worker.id])isOff = true
        }
        if (isOff) continue
        shiftWorkers.push(worker)
    }

    for (const option of shiftWorkers){
        const workerContraints = await apiFuncs.getConstraints(option.id)
        if (objectCheck(workerContraints)){
            availableWorkers.push(option)
            continue
        }
        let constraintFound = false

        for (const constraint of workerContraints){
            for (const worker of otherWorkers){
                if (constraint === worker.id){
                    constraintFound = true
                    break
                }
            }
            if (constraintFound)break
        }
        if (constraintFound)continue
        availableWorkers.push(option)
    }

    return availableWorkers
}

function validateConstraint(constraints,workerOptions,otherWorkers){
    if (constraints.length === 0)return  workerOptions

    const validCandidates = workerOptions.filter(candidate => {
        const hasConflict = otherWorkers.some(worker => 
            constraints.some(cons =>
            (cons.worker1_id === candidate.id && cons.worker2_id === worker.id) ||
            (cons.worker2_id === candidate.id && cons.worker1_id === worker.id)
            )
        )

        return !hasConflict
    })
    return validCandidates
}

export async function setNewDayWorker(newWorkerShift,newWorker,oldWorker){
    const locationId = oldWorker.getAttribute("locationid")
    const locationResult = await apiFuncs.findLocation("id",locationId)
    const locationName = locationResult[0].location
    const [month,year] = oldWorker.getAttribute("monthyear").split("-")
    const dayNumber = oldWorker.getAttribute("day")
    const date = `${year}-${month}-${dayNumber}`
    const currentWorkerId = oldWorker.getAttribute("workerid")

    const otherWorkersDivs = document.getElementsByClassName(`${dayNumber}-${locationId}-worker`)
    const otherWorkers = []

    for (const div of otherWorkersDivs){
        const workerId = div.getAttribute("workerid")
        if (workerId && workerId !== currentWorkerId)otherWorkers.push(workerId)
    }

    const oldWorkerShift = oldWorker.getAttribute("shifttype")
    const workerSpan = oldWorker.getElementsByClassName("workerInfo")[0]
    const shiftSpan = oldWorker.getElementsByClassName("shiftType")[0]

    if (oldWorkerShift === "6am-2pm"){
        if (newWorkerShift === "6am-2pm"){
            workerSpan.innerText = `${newWorker.first_name[0]}.${newWorker.last_name}`
            shiftSpan.innerText = `(${newWorkerShift})`
            oldWorker.setAttribute("workerid",newWorker.id)
        }else{
            const oldWorkerId = oldWorker.getAttribute("id")
            /* the id contains the day and month as the first half, then the time of the day for the shift
            e.g day,afternoon,night along with the number for the shift. Example "1-2-morningWorker1"
            Therefore i extract the split id and change the worker time to the relevant time, then select using the new id 
            */
            const idArray = oldWorkerId.split("-")
            const afternoonWorkerId = `${idArray[0]}-${idArray[1]}-afternoonWorker${oldWorkerId[oldWorkerId.length-1]}`
            const nightWorkerId = `${idArray[0]}-${idArray[1]}-nightWorker${oldWorkerId[oldWorkerId.length-1]}`

            const afternoonWorkerShift = document.getElementById(afternoonWorkerId)
            const nightWorkerShift = document.getElementById(nightWorkerId)
            const nightCoworker = nightWorkerShift.closest(".workerContainer")
            const nightCoworkerId = parseInt(nightCoworker.getAttribute("workerid"))

            workerSpan.innerText = `${newWorker.first_name[0]}.${newWorker.last_name}`
            shiftSpan.innerText = `(${newWorkerShift})`
            oldWorker.setAttribute("shifttype","6am-6pm")
            
            afternoonWorkerShift.parentNode.removeChild(afternoonWorkerShift)

            const nightWorkerSpan = nightWorkerShift.getElementsByClassName("workerInfo")[0]
            const nightShiftSpan = nightWorkerShift.getElementsByClassName("shiftType")[0]

            let availableWorkers = await filterGeneralShiftWorkers(newWorkerShift,locationId,date,otherWorkers,nightCoworkerId)
            const randomIndex = Math.floor(Math.random() * availableWorkers.length)       
            const newNightWorker = availableWorkers[randomIndex]

            if (newNightWorker){
                nightWorkerSpan.innerText = `${newNightWorker.first_name[0]}.${newNightWorker.last_name}`
                nightShiftSpan.innerText = `(6pm-6am)`
                nightWorkerShift.setAttribute("workerid",newNightWorker.id)
                nightWorkerShift.setAttribute("shifttype","6am-6pm")
            }else{
                nightWorkerSpan.innerText = "No worker Available"
                nightShiftSpan.innerText = "-"
            }
            
            // nightWorkerShift.setAttribute("workerid",newNightWorker.id)
            // nightWorkerShift.setAttribute("shifttype","6am-6pm")
        }
    }else{ //old worker shift is 6am-6pm
        if (newWorkerShift === "6am-6pm"){
            workerSpan.innerText = `${newWorker.first_name[0]}.${newWorker.last_name}`
            shiftSpan.innerText = `(${newWorkerShift})`
            oldWorker.setAttribute("workerid",newWorker.id)
        }else{
            workerSpan.innerText = `${newWorker.first_name[0]}.${newWorker.last_name}`
            shiftSpan.innerText = `(${newWorkerShift})`
            oldWorker.setAttribute("shifttype","6am-2pm")

            let buttonId
            const oldWorkerId = oldWorker.getAttribute("id")
            const idArray = oldWorkerId.split("-")
            const afternoonWorkerId = `${idArray[0]}-${idArray[1]}-afternoonWorker${oldWorkerId[oldWorkerId.length-1]}`
            const nightWorkerId = `${idArray[0]}-${idArray[1]}-nightWorker${oldWorkerId[oldWorkerId.length-1]}`
            const dayNumberSpan = document.getElementById(`day-number-${dayNumber}`)
            const shiftsContainer = dayNumberSpan.closest(".calendar-item")
            const afternoonShiftContainer = shiftsContainer.getElementsByClassName("shift-2")[0]
            let availableAfternoonWorkers

            //check if theres any 2-10 workers 
            const shiftCheck = afternoonShiftContainer.getElementsByClassName("workerContainer")
            if (shiftCheck.length > 0){
                const afternoonCoworker = shiftCheck[0]
                const afternoonCoworkerId = parseInt(afternoonCoworker.getAttribute("workerid"))
                availableAfternoonWorkers = await filterGeneralShiftWorkers("2pm-10pm",locationId,date,otherWorkers,[afternoonCoworkerId,newWorker.id])
            }else{
                availableAfternoonWorkers = await filterGeneralShiftWorkers("2pm-10pm",locationId,date,otherWorkers,[newWorker.id])
            }
            
            const randomIndex = Math.floor(Math.random() * availableAfternoonWorkers.length)       
            const newAfternoonWorker = availableAfternoonWorkers[randomIndex]
            
            const afternoonWorkerShift = document.createElement("div")
            const container = document.createElement("p")
            const workerData = document.createElement("span")
            const shiftData = document.createElement("span")

            if (newAfternoonWorker){
                workerData.innerText = `${newAfternoonWorker.first_name[0]}.${newAfternoonWorker.last_name}`
                shiftData.innerText = "(2pm-10pm)"
                afternoonWorkerShift.setAttribute("workerid",newAfternoonWorker.id)
                
            }else{
                workerData.innerText = "No worker Available"
                shiftData.innerText = "-"
                afternoonWorkerShift.setAttribute("workerid",null)
            }
            workerData.setAttribute("id",`${locationName}-${dayNumber}-afternoon-worker`)
            workerData.classList.add("workerInfo")
            shiftData.setAttribute("id",`${locationName}-${dayNumber}-afternoon-worker`)

            afternoonWorkerShift.setAttribute("shifttype","2pm-10pm")
            afternoonWorkerShift.setAttribute("locationid",locationId)
            afternoonWorkerShift.setAttribute("monthyear",`${month}-${year}`)
            afternoonWorkerShift.setAttribute("name",`${locationId}-workerDetails`)
            afternoonWorkerShift.setAttribute("id",afternoonWorkerId)
            afternoonWorkerShift.classList.add("workerContainer")
            afternoonWorkerShift.classList.add(`${dayNumber}-${location}-worker`)

            container.appendChild(workerData)
            container.appendChild(shiftData)
            setupEditBtn(buttonId,container)
            afternoonWorkerShift.appendChild(container)

            afternoonShiftContainer.appendChild(afternoonWorkerShift)

            const nightWorkerContainer = document.getElementById(nightWorkerId)
            const nightWorkerData = nightWorkerContainer.getElementsByClassName("workerInfo")[0]
            const nightWorkerShift = nightWorkerContainer.getElementsByClassName("shiftType")[0]
            // const nightCoworker = nightWorkerContainer.closest(".workerContainer")
            // const nightCoworkerId = parseInt(nightCoworker.getAttribute("workerid"))

            const availableNightWorkersResults = await filterGeneralShiftWorkers("10pm-6am",locationId,date,otherWorkers)
            // const availableNightWorkers = availableNightWorkersResults.filter(worker => worker.id !== newAfternoonWorker.id)
            const randomIndex2 = Math.floor(Math.random() * availableNightWorkersResults.length)
            const newNightWorker = availableNightWorkersResults[randomIndex2]
            nightWorkerContainer.setAttribute("shifttype","10pm-6am")

            if (newNightWorker){
                nightWorkerData.innerText = `${newNightWorker.first_name[0]}.${newNightWorker.last_name}`
                nightWorkerShift.innerText = "(10pm-6am)"
                nightWorkerContainer.setAttribute("workerid",newNightWorker.id)
            }else{
                nightWorkerData.innerText = "No worker Available"
                nightWorkerShift.innerText = "-"
                nightWorkerContainer.setAttribute("workerid",null)
            }   
        }
    }
}

export async function setNewAfternoonWorker(newWorker,oldWorker){
    const locationId = oldWorker.getAttribute("locationid")
    const dayNumber = oldWorker.getAttribute("day")
    const currentWorkerId = oldWorker.getAttribute("workerid")

    const otherWorkersDivs = document.getElementsByClassName(`${dayNumber}-${locationId}-worker`)

    const otherWorkers = Array.from(otherWorkersDivs)
        .map(div => div.getAttribute("workerid"))
        .filter(workerId => workerId && workerId !== currentWorkerId)

    for (const div of otherWorkersDivs){
        const workerId = div.getAttribute("workerid")
        if (workerId && workerId !== currentWorkerId)otherWorkers.push(workerId)
    }

    const workerSpan = oldWorker.getElementsByClassName("workerInfo")[0]

    workerSpan.innerText = `${newWorker.first_name[0]}.${newWorker.last_name}`
    oldWorker.setAttribute("workerid",newWorker.id)
}

export async function setNewNightWorker(newWorkerShift,newWorker,oldWorker){
    const locationId = oldWorker.getAttribute("locationid")
    const locationResult = await apiFuncs.findLocation("id",locationId)
    const locationName = locationResult[0].location
    const [month,year] = oldWorker.getAttribute("monthyear").split("-")
    const dayNumber = oldWorker.getAttribute("day")
    const date = `${year}-${month}-${dayNumber}`
    const currentWorkerId = oldWorker.getAttribute("workerid")

    const otherWorkersDivs = document.getElementsByClassName(`${dayNumber}-${locationId}-worker`)
    const otherWorkers = []

    for (const div of otherWorkersDivs){
        const workerId = div.getAttribute("workerid")
        if (workerId && workerId !== currentWorkerId)otherWorkers.push(workerId)
    }

    const oldWorkerShift = oldWorker.getAttribute("shifttype")
    const workerSpan = oldWorker.getElementsByClassName("workerInfo")[0]
    const shiftSpan = oldWorker.getElementsByClassName("shiftType")[0]

    if (oldWorkerShift === "10pm-6am"){
        if (newWorkerShift === "10pm-6am"){
            workerSpan.innerText = `${newWorker.first_name[0]}.${newWorker.last_name}`
            shiftSpan.innerText = `(${newWorkerShift})`
            oldWorker.setAttribute("workerid",newWorker.id)
        }else{
            const oldWorkerId = oldWorker.getAttribute("id")
            /* the id contains the day and month as the first half, then the time of the day for the shift
            e.g day,afternoon,night along with the number for the shift. Example "1-2-morningWorker1"
            Therefore i extract the split id and change the worker time to the relevant time, then select using the new id 
            */
            const idArray = oldWorkerId.split("-")
            const afternoonWorkerId = `${idArray[0]}-${idArray[1]}-afternoonWorker${oldWorkerId[oldWorkerId.length-1]}`
            const dayWorkerId = `${idArray[0]}-${idArray[1]}-dayWorker${oldWorkerId[oldWorkerId.length-1]}`

            const afternoonWorkerShift = document.getElementById(afternoonWorkerId)
            const dayWorkerShift = document.getElementById(dayWorkerId)
            const dayCoworker = dayWorkerShift.closest(".workerContainer")
            const dayCoworkerId = parseInt(dayCoworker.getAttribute("workerid"))

            workerSpan.innerText = `${newWorker.first_name[0]}.${newWorker.last_name}`
            shiftSpan.innerText = `(${newWorkerShift})`
            oldWorker.setAttribute("shifttype","6am-6pm")
            
            afternoonWorkerShift.parentNode.removeChild(afternoonWorkerShift)

            const dayWorkerSpan = dayWorkerShift.getElementsByClassName("workerInfo")[0]
            const dayShiftSpan = dayWorkerShift.getElementsByClassName("shiftType")[0]

            let availableWorkers = await filterGeneralShiftWorkers(newWorkerShift,locationId,date,otherWorkers,dayCoworkerId)
                if (availableWorkers.length === 0)console.log("empty array found")
            const randomIndex = Math.floor(Math.random() * availableWorkers.length)       
            const newNightWorker = availableWorkers[randomIndex]
            
            if (newNightWorker){
                dayWorkerSpan.innerText = `${newNightWorker.first_name[0]}.${newNightWorker.last_name}`
                dayShiftSpan.innerText = `(6pm-6am)`
                dayWorkerShift.setAttribute("workerid",newNightWorker.id)
            }else{
                dayWorkerSpan.innerText = "No worker Available"
                dayShiftSpan.innerText = "-"
                dayWorkerShift.setAttribute("workerid",null)
            }
            dayWorkerShift.setAttribute("shifttype","6am-6pm")
        }
    }else{ //old worker shift is 6am-6pm
        if (newWorkerShift === "6pm-6am"){
            workerSpan.innerText = `${newWorker.first_name[0]}.${newWorker.last_name}`
            shiftSpan.innerText = `(${newWorkerShift})`
            oldWorker.setAttribute("workerid",newWorker.id)
        }else{
            workerSpan.innerText = `${newWorker.first_name[0]}.${newWorker.last_name}`
            shiftSpan.innerText = `(${newWorkerShift})`
            oldWorker.setAttribute("shifttype","10pm-6am")

            let buttonId
            const oldWorkerId = oldWorker.getAttribute("id")
            const idArray = oldWorkerId.split("-")
            const afternoonWorkerId = `${idArray[0]}-${idArray[1]}-afternoonWorker${oldWorkerId[oldWorkerId.length-1]}`
            const dayWorkerId = `${idArray[0]}-${idArray[1]}-nightWorker${oldWorkerId[oldWorkerId.length-1]}`
            const nightNumberSpan = document.getElementById(`day-number-${dayNumber}`)
            const shiftsContainer = nightNumberSpan.closest(".calendar-item")
            const afternoonShiftContainer = shiftsContainer.getElementsByClassName("shift-2")[0]
            let availableAfternoonWorkers

            //check if theres any 2-10 workers 
            const shiftCheck = afternoonShiftContainer.getElementsByClassName("workerContainer")
            if (shiftCheck.length > 0){
                const afternoonCoworker = shiftCheck[0]
                const afternoonCoworkerId = parseInt(afternoonCoworker.getAttribute("workerid"))
                availableAfternoonWorkers = await filterGeneralShiftWorkers("2pm-10pm",locationId,date,otherWorkers,afternoonCoworkerId)
            }else{
                availableAfternoonWorkers = await filterGeneralShiftWorkers("2pm-10pm",locationId,date,otherWorkers)
            }
            
            const randomIndex = Math.floor(Math.random() * availableAfternoonWorkers.length)       
            const newAfternoonWorker = availableAfternoonWorkers[randomIndex]
            
            const afternoonWorkerShift = document.createElement("div")
            const container = document.createElement("p")
            const workerData = document.createElement("span")
            const shiftData = document.createElement("span")

            if (newAfternoonWorker){
                workerData.innerText = `${newAfternoonWorker.first_name[0]}.${newAfternoonWorker.last_name}`
                shiftData.innerText = "(2pm-10pm)"
                afternoonWorkerShift.setAttribute("workerid",newAfternoonWorker.id)
            }else{
                workerData.innerText = "No worker Available"
                shiftData.innerText = "-"
                afternoonWorkerShift.setAttribute("workerid",null)
            }
            
            workerData.setAttribute("id",`${locationName}-${dayNumber}-afternoon-worker`)
            workerData.classList.add("workerInfo")
            shiftData.setAttribute("id",`${locationName}-${dayNumber}-afternoon-worker`)

            afternoonWorkerShift.setAttribute("shifttype","2pm-10pm")
            afternoonWorkerShift.setAttribute("locationid",locationId)
            afternoonWorkerShift.setAttribute("monthyear",`${month}-${year}`)
            afternoonWorkerShift.setAttribute("name",`${locationId}-workerDetails`)
            afternoonWorkerShift.setAttribute("id",afternoonWorkerId)
            afternoonWorkerShift.classList.add("workerContainer")
            afternoonWorkerShift.classList.add(`${dayNumber}-${location}-worker`)

            container.appendChild(workerData)
            container.appendChild(shiftData)
            setupEditBtn(buttonId,container)
            afternoonWorkerShift.appendChild(container)

            afternoonShiftContainer.appendChild(afternoonWorkerShift)

            const dayWorkerContainer = document.getElementById(dayWorkerId)
            const dayWorkerData = dayWorkerContainer.getElementsByClassName("workerInfo")
            const dayWorkerShift = dayWorkerContainer.getElementsByClassName("shiftType")
            const dayCoworker = dayWorkerContainer.closest(".workerContainer")
            const dayCoworkerId = parseInt(dayCoworker.getAttribute("workerid"))

            const availableDayWorkers = await filterGeneralShiftWorkers("10pm-6am",locationId,date,otherWorkers,dayCoworkerId)
            const randomIndex2 = Math.floor(Math.random() * availableDayWorkers.length)
            const newDayWorker = availableDayWorkers[randomIndex2]

            if (newDayWorker){
                dayWorkerData.innerText = `${newDayWorker.first_name[0]}.${newDayWorker.last_name}`
                dayWorkerShift.innerText = "(10pm-6am)"
                dayWorkerContainer.setAttribute("workerid",newDayWorker.id)
            }else{
                dayWorkerData.innerText = "No worker Available"
                dayWorkerShift.innerText = "-"
                dayWorkerContainer.setAttribute("workerid",null)
            }
            
        }
    }
}

export async function replaceWorkers(shift){

}