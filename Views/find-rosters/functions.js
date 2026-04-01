import * as apiFuncs from "../backend.js"

export async function loadRosters(){
    const container = document.getElementById("container")
    const dataRaw = localStorage.getItem("locationData")
    let data = JSON.parse(dataRaw)
    let rosters = []

    if (data.length === 0){
        rosters = await apiFuncs.retrieveRosters()
    }

    for (const value of data){
        const roster = await apiFuncs.retrieveRosters(value.rosterId)
        rosters.push(roster[0])
    }

    for (const [index,roster] of rosters.entries()){
        const [year,month] = [roster.year,roster.month]

        const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const date = new Date(year, month - 1, 1);
        const monthName = date.toLocaleString('en-US', { month: 'long' });
        const firstDayOfWeek = date.getDay();
        const daysInMonth = new Date(year, month, 0).getDate();
        const calendarContainer = document.createElement("div")
        const headerContainer = document.createElement("div")
        const locationNameContainer = document.createElement("div")
        locationNameContainer.classList.add("location-header-div")
        const locationName = document.createElement("h2")
        const deleteBtnContainer = document.createElement("div")
        deleteBtnContainer.setAttribute("id","save-roster-container")
        const deleteBtn = document.createElement("button")

        deleteBtn.setAttribute("id",`delete-btn-${roster.roster_id}`)
        deleteBtn.setAttribute("value",roster.roster_id)
        deleteBtn.classList.add("delete-btn")
        deleteBtn.innerText = "Delete Roster"
        deleteBtnContainer.appendChild(deleteBtn)

        deleteBtn.addEventListener("click",(event)=>deleteRosterHandler(event))

        locationName.innerText = `${data[index].location} - ${monthName} ${year}`
        locationNameContainer.appendChild(locationName)
        headerContainer.appendChild(locationNameContainer)

        calendarContainer.setAttribute("id",`${roster.location_id}-roster`)
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

        for (let day = 1; day <= daysInMonth; day++) {
            const date = `${year}-${month}-${day}`
            const dayCell = document.createElement("div");
            dayCell.className = "calendar-item calendar-day";

            // Create a span for the day number (top-right corner)
            const dayNumber = document.createElement("span");
            dayNumber.className = "day-number";
            dayNumber.textContent = day;

            // Create divs for shift blocks
            const [morningShiftBlock,eveningShiftBlock,nightShiftBlock] = await insertWorkers(roster.roster_id,date)

            dayCell.appendChild(dayNumber);
            dayCell.appendChild(morningShiftBlock);
            dayCell.appendChild(eveningShiftBlock);
            dayCell.appendChild(nightShiftBlock);

            calendarContainer.appendChild(dayCell)
        }
        container.appendChild(headerContainer)
        container.appendChild(calendarContainer)
        container.appendChild(deleteBtnContainer)
    }

}

async function insertWorkers(rosterId,rosterDate){
    console.log("passed here")

    const rosterData = await apiFuncs.retrieveRosterEntries("",rosterId,"",rosterDate,"")
    console.log(rosterId,rosterDate)

    const morningShiftBlock = document.createElement("div");
    morningShiftBlock.className = "shift-block shift-1";

    const eveningShiftBlock = document.createElement("div");
    eveningShiftBlock.className = "shift-block shift-2";

    const nightShiftBlock = document.createElement("div");
    nightShiftBlock.className = "shift-block shift-3";

    for (const worker of rosterData){
        const tag = document.createElement("p")
        switch(worker.shift_type){
            case "6am-6pm" :
            case "6am-2pm" :
                tag.innerText = `${worker.first_name[0]}.${worker.last_name}\n`
                tag.innerText += `(${worker.shift_type})`
                morningShiftBlock.appendChild(tag)
                break
            case "2pm-10pm":
                tag.innerText = `${worker.first_name[0]}.${worker.last_name}\n`
                tag.innerText += `(${worker.shift_type})`
                eveningShiftBlock.appendChild(tag)
                break
            case "6pm-6am" :
            case "10pm-6am":
                tag.innerText = `${worker.first_name[0]}.${worker.last_name}\n`
                tag.innerText += `(${worker.shift_type})`
                nightShiftBlock.appendChild(tag)
                break
        }
    }

    return [morningShiftBlock,eveningShiftBlock,nightShiftBlock]
}

async function deleteRosterHandler(event){
    const rosterId = event.target.value

    const results = await apiFuncs.deleteRoster(rosterId,"","","")

    sessionStorage.setItem("Message",results.message)
    window.location.href = "/home"
}