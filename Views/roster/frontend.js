import * as funcs from "./functions.js"
import * as apiFuncs from "../backend.js"
import { setLoadingContainer,filterWorkers } from "./helper-functions.js"
import { objectCheck } from "../general-helper-funcs.js"
import { saveRoster } from "../saved-rosters/functions.js"

export async function generateCalender(month,year){
    const scrollToElement = (element) => {
        if (element && typeof element.scrollIntoView === "function") {
            element.scrollIntoView({ behavior: "smooth", block: "start" })
        }
    }

    const [
        _clearOccupancies,daysOffResult,constraintsArray,restrictionsArray
    ] = await Promise.all([
        apiFuncs.clearOccupancies(),
        apiFuncs.getDaysOff(),
        apiFuncs.getConstraints(),
        apiFuncs.getPermanentRestrictions()
    ])

    await _clearOccupancies
    let constraints = {
        "worker1Constraints":{},
        "worker2Constraints":{}
    }
    let restrictions = {}
    const daysOff = !objectCheck(daysOffResult) ? daysOffResult : []

    if (!objectCheck(constraintsArray)){
        for (const constraint of constraintsArray){
            const worker1Key = constraint.worker1_id
            const worker2Key = constraint.worker2_id
            const generalData = {
                id:constraint.id,
                note:constraint.note
            }
            const worker1Data = {...generalData,...{worker2_id:constraint.worker2_id}}
            const worker2Data = {...generalData,...{worker1_id:constraint.worker1_id}}
            if (constraints.worker1Constraints[worker1Key]){
                constraints.worker1Constraints[worker1Key].push(worker1Data)         
            }else{
                constraints.worker1Constraints[worker1Key] = [worker1Data]
            }
            
            if (constraints.worker2Constraints[worker2Key]){
                constraints.worker2Constraints[worker2Key].push(worker2Data)
            }else{
                constraints.worker2Constraints[worker2Key] = [worker2Data]
            }
            
        }
    }
    if (!objectCheck(restrictionsArray)){  
        for (const restriction of restrictionsArray){
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
    
    const locations = JSON.parse(localStorage.getItem("Locations"))
    const container = document.getElementById("container")

    const locationFragment = document.createDocumentFragment();
    for (const location of locations){
        let errorFound = false
        const WORKERS = await apiFuncs.retrieveWorkerOrLocations("location_id",location.id)
        const headerContainer = document.createElement("div")
        headerContainer.classList.add("location-header-div")

        const locationName = document.createElement("h2")

        const locationErrorTag = document.createElement("p")
        locationErrorTag.classList.add("error-tag")

        const saveRosterBtn = document.createElement("button")
        saveRosterBtn.innerText = `Save ${location.location} Roster`
        saveRosterBtn.setAttribute("id",location.id)
        saveRosterBtn.classList.add("green-btn")

        const saveRosterContainer = document.createElement("div")
        saveRosterContainer.setAttribute("id","save-roster-container")
        
        const errorContainer = document.createElement("div")
        errorContainer.classList.add("specified-hidden","error-container")
        const successContainer = document.createElement("div")
        successContainer.setAttribute("id",`${location.id}-success-container`)
        successContainer.classList.add("specified-hidden","success-container")

        const errorTag = document.createElement("p")
        const successMessage = document.createElement("p")
        successMessage.innerText = "Roster saved successfully"
        successMessage.style.color = "green"
        successMessage.setAttribute("id",`${location.id}-message`)
        successContainer.appendChild(successMessage)
    
        saveRosterBtn.addEventListener("click",(event)=>{
            const locationId = event.target.id
            const errorTagId = `location-${location.id}-error`
            const workerDetails = document.querySelectorAll(`[name="${locationId}-workerDetails"]`)
            saveRoster(errorTagId,locationId,workerDetails)
        })

        saveRosterContainer.appendChild(saveRosterBtn)

        errorTag.setAttribute("id",`location-${location.id}-error-tag`)
        errorTag.classList.add("error-tag")

        errorContainer.setAttribute("id",`location-${location.id}-error-container`)
        errorContainer.appendChild(errorTag)

        const date = new Date(year, month - 1, 1);
        const monthName = date.toLocaleString('en-US', { month: 'long' });
        locationName.innerText = `${location.location} - ${monthName} ${year}`
        headerContainer.appendChild(locationName)
        if (objectCheck(WORKERS)){
            locationErrorTag.innerText = "No workers found for this Location"
            headerContainer.appendChild(locationErrorTag)
            locationFragment.appendChild(headerContainer)
            container.appendChild(locationFragment)
            scrollToElement(locationErrorTag)
            continue
        }

        const loadingContainer = setLoadingContainer()
        headerContainer.appendChild(loadingContainer)

        const calendarContainer = document.createElement("div")
        calendarContainer.classList.add("specified-hidden")
        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const firstDayOfWeek = date.getDay();
        const daysInMonth = new Date(year, month, 0).getDate();

        calendarContainer.setAttribute("id",`${location.location}-roster`)
        calendarContainer.classList.add("calendar-container")

        // Add day headers (Sunday, Monday, etc.)
        daysOfWeek.forEach(day => {
            const header = document.createElement("div");
            header.className = "calendar-item calendar-header";
            header.textContent = day;
            calendarContainer.appendChild(header);
        });

        // Create empty spaces before the first day of the month
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyCell = document.createElement("div");
            emptyCell.className = "calendar-item empty-cell";
            calendarContainer.appendChild(emptyCell);
        }

        // Add day numbers and shift blocks
        for (let day = 1; day <= daysInMonth; day++) {
            const dayCell = document.createElement("div");
            dayCell.className = "calendar-item calendar-day";
            dayCell.setAttribute("id",`${location.id}-day-${day}`)

            // Create a span for the day number (top-right corner)
            const dayNumber = document.createElement("span");
            dayNumber.className = "day-number";
            dayNumber.setAttribute("id",`day-number-`+day)
            dayNumber.textContent = day;

            // Create divs for shift blocks
            const morningShiftBlock = document.createElement("div");
            morningShiftBlock.className = "shift-block shift-1";

            const eveningShiftBlock = document.createElement("div");
            eveningShiftBlock.className = "shift-block shift-2";

            const nightShiftBlock = document.createElement("div");
            nightShiftBlock.className = "shift-block shift-3";

            const assignWorkerParams = {
                dayNumber:day,
                month:month,
                year:year,
                WORKERS:WORKERS,
                location:location,
                dayBlock:morningShiftBlock,
                afternoonBlock:eveningShiftBlock,
                nightBlock:nightShiftBlock,
                daysOff:daysOff,
                constraints:constraints
            }

            const results = await funcs.assignWorkers(assignWorkerParams)
            if (objectCheck(results)){
                errorFound = true
                locationErrorTag.innerText = results.error
                headerContainer.appendChild(locationErrorTag)
                loadingContainer.classList.add("specified-hidden")
                locationFragment.appendChild(headerContainer)
                break
            } else if(Object.keys(results).includes("Insufficient Workers")){
                errorFound = true
                locationErrorTag.innerText = "Insufficient Workers for shifts:"
                const unorderedList = document.createElement("ul")
                for (const location of results["Insufficient Workers"]){
                    const li = document.createElement("li")
                    li.innerText = location
                    unorderedList.appendChild(li)
                }
                headerContainer.appendChild(locationErrorTag)
                headerContainer.appendChild(unorderedList)
                loadingContainer.classList.add("specified-hidden")
                locationFragment.appendChild(headerContainer)
                break
            }

            // Append elements inside the day cell
            dayCell.appendChild(dayNumber);
            dayCell.appendChild(morningShiftBlock);
            dayCell.appendChild(eveningShiftBlock);
            dayCell.appendChild(nightShiftBlock);

            calendarContainer.appendChild(dayCell);

            container.appendChild(headerContainer)
            container.appendChild(calendarContainer)
        }
        if (errorFound){
            container.appendChild(locationFragment)
            scrollToElement(locationErrorTag)
            continue
        }
        calendarContainer.classList.remove("specified-hidden")
        loadingContainer.classList.add("specified-hidden")

        locationFragment.appendChild(headerContainer)
        locationFragment.appendChild(calendarContainer)
        locationFragment.appendChild(saveRosterContainer)
        locationFragment.appendChild(successContainer)
        locationFragment.appendChild(errorContainer)
        container.appendChild(locationFragment)

        // Scroll to the finished roster for this location.
        scrollToElement(calendarContainer)
    }
}

export async function adjustEditDiv(event){
    const editBtn = event.target;
    const editDivId = editBtn.id.replace("-editBtn","-editDiv")

    const dropDownContainers = document.getElementsByClassName("dropDownContainer")
    for (const container of dropDownContainers){
        container.parentNode.removeChild(container)
        if (container.getAttribute("id") === editDivId){
            return
        }
    }

    //gather relevant data to display worker options
    const oldWorkerContainer = editBtn.closest(".calendar-item")
    const oldWorker = editBtn.closest(".workerContainer")
    const currentWorkerId = oldWorker.getAttribute("workerid")
    const locationId = oldWorker.getAttribute("locationid")
    const dayNumber = oldWorker.getAttribute("day")
    const shiftType = oldWorker.getAttribute("shifttype")
    const [month,year] = oldWorker.getAttribute("monthyear").split("-")
    const date = `${year}-${month}-${dayNumber}`
    const dayCell = document.getElementById(`${locationId}-day-${dayNumber}`)
    const dateWorkersCells = Array.from(dayCell.querySelectorAll(".workerContainer"))

    const dateWorkers = {}
    for (const value of ["6am-6pm","6am-2pm","2pm-10pm","10pm-6am","6pm-6am"]){
        dateWorkers[value] = dateWorkersCells
        .filter(cell => cell.getAttribute("shifttype") === value)
        .map(cell => cell.getAttribute("workerid"))
        .filter(id => id !== null)
    }
    
    const otherWorkers = Array.from(document.getElementsByClassName(`${dayNumber}-${locationId}-worker`))
        .map(div => div.getAttribute("workerid"))
        .filter(workerId => workerId && workerId !== currentWorkerId);

    if (!oldWorker)return;

    const dropDownContainer = document.createElement("div")
    dropDownContainer.setAttribute("id",editDivId)
    dropDownContainer.classList.add("dropDownContainer")

    const paramsObject = {
        dateWorkers:dateWorkers,
        oldWorker:oldWorker,
        oldWorkerContainer:oldWorkerContainer,
        workerId:currentWorkerId,
        shiftType:shiftType,
        locationId:locationId,
        date:date,
        otherWorkers:otherWorkers,
        dropDownContainer:dropDownContainer
    }

    selectShift(paramsObject)

    const rect = editBtn.getBoundingClientRect();
    dropDownContainer.style.top = `${window.scrollY + rect.bottom + 5}px`;
    dropDownContainer.style.left = `${window.scrollX + rect.left}px`;

    document.body.appendChild(dropDownContainer)
}

function selectShift(paramObject){
    //gather relevant data to display worker options

    const shiftSelect = document.createElement("select")
    shiftSelect.id = "shift-select"

    // Add a real placeholder
    const placeholder = document.createElement("option");
    placeholder.textContent = "Select a new Shift Option";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.value = "";
    shiftSelect.appendChild(placeholder);

    // Build options
    const options = {
        "6am-6pm": ["6am-6pm", "6am-2pm"],
        "6am-2pm": ["6am-6pm", "6am-2pm"],
        "2pm-10pm": ["2pm-10pm"],
        "10pm-6am": ["10pm-6am", "6pm-6am"],
        "6pm-6am": ["10pm-6am", "6pm-6am"],
    };

    (options[paramObject.shiftType] || []).forEach(shift => {
        const opt = document.createElement("option");
        opt.value = shift;
        opt.textContent = shift;
        shiftSelect.appendChild(opt);
    });

    // Listen for selection
    shiftSelect.addEventListener("change",async function (event) {
        const selected = event.target.value;
        paramObject["selectedShift"] = selected

        await selectWorker(paramObject)
    });

    paramObject.dropDownContainer.appendChild(shiftSelect)
}

async function selectWorker(paramObject){
    const date = paramObject.date
    const locationId = paramObject.locationId
    const selectedShift = paramObject.selectedShift
    const workerId = paramObject.workerId
    const otherWorkers = paramObject.otherWorkers
    const dropDownContainer = paramObject.dropDownContainer
    const oldWorker = paramObject.oldWorker
    let coworker
    const oldWorkerDivId = oldWorker.getAttribute("id")
    if (oldWorkerDivId[oldWorkerDivId.length-1] === "1"){
        coworker = document.getElementById(oldWorkerDivId.slice(0,-1) + "2")
    }else{
        coworker = document.getElementById(oldWorkerDivId.slice(0,-1) + "1")
    }

    const coworkerId = coworker ? coworker.getAttribute("workerid") : null

    let workerSelect = document.getElementById("worker-select")
    if (workerSelect){
        workerSelect.parentNode.removeChild(workerSelect)
    }

    const availableWorkers = await filterWorkers(workerId,selectedShift,locationId,date,otherWorkers,[coworkerId,workerId])

    workerSelect = document.createElement("select")
    workerSelect.id = "worker-select"

    const placeholder = document.createElement("option");
    placeholder.textContent = "Select Worker to exchange with:";
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.value = "";
    workerSelect.appendChild(placeholder);

    for (const worker of availableWorkers){
        const option = document.createElement("option")
        option.value = worker.id
        option.textContent = `${worker.first_name[0]}.${worker.last_name}`
        workerSelect.appendChild(option)
    }

    let selectorContainer = document.getElementById("selectorContainer")
    if(!selectorContainer){
        selectorContainer = document.createElement("div")
        selectorContainer.setAttribute("id","selectorContainer")
        selectorContainer.appendChild(workerSelect)
        dropDownContainer.appendChild(selectorContainer)
    }else{
        selectorContainer.innerHTML = ""
        selectorContainer.appendChild(workerSelect)
    }

    let submitBtn = document.getElementById("submitBtn")
    if (!submitBtn){
        submitBtn = document.createElement("button")
        submitBtn.textContent = "Done"
        submitBtn.setAttribute("id","submitBtn")
        submitBtn.addEventListener("click",async ()=>{
            const selectedWorker = document.getElementById("worker-select").value
            const newWorker = await apiFuncs.findWorker("","","","",selectedWorker)
            funcs.resetShifts(newWorker[0],selectedShift,oldWorker)
            paramObject.dropDownContainer.parentNode.removeChild(paramObject.dropDownContainer)

        })
        dropDownContainer.appendChild(document.createElement("br"))
        dropDownContainer.appendChild(submitBtn)
    }
}