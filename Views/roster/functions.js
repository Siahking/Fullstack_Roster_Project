import * as helperFuncs from "./helper-functions.js"
import { objectCheck } from "../general-helper-funcs.js"
import * as apiFuncs from "../backend.js"

const rawRestrictions = await apiFuncs.getPermanentRestrictions()
export let restrictions = {}

if (!objectCheck(rawRestrictions)){  
    for (const restriction of rawRestrictions){
        const key = restriction.worker_id
        const restrictionObject = {
            id:restriction.id,
            day_of_week:restriction.day_of_week,
            start_time:restriction.start_time, 
            end_time:restriction.end_time
        }
        if (restrictions[key]){
            restrictions[key].push(restrictionObject)
        }else{
            restrictions[key] = [restrictionObject]
        }
    }
}

export async function assignWorkers({ 
    dayNumber, month, year, WORKERS,location, daysOff,constraints,dayBlock,afternoonBlock,
    nightBlock
 }){
    let shift1,shift2
    const results = await rosterWorkers(dayNumber,month,year,WORKERS,daysOff,constraints)
    if (objectCheck(results) || Object.keys(results).includes("Insufficient Workers")){
        return results
    }
    //results returns an object with success as the key and the values as the value or an error object
    [shift1,shift2] = results.success

    const container = document.createElement("div")
    container.setAttribute("id",`${location}-workers-div`)

    let dayWorker1 = document.createElement("div")
    let dayWorker2 = document.createElement("div")
    let afternoonWorker1 = document.createElement("div")
    let afternoonWorker2 = document.createElement("div")
    let nightWorker1 = document.createElement("div")
    let nightWorker2 = document.createElement("div")
    
    dayWorker1 = helperFuncs.setDayNightWorker(`${location.location}-${dayNumber}-1`,dayWorker1,"dayWorker",shift1,"day")
    dayWorker2 = helperFuncs.setDayNightWorker(`${location.location}-${dayNumber}-2`,dayWorker2,"dayWorker",shift2,"day")
    //manually sets afternoon workers if the shifts ends up being 8 hr shifts
    if (shift1["afternoonWorker"]){
        afternoonWorker1 = helperFuncs.setAfternoonWorker(`${location.location}-${dayNumber}-1`,afternoonWorker1,shift1)
    }else{
        afternoonWorker1 = null
    }
    if (shift2["afternoonWorker"]){
        afternoonWorker2 = helperFuncs.setAfternoonWorker(`${location.location}-${dayNumber}-2`,afternoonWorker2,shift2)
    }else{
        afternoonWorker2 = null
    }
    nightWorker1 = helperFuncs.setDayNightWorker(`${location.location}-${dayNumber}-1`,nightWorker1,"nightWorker",shift1,"night")
    nightWorker2 = helperFuncs.setDayNightWorker(`${location.location}-${dayNumber}-2`,nightWorker2,"nightWorker",shift2,"night")

    const tempArray = new Map([
        [dayWorker1,"dayWorker1"],
        [dayWorker2,"dayWorker2"],
        [afternoonWorker1,"afternoonWorker1"],
        [afternoonWorker2,"afternoonWorker2"],
        [nightWorker1,"nightWorker1"],
        [nightWorker2,"nightWorker2"]
    ])
    
    for (const [element,label] of tempArray.entries()) {
        helperFuncs.setAttributes(element,label,location.id,`${month}-${year}`,dayNumber)
    };

    for (const tag of [dayWorker1,dayWorker2]){
        dayBlock.appendChild(tag)
    }

    for (const tag of [afternoonWorker1,afternoonWorker2]){
        if(!tag)continue
        afternoonBlock.appendChild(tag)
    }

    for (const tag of [nightWorker1,nightWorker2]){
        nightBlock.appendChild(tag)
    }

    return {"success":""}
}

