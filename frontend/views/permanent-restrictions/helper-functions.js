import * as apiFuncs from "../backend.js"
import { specifiedCheck } from "../days-off/helper-functions.js"
import { objectCheck } from "../general-helper-funcs.js"

export default async function validateCoverage(locationId,day,workerId){
    const targetWorker = (await apiFuncs.findWorker("","","","",workerId))[0]
    const workersForLocation = await apiFuncs.retrieveWorkerOrLocations("location_id",locationId)
    const restrictions = await apiFuncs.getPermanentRestrictions()
    const emptyRestrictions = objectCheck(restrictions)

    const availableWorkers = workersForLocation.filter(worker => {
        if (worker.id === targetWorker.id) return false

        let isRestricted = false

        //check if the current worker has any restrictions set on that day
        if (!emptyRestrictions){
            isRestricted = restrictions.some(res =>
                res.worker_id === worker.id && 
                (res.day_of_week === "Any" || res.day_of_week === day)
            )
        }

        return  !isRestricted
    })


    //checks if the shift of the worker trying to set the restriction would be affected by the restriction
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
            if (count < 3) return false
        }
    }else if (targetWorker.availability === "Specified"){
        return specifiedCheck(targetWorker, availableWorkers)
    }else{
        const shiftWorkers = availableWorkers.filter(worker => worker.availability === targetWorker.availability)
        if (shiftWorkers.length < 3)return false
    }

    return true
}