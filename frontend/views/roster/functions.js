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

function escapeHtml(value) {
    return `${value ?? ""}`
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;")
}

function safePdfFilename(locationName, month, year) {
    const safeLocation = `${locationName}`
        .trim()
        .replace(/[^a-z0-9]+/gi, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase()

    return `${safeLocation || "location"}-${month}-${year}-roster.pdf`
}

function getShiftText(shiftBlock) {
    const clone = shiftBlock.cloneNode(true)
    clone.querySelectorAll("button").forEach(button => button.remove())

    return Array.from(clone.querySelectorAll("p"))
        .map(tag => {
            const workerName = tag.querySelector(".workerInfo")?.textContent || ""
            const shiftType = tag.querySelector(".shiftType")?.textContent || ""
            const combinedText = workerName || shiftType
                ? `${workerName} ${shiftType}`
                : tag.textContent

            return combinedText.replace(/\s+/g, " ").trim()
        })
        .filter(Boolean)
}

function buildShiftHtml(dayCell, shiftClass, label) {
    const shiftBlock = dayCell.querySelector(`.${shiftClass}`)
    if (!shiftBlock) return ""

    const workers = getShiftText(shiftBlock)
    if (workers.length === 0) return ""

    const workerHtml = workers
        .map(worker => `<div class="worker">${escapeHtml(worker)}</div>`)
        .join("")

    return `
        <div class="shift ${shiftClass}">
            <div class="shift-label">${escapeHtml(label)}</div>
            ${workerHtml}
        </div>
    `
}

function buildRosterPdfHtml(container, locationName, month, year) {
    const calendar = container.querySelector(".calendar-container")
    if (!calendar) return ""

    const date = new Date(year, month - 1, 1)
    const monthName = date.toLocaleString("en-US", { month: "long" })
    const headers = Array.from(calendar.querySelectorAll(".calendar-header"))
        .slice(0, 7)
        .map(header => header.textContent.trim())

    const cells = Array.from(calendar.children).slice(7)
    const rowHtml = []

    for (let index = 0; index < cells.length; index += 7) {
        const weekCells = cells.slice(index, index + 7)
        while (weekCells.length < 7) {
            const emptyCell = document.createElement("div")
            emptyCell.className = "empty-cell"
            weekCells.push(emptyCell)
        }

        const cellHtml = weekCells.map(dayCell => {
            if (dayCell.classList.contains("empty-cell")) {
                return "<td class=\"empty\"></td>"
            }

            const dayNumber = dayCell.querySelector(".day-number")?.textContent.trim() || ""
            return `
                <td>
                    <div class="day-number">${escapeHtml(dayNumber)}</div>
                    ${buildShiftHtml(dayCell, "shift-1", "Day")}
                    ${buildShiftHtml(dayCell, "shift-2", "Afternoon")}
                    ${buildShiftHtml(dayCell, "shift-3", "Night")}
                </td>
            `
        }).join("")

        rowHtml.push(`<tr>${cellHtml}</tr>`)
    }

    const headerHtml = headers
        .map(day => `<th>${escapeHtml(day)}</th>`)
        .join("")

    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <style>
                * {
                    box-sizing: border-box;
                }

                body {
                    font-family: Arial, sans-serif;
                    margin: 0;
                    color: #111;
                }

                h1 {
                    margin: 0 0 10px;
                    text-align: center;
                    font-size: 22px;
                }

                table {
                    width: 100%;
                    border-collapse: collapse;
                    table-layout: fixed;
                }

                th {
                    border: 1px solid #777;
                    background: #f0f0f0;
                    font-size: 13px;
                    padding: 5px;
                }

                td {
                    height: 108px;
                    border: 1px solid #999;
                    vertical-align: top;
                    padding: 4px;
                }

                td.empty {
                    background: #f7f7f7;
                }

                .day-number {
                    text-align: right;
                    font-weight: bold;
                    font-size: 12px;
                    margin-bottom: 3px;
                }

                .shift {
                    border: 1px solid #c8c8c8;
                    margin-bottom: 3px;
                    padding: 3px;
                    min-height: 24px;
                }

                .shift-1 {
                    background: #d9edf7;
                }

                .shift-2 {
                    background: #dff0d8;
                }

                .shift-3 {
                    background: #f2dede;
                }

                .shift-label {
                    font-size: 9px;
                    font-weight: bold;
                    text-transform: uppercase;
                    letter-spacing: 0;
                    margin-bottom: 2px;
                }

                .worker {
                    font-size: 10px;
                    line-height: 1.2;
                    margin-bottom: 2px;
                    word-break: break-word;
                }
            </style>
        </head>
        <body>
            <h1>${escapeHtml(locationName)} - ${escapeHtml(monthName)} ${escapeHtml(year)}</h1>
            <table>
                <thead>
                    <tr>${headerHtml}</tr>
                </thead>
                <tbody>
                    ${rowHtml.join("")}
                </tbody>
            </table>
        </body>
        </html>
    `
}

export async function downloadRosterPdf(containerId, locationName, month, year) {
    const container = document.getElementById(containerId)
    if (!container) {
        alert(`Roster container not found: ${containerId}`)
        return
    }

    const filename = safePdfFilename(locationName, month, year)
    const html = buildRosterPdfHtml(container, locationName, month, year)
    if (!html) {
        alert("Could not build roster PDF HTML")
        return
    }

    try {
        const response = await fetch("/create-pdf", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ html, filename })
        })

        if (!response.ok) {
            let message = "Could not create PDF"
            try {
                const data = await response.json()
                message = data.error || message
            } catch {
                message = await response.text()
            }
            alert(message)
            return
        }

        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")

        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    } catch (error) {
        alert(`Could not create PDF: ${error.message}`)
    }
}