async function rosterWorkers(day,month,year,workers,daysOff,constraints){ 
    const shifts = ["8hr","12hr"]
    const locationsError = []
    const dateStr = helperFuncs.dateToString(day,month,year)
    const [sixToSixDayArray,sixToSixNightArray,sixToTwoArray,twoToTenArray,tenToSixArray] = await Promise.all([
        helperFuncs.retrieveWorkers(day,month,year,workers,daysOff,"6am-6pm"),
        helperFuncs.retrieveWorkers(day,month,year,workers,daysOff,"6pm-6am"),
        helperFuncs.retrieveWorkers(day,month,year,workers,daysOff,"6am-2pm"),
        helperFuncs.retrieveWorkers(day,month,year,workers,daysOff,"2pm-10pm"),
        helperFuncs.retrieveWorkers(day,month,year,workers,daysOff,"10pm-6am")
    ])
    let shiftOne,shiftTwo

    const checkArray = [
        helperFuncs.checkShifts("6am-6pm",sixToSixDayArray),
        helperFuncs.checkShifts("6pm-6am",sixToSixNightArray),
        helperFuncs.checkShifts("6am-2pm",sixToTwoArray),
        helperFuncs.checkShifts("2pm-10pm",twoToTenArray),
        helperFuncs.checkShifts("10pm-6am",tenToSixArray)
    ]
    

    for (const check of checkArray){
        if(objectCheck(check)){
            locationsError.push(check.error)
        }
    }

    if (locationsError.length > 0){
        return {"Insufficient Workers":locationsError}
    }

    //randomly selects a shift for the workers
    const shiftOneShift = shifts[Math.floor(Math.random() * shifts.length)]
    const shiftTwoShift = shifts[Math.floor(Math.random() * shifts.length)]

    if (shiftOneShift== "8hr"){
        const [dayWorker,afternoonWorker,nightWorker] = await Promise.all([
            helperFuncs.setWorkerForShift(sixToTwoArray,dateStr,[sixToSixDayArray,sixToTwoArray],constraints),
            helperFuncs.setWorkerForShift(twoToTenArray,dateStr,[sixToSixDayArray,sixToSixNightArray,twoToTenArray],constraints),
            helperFuncs.setWorkerForShift(tenToSixArray,dateStr,[sixToSixNightArray,tenToSixArray],constraints)
        ])
    
        shiftOne = {
            "shift":"8hr",
            "dayWorker":dayWorker,
            "afternoonWorker":afternoonWorker,
            "nightWorker":nightWorker,
        }
    }else{
        const [dayWorker,nightWorker] = await Promise.all([
            helperFuncs.setWorkerForShift(sixToSixDayArray,dateStr,[sixToTwoArray,twoToTenArray,sixToSixDayArray],constraints),
            helperFuncs.setWorkerForShift(sixToSixNightArray,dateStr,[tenToSixArray,twoToTenArray,sixToSixNightArray],constraints)
        ])
        
        shiftOne = {
            "shift":"12hr",
            "dayWorker":dayWorker,
            "nightWorker":nightWorker
        }

    }
 
    if (shiftTwoShift== "8hr"){
        const [dayWorker,afternoonWorker,nightWorker] = await Promise.all([
            helperFuncs.setWorkerForShift(sixToTwoArray,dateStr,[sixToSixDayArray,sixToTwoArray],constraints),
            helperFuncs.setWorkerForShift(twoToTenArray,dateStr,[sixToSixDayArray,sixToSixNightArray,twoToTenArray],constraints),
            helperFuncs.setWorkerForShift(tenToSixArray,dateStr,[sixToSixNightArray,tenToSixArray],constraints)
        ])

        shiftTwo = {
            "shift":"8hr",
            "dayWorker":dayWorker,
            "afternoonWorker":afternoonWorker,
            "nightWorker":nightWorker,
        }
    }else{
        const [dayWorker,nightWorker] = await Promise.all([
            helperFuncs.setWorkerForShift(sixToSixDayArray,dateStr,[sixToTwoArray,twoToTenArray,sixToSixDayArray],constraints),
            helperFuncs.setWorkerForShift(sixToSixNightArray,dateStr,[tenToSixArray,twoToTenArray,sixToSixNightArray],constraints)
        ])

        shiftTwo = {
            "shift":"12hr",
            "dayWorker":dayWorker,
            "nightWorker":nightWorker
        }
    }
    return {"success":[shiftOne,shiftTwo]}
}

export function resetShifts(newWorker,newWorkerShift,oldWorker){
    const oldWorkerShift = oldWorker.getAttribute("shifttype")

    if (oldWorkerShift === "6am-2pm" || oldWorkerShift === "6am-6pm"){
        helperFuncs.setNewDayWorker(newWorkerShift,newWorker,oldWorker)
    }else if (oldWorkerShift === "2pm-10pm"){
        helperFuncs.setNewAfternoonWorker(newWorker,oldWorker)
    }else{
        helperFuncs.setNewNightWorker(newWorkerShift,newWorker,oldWorker)
    }
}

export function downloadRosterPdf(containerId,locationName,month,year){
    const container = document.getElementById(containerId)

    const options = {
        margin: 0.5,
        filename: `${locationName}-${month}-${year}-roster.pdf`,
        image: {type: "jpeg",quality: 0.98},
        html2canvas: {
            scale: 2,
            logging:true,
            useCORS: true
        },
        jsPDF: { unit : "in", format: "letter", orientation: "landscape"}
    };

    html2pdf().set(options).from(container).save();
}