import * as apiFuncs from "../backend.js"
import { objectCheck } from "../general-helper-funcs.js"

/*function that checks to make sure there are enough workers for the shift of the current worker
before creating a new day off field input */
export async function validateCoverage(locationId, startDate, endDate, targetWorker){
    const workersForLocation = await apiFuncs.retrieveWorkerOrLocations("location_id",locationId)
    const daysOff = await apiFuncs.getDaysOff()
    const restrictions = await apiFuncs.getPermanentRestrictions()

    if (daysOff.error && restrictions.error)return {"success":"Empty DaysOff and restricions"}

    const dateCursor = new Date(startDate)
    const end = new Date(endDate)

    while (dateCursor <= end){
        const dayOfWeek = dateCursor.toLocaleDateString("en-US", { weekday: "long"})

        let availableWorkers = workersForLocation.filter(worker => {
            let isOff,isRestricted = false
            if (worker.id === targetWorker.id) return false

            //check if the current worker has any days off that include the current day cursor
            if (!daysOff.error){
                isOff = daysOff.some(off =>
                    off.worker_id === worker.id &&
                    new Date(off.start_date) <= dateCursor &&
                    new Date(off.end_date) >= dateCursor
                )
            }

            //check if the current worker has any restrictions set on that day
            if (!restrictions.error){
                isRestricted = restrictions.some(res =>
                    res.worker_id === worker.id && 
                    (res.day_of_week === "Any" || res.day_of_week === dayOfWeek)
                )
            }

            return !isOff && !isRestricted
        })

        let shiftWorkers = []

        if (targetWorker.availability === "Eclipse"){
            const shiftObject = {
                "6am-6pm": 0,
                "6pm-6am": 0,
                "6am-2pm": 0,
                "2pm-10pm": 0,
                "10pm-6am":0
            }

            for (const worker of availableWorkers){
                for (const hour of worker.hours){
                    if (shiftObject[hour] !== undefined){
                        shiftObject[hour]++
                    } 
                }
            }
            
            for (const count of Object.values(shiftObject)){
                if (count < 3) return {"error":shiftObject}
            }
        }else if (targetWorker.availability === "Specified"){
            return specifiedCheck(targetWorker, availableWorkers)
        }else{
            shiftWorkers = availableWorkers.filter(worker => worker.availability === targetWorker.availability)
            if (shiftWorkers.length < 3)return {"error":`Insufficient works for ${targetWorker.availability}`}
        }

        dateCursor.setDate(dateCursor.getDate()+1)
    }

    return {"success":"Sufficient workers for shifts"}
}

//function that checks for specific shifts
export function specifiedCheck(targetWorker, availableWorkers) {
    const shiftCount = {}

    // Count how many available workers are on each shift
    for (const worker of availableWorkers) {
        for (const hour of worker.hours) {
            if (!shiftCount[hour]) {
                shiftCount[hour] = 1
            } else {
                shiftCount[hour]++
            }
        }
    }

    // Check if all target shifts are covered by at least 3 workers
    for (const hour of targetWorker.hours) {
        if (!shiftCount[hour] || shiftCount[hour] < 3) {
            return {"error":`Insufficient workers for ${hour} `}
        }
    }

    return {"success":"Sufficient workers"}
}