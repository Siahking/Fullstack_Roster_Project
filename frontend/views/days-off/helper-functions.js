import * as apiFuncs from "../backend.js"
import { objectCheck } from "../general-helper-funcs.js"

const MIN_WORKERS_PER_SHIFT = 3
const SHIFT_TIMES = {
    "6am-6pm": [6, 18],
    "6pm-6am": [18, 6],
    "6am-2pm": [6, 14],
    "2pm-10pm": [14, 22],
    "10pm-6am": [22, 6]
}

function parseDate(dateString) {
    const [year, month, day] = dateString.split("-").map(Number)
    return new Date(year, month - 1, day)
}

function formatDate(date) {
    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, "0")
    const day = `${date.getDate()}`.padStart(2, "0")

    return `${year}-${month}-${day}`
}

function emptyResult(result) {
    return objectCheck(result) ? [] : result
}

function getWorkerId(worker) {
    return Number(worker.id)
}

function datesOverlap(startDate, endDate, targetDate) {
    return parseDate(startDate) <= targetDate && parseDate(endDate) >= targetDate
}

function dayMatchesRestriction(restriction, dayOfWeek) {
    return restriction.day_of_week === "Any" || restriction.day_of_week === dayOfWeek
}

function timeToHour(timeValue) {
    if (!timeValue) return null
    return Number(timeValue.split(":")[0])
}

function splitInterval(start, end) {
    if (start === null || end === null) return [[0, 24]]
    if (start === end) return [[0, 24]]
    if (end > start) return [[start, end]]

    return [[start, 24], [0, end]]
}

function intervalsOverlap(firstStart, firstEnd, secondStart, secondEnd) {
    const firstIntervals = splitInterval(firstStart, firstEnd)
    const secondIntervals = splitInterval(secondStart, secondEnd)

    return firstIntervals.some(([aStart, aEnd]) =>
        secondIntervals.some(([bStart, bEnd]) => aStart < bEnd && bStart < aEnd)
    )
}

function restrictionBlocksShift(restriction, dayOfWeek, shift) {
    if (!dayMatchesRestriction(restriction, dayOfWeek)) return false
    if (!restriction.start_time || !restriction.end_time) return true
    if (!shift || !SHIFT_TIMES[shift]) return true

    const [shiftStart, shiftEnd] = SHIFT_TIMES[shift]
    return intervalsOverlap(
        timeToHour(restriction.start_time),
        timeToHour(restriction.end_time),
        shiftStart,
        shiftEnd
    )
}

function isWorkerRestricted(workerId, restrictions, dayOfWeek, shift = null) {
    return restrictions.some(restriction =>
        Number(restriction.worker_id) === Number(workerId) &&
        restrictionBlocksShift(restriction, dayOfWeek, shift)
    )
}

function isWorkerOff(workerId, daysOff, targetDate) {
    return daysOff.some(off =>
        Number(off.worker_id) === Number(workerId) &&
        datesOverlap(off.start_date, off.end_date, targetDate)
    )
}

function isWorkerOccupied(workerId, occupancies, dateString) {
    return occupancies.some(occupancy =>
        Number(occupancy.worker_id) === Number(workerId) &&
        occupancy.event_date.split("T")[0] === dateString
    )
}

function areConstrained(workerId, otherWorkerId, constraints) {
    return constraints.some(constraint =>
        (Number(constraint.worker1_id) === Number(workerId) && Number(constraint.worker2_id) === Number(otherWorkerId)) ||
        (Number(constraint.worker2_id) === Number(workerId) && Number(constraint.worker1_id) === Number(otherWorkerId))
    )
}

