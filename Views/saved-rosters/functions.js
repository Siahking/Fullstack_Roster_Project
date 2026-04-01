import * as apiFuncs from "../backend.js"
import { displayError, objectCheck } from "../general-helper-funcs.js"

const scrollToBottom = () => {
    window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" })
}

export async function saveRoster(errorTagId,LocationId,workersDetail){
    const successContainer = document.getElementById(`${LocationId}-success-container`)
    const MonthYear = workersDetail[0].getAttribute("monthyear")
    const [Month,Year] = MonthYear.split("-")

    const newRoster = await apiFuncs.saveRoster(LocationId,Month,Year)
    if (objectCheck(newRoster)){
        displayError(errorTagId,newRoster.error)
        scrollToBottom()
        return
    }
    const RosterResult = await apiFuncs.retrieveRosters("",LocationId,Month,Year)

    document.body.style.cursor = "wait"
    document.body.style.pointerEvents = "none"
    
    try{
        for (const workerDetail of workersDetail){
            const workerid = workerDetail.getAttribute("workerid")
            if (!workerid)continue
            const shiftType = workerDetail.getAttribute("shifttype")
            let day = workerDetail.getAttribute("day")
            const monthYear = workerDetail.getAttribute("monthyear")
            let [month,year] = monthYear.split("-")

            if (parseInt(month) < 10) month = `0${month}`
            if (parseInt(day) < 10)day = `0${day}`

            const createRosterResults = await apiFuncs.newRosterEntry(RosterResult[0].roster_id,workerid,`${year}-${month}-${day}`,shiftType)
            if(objectCheck(createRosterResults)){
                displayError(errorTagId,createRosterResults.error)
                successContainer.classList.add("specified-hidden")
                scrollToBottom()
                break
            }
        }
    }catch(error){
        console.log(error)
        return
    }finally{   
        document.body.style.cursor = "default"
        document.body.style.pointerEvents = "auto"

        successContainer.classList.remove("specified-hidden")
        scrollToBottom()
    }
}