function hasCompatibleGroup(workers, constraints, requiredCount = MIN_WORKERS_PER_SHIFT) {
    if (workers.length < requiredCount) return false

    function search(group, startIndex) {
        if (group.length === requiredCount) return true

        for (let index = startIndex; index < workers.length; index++) {
            const candidate = workers[index]
            const hasConflict = group.some(worker =>
                areConstrained(getWorkerId(worker), getWorkerId(candidate), constraints)
            )

            if (!hasConflict && search([...group, candidate], index + 1)) {
                return true
            }
        }

        return false
    }

    return search([], 0)
}

function workerCanCoverShift(worker, shift) {
    return worker.hours.includes(shift) || worker.hours.includes("24hrs")
}

async function loadCoverageContext(locationId) {
    const [workersForLocation, daysOffResult, restrictionsResult, constraintsResult, occupanciesResult] = await Promise.all([
        apiFuncs.retrieveWorkerOrLocations("location_id", locationId),
        apiFuncs.getDaysOff(),
        apiFuncs.getPermanentRestrictions(),
        apiFuncs.getConstraints(),
        apiFuncs.retrieveOccupancies()
    ])

    if (objectCheck(workersForLocation)) {
        return { error: workersForLocation.error }
    }

    return {
        workersForLocation,
        daysOff: emptyResult(daysOffResult),
        restrictions: emptyResult(restrictionsResult),
        constraints: emptyResult(constraintsResult),
        occupancies: emptyResult(occupanciesResult)
    }
}

function getAvailableWorkersForDate(context, targetWorker, targetDate, shift = null, availability = null) {
    const dateString = formatDate(targetDate)
    const dayOfWeek = targetDate.toLocaleDateString("en-US", { weekday: "long" })

    return context.workersForLocation.filter(worker => {
        const workerId = getWorkerId(worker)

        if (workerId === getWorkerId(targetWorker)) return false
        if (availability && worker.availability !== availability) return false
        if (shift && !workerCanCoverShift(worker, shift)) return false
        if (isWorkerOff(workerId, context.daysOff, targetDate)) return false
        if (isWorkerOccupied(workerId, context.occupancies, dateString)) return false
        if (isWorkerRestricted(workerId, context.restrictions, dayOfWeek, shift)) return false

        return true
    })
}

function validateShiftPool(context, workers, errorMessage) {
    if (!hasCompatibleGroup(workers, context.constraints)) {
        return { error: errorMessage }
    }

    return null
}

/* Function that checks there are enough workers for the target worker's shifts
before creating a new days-off entry. */
export async function validateCoverage(locationId, startDate, endDate, targetWorker) {
    const context = await loadCoverageContext(locationId)
    if (context.error) return context

    const dateCursor = parseDate(startDate)
    const end = parseDate(endDate)

    while (dateCursor <= end) {
        if (targetWorker.availability === "Eclipse") {
            for (const shift of Object.keys(SHIFT_TIMES)) {
                const shiftWorkers = getAvailableWorkersForDate(context, targetWorker, dateCursor, shift)
                const error = validateShiftPool(context, shiftWorkers, `Insufficient workers for ${shift}`)
                if (error) return error
            }
        } else if (targetWorker.availability === "Specified") {
            const result = specifiedCheck(
                targetWorker,
                getAvailableWorkersForDate(context, targetWorker, dateCursor),
                context.constraints
            )
            if (result.error) return result
        } else {
            const shiftWorkers = getAvailableWorkersForDate(context, targetWorker, dateCursor, null, targetWorker.availability)
            const error = validateShiftPool(context, shiftWorkers, `Insufficient workers for ${targetWorker.availability}`)
            if (error) return error
        }

        dateCursor.setDate(dateCursor.getDate() + 1)
    }

    return {"success":"Sufficient workers for shifts"}
}

export function specifiedCheck(targetWorker, availableWorkers, constraints = []) {
    const shiftWorkers = {}

    for (const worker of availableWorkers) {
        for (const hour of worker.hours) {
            if (!shiftWorkers[hour]) {
                shiftWorkers[hour] = []
            }

            shiftWorkers[hour].push(worker)
        }
    }

    for (const hour of targetWorker.hours) {
        if (!shiftWorkers[hour] || !hasCompatibleGroup(shiftWorkers[hour], constraints)) {
            return {"error":`Insufficient workers for ${hour}`}
        }
    }

    return {"success":"Sufficient workers"}
}

function getPermanentCoverageDates(day, daysOff, occupancies) {
    const dates = new Set()
    const today = new Date()

    for (let offset = 0; offset < 14; offset++) {
        const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset)
        const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" })
        if (day === "Any" || dayOfWeek === day) {
            dates.add(formatDate(date))
        }
    }

    for (const off of daysOff) {
        const cursor = parseDate(off.start_date)
        const end = parseDate(off.end_date)

        while (cursor <= end) {
            const dayOfWeek = cursor.toLocaleDateString("en-US", { weekday: "long" })
            if (day === "Any" || dayOfWeek === day) {
                dates.add(formatDate(cursor))
            }
            cursor.setDate(cursor.getDate() + 1)
        }
    }

    for (const occupancy of occupancies) {
        const date = parseDate(occupancy.event_date.split("T")[0])
        const dayOfWeek = date.toLocaleDateString("en-US", { weekday: "long" })
        if (day === "Any" || dayOfWeek === day) {
            dates.add(formatDate(date))
        }
    }

    return Array.from(dates).sort()
}

function getAffectedShifts(targetWorker, startTime, endTime) {
    if (!startTime || !endTime) return null

    const targetShifts = targetWorker.availability === "Eclipse"
        ? Object.keys(SHIFT_TIMES)
        : targetWorker.hours.filter(hour => SHIFT_TIMES[hour])

    const restrictionStart = timeToHour(startTime)
    const restrictionEnd = timeToHour(endTime)

    return targetShifts.filter(shift => {
        const [shiftStart, shiftEnd] = SHIFT_TIMES[shift]
        return intervalsOverlap(restrictionStart, restrictionEnd, shiftStart, shiftEnd)
    })
}

export async function validatePermanentCoverage(locationId, day, targetWorker, startTime = "", endTime = "") {
    const context = await loadCoverageContext(locationId)
    if (context.error) return context

    const affectedShifts = getAffectedShifts(targetWorker, startTime, endTime)
    if (affectedShifts && affectedShifts.length === 0) {
        return {"success":"Restriction does not overlap this worker's shifts"}
    }

    const dates = getPermanentCoverageDates(day, context.daysOff, context.occupancies)

    for (const dateString of dates) {
        const targetDate = parseDate(dateString)

        if (affectedShifts) {
            for (const shift of affectedShifts) {
                const shiftWorkers = getAvailableWorkersForDate(context, targetWorker, targetDate, shift)
                const error = validateShiftPool(context, shiftWorkers, `Insufficient workers for ${shift} on ${dateString}`)
                if (error) return error
            }
            continue
        }

        if (targetWorker.availability === "Eclipse") {
            for (const shift of Object.keys(SHIFT_TIMES)) {
                const shiftWorkers = getAvailableWorkersForDate(context, targetWorker, targetDate, shift)
                const error = validateShiftPool(context, shiftWorkers, `Insufficient workers for ${shift} on ${dateString}`)
                if (error) return error
            }
        } else if (targetWorker.availability === "Specified") {
            const result = specifiedCheck(
                targetWorker,
                getAvailableWorkersForDate(context, targetWorker, targetDate),
                context.constraints
            )
            if (result.error) return {"error":`${result.error} on ${dateString}`}
        } else {
            const shiftWorkers = getAvailableWorkersForDate(context, targetWorker, targetDate, null, targetWorker.availability)
            const error = validateShiftPool(context, shiftWorkers, `Insufficient workers for ${targetWorker.availability} on ${dateString}`)
            if (error) return error
        }
    }

    return {"success":"Sufficient workers for permanent restriction"}
}
