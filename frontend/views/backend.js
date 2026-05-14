import { objectCheck } from "./general-helper-funcs.js";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1"]);
const BASEURL = LOCAL_HOSTS.has(window.location.hostname)
    ? `${window.location.origin}/`
    : "https://optiroster.onrender.com/";

//function to manage general api calls
async function apiRequest(endpoint, method = "GET", body = null){
    const url = `${BASEURL}${endpoint}`
    const options = {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
    };

    if (body){
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        const result = await response.json();
        if (!response.ok){
            throw new Error(result?.error || `Error: ${response.status} ${response.statusText}`)
        }

        return result
    }catch(error) {
        return { error: error.message }
    }
}
export async function getLocations() {
    return apiRequest("locations")
};

export async function addLocation(locationName) {
    const url = `locations/${encodeURIComponent(locationName)}`
    return apiRequest(url,"POST")
};

export async function findLocation(column,value){
    const url = `locations/${column}/${encodeURIComponent(value)}`
    return apiRequest(url)
}

export async function editLocation(currentLocationName,newLocationName){
    if (!currentLocationName || !newLocationName){
        return {"error":"Invalid params please provide both the current and new location names"}
    }

    let location = newLocationName

    const url = `edit-location/${encodeURIComponent(currentLocationName)}`
    return apiRequest(url,"PATCH",{location})
}

export async function addWorker(first_name,middle_name,last_name,gender,address,contact,age,id_number,availability,hours){
    const neededValuesArr = [first_name,last_name,gender,address,age,id_number,availability,hours]
    for (const value of neededValuesArr){
        if (!value){
            return {"error":"Vacant input for required field"}
        }
    }

    return apiRequest("workers/add-worker","POST",{
        first_name,last_name,middle_name,gender,address,contact,age,id_number,availability,hours
    })
}

export async function getWorkers(){
    return apiRequest("workers")
}

export async function findWorker(firstName="",lastName="",middleName="",idNumber="",id=null){
    const url = new URL(`${BASEURL}find-worker`)
    if (id) {
        url.searchParams.append("id",id)
    }else if(idNumber){
        url.searchParams.append("id_number",idNumber)
    }else{
        if (firstName) url.searchParams.append("first_name", firstName);
        if (lastName) url.searchParams.append("last_name", lastName);
        if (middleName) url.searchParams.append("middle_name", middleName);
    };

    const response = await fetch(url, { credentials: "include" })
    const data = await response.json()

    return data
}

export async function editWorker(
    idStr,first_name,last_name,middle_name,gender,address,contact,id_number,availability,hours
){
    let id
    try{
        id = parseInt(idStr)
    }catch{
        return {"error":"Invalid ID param, id needs to be a number"}
    }

    first_name = first_name ? first_name : null
    last_name = last_name ? last_name : null
    middle_name = middle_name ? middle_name : null
    gender = gender ? gender : null
    address = address ? address : null
    contact = contact ? contact : null
    id_number = id_number ? Number(id_number) : null
    availability = availability ?availability : null
    hours = hours ? hours : null

    const url = `edit-worker/${id}`

    return apiRequest(url,"PATCH",{
        first_name,last_name,middle_name,gender,address,contact,id_number,availability,hours
    })
}

export async function removeEntry(id,table){
    if (!id || !table)return {"error":"ID and Table required"}
    const url = `delete/${table}/${id}`
    return apiRequest(url,"DELETE")
}
export async function linkWorkerLocations(workerId,locationId){
    const url = `assign-location/${workerId}/${locationId}`
    return apiRequest(url,"POST")
}

export async function workerLocationSearch(column,id){
    const url = `get-worker-location-connections/${column}/${id}`
    return apiRequest(url)
}

export async function editConnection(idStr,worker_id=null,location_id=null){
    let id
    try{
        id = parseInt(idStr)
    }catch{
        return {"error":"Invalid ID param"}
    }

    if (!worker_id && !location_id){
        return {"error":"Either worker or location ids are required"}
    }

    const url = `edit-connection/${id}`
    return apiRequest(url,"PATCH",{
        location_id,worker_id
    })
}

export async function removeConnections(idStr="",worker_id="",location_id=""){
    let url = `remove-connection?`
    let id
    if (idStr){
        try{
            id = parseInt(idStr)
        }catch{
            return{"error":"Invalid ID Param"}
        }

        url += `id=${id}`
    }else if (worker_id && location_id){
        url += `worker_id=${worker_id}&location_id=${location_id}`
    }else if (worker_id){
        url += `worker_id=${worker_id}`
    }else{
        url += `location_id=${location_id}`
    }
    return apiRequest(url,"DELETE")
}
export async function createConstraint(worker1IdStr,worker2IdStr,note=""){
    let worker1_id,worker2_id
    try{
        worker1_id = parseInt(worker1IdStr)
        worker2_id = parseInt(worker2IdStr)
    }catch{
        return {"error":"Please Insert Valid Values"}
    }

    const check = await getConstraints("",worker2_id,worker1_id)
    if(!objectCheck(check)){
        return {"error":"Duplicate entry, constraint already exists"}
    }

    if (worker1_id === worker2_id){
        return {"error":"Constraint between the same worker cannot exist"}
    }

    return apiRequest("create-constraint","POST",{
        worker1_id,worker2_id,note
    })
}

export async function getConstraints(
    id=null,worker1Id=null,worker2Id=null,worker1FirstName=null,worker1LastName=null,worker2FirstName=null,worker2LastName=null
){
    let result
    const url = new URL(`${BASEURL}find-constraints`)
    if (worker1Id && worker2Id){
        url.searchParams.append("worker1_id",worker1Id)
        url.searchParams.append("worker2_id",worker2Id)
    }
    if (id){
        url.searchParams.append("id",id)
    }else {
        if (worker1FirstName){
            if (!worker1LastName)return {"error":"Both the firstname and the lastname is required"}
            url.searchParams.append("worker1_firstname",worker1FirstName)
            url.searchParams.append("worker1_lastname",worker1LastName)
        }
        if (worker2FirstName){
            if (!worker2LastName)return {"error":"Both the firstname and the lastname is required"}
            url.searchParams.append("worker2_firstname",worker2FirstName)
            url.searchParams.append("worker2_lastname",worker2LastName)
        }
    }
    result = await fetch(url, { credentials: "include" })
    const data = await result.json()

    return data
}

export async function editConstraints(id,worker1IdStr="",worker2IdStr="",note=""){ // working
    let worker1Id,worker2Id

    if (!id){
        return {"error":"Id required"}
    }    

    try{
        worker1Id = parseInt(worker1IdStr)
        worker2Id = parseInt(worker2IdStr)
    }catch{
        errorTag.innerText = "Invalid insertion values for input areas"
        return
    }

    if (worker1Id === worker2Id){
        return {"error":"Constraints must be created between two workers"}
    }

    if (!note)note = null

    const jsonValues = {}
    const inputValues = [
        {"worker1_id":worker1Id},
        {"worker2_id":worker2Id},
        {"note":note}
    ]

    for (const param of inputValues){
        for (const key in param){
            if (param[key]){
                jsonValues[key] = param[key]
            }
        }
    }

    const url = `edit-constraints/${id}`
    return apiRequest(url,"PATCH",jsonValues)
}

export async function deleteConstraints(id){
    if (!id)return {"error":"No parameter provided!"}

    const url = `delete-constraint/${id}`
    return apiRequest(url,"DELETE")
}

export async function addDaysOff(workerIdStr,start_date,end_date){
    let worker_id
    try{
        worker_id = parseInt(workerIdStr)
    }catch{
        return {"error":"Invalid worker id input"}
    }
    return apiRequest("add-days-off","POST",{
        worker_id,start_date,end_date
    })
}

export async function getDaysOff(column="",value=""){
    let url
    if (column && value){
        url = `${BASEURL}get-days-off/${column}/${value}`
    }else{
        url = `${BASEURL}get-days-off`
    }

    const results = await fetch(url, { credentials: "include" })
    const data = await results.json()

    return data
}

export async function removeDaysOff(breakId){
    const url = `remove-days/${breakId}`

    if (!breakId){
        return {"error":"Id required"}
    }

    return apiRequest(url,"DELETE")
}

export async function editDaysOff(idStr,worker_id,start_date,end_date){
    let id

    try{
        id = parseInt(idStr)
    }catch{
        return{"error":"Invalid ID param"}
    }

    const url = `edit-dayoff/${id}`

    worker_id = worker_id ? parseInt(worker_id) : null
    start_date = start_date ? start_date : null
    end_date = end_date ? end_date : null

    return apiRequest(url,"PATCH",{
        id,worker_id,start_date,end_date
    })
}

export async function createRestriction(worker_id,day_of_week,start_time,end_time){
    try{
        worker_id = parseInt(worker_id)
    }catch{
        return {"error":"Please provide a valid worker id"}
    }
    if (!day_of_week){
        day_of_week = "Any"
    }

    return apiRequest("create-restriction","POST",{
        worker_id,day_of_week,start_time,end_time
    })
}

export async function getPermanentRestrictions(){
    return apiRequest("get-restrictions")
}

export async function findPermanentRestrictions(column,id) {
    if (!column || !id){
        return {"error":"Please insert valid values"}
    }

    const url = `find-restriction/${column}/${id}`
    return apiRequest(url)
}

export async function deletePermanentRestrictions(id){
    if (!id){
        return {"error":"Please insert a valid id"}
    }

    const url = `delete-restriction/${id}`
    return apiRequest(url,"DELETE")
}

export async function editPermanentRestriction(restrictionId,worker_id,day_of_week,start_time,end_time){
    let id

    try{
        id = parseInt(restrictionId)
    }catch{
        return{"error":"Invalid ID parameter"}
    }

    const url = `edit-restriction/${id}`

    day_of_week = day_of_week ? day_of_week : null
    worker_id = worker_id ? parseInt(worker_id) : null
    start_time = start_time ? start_time : null
    end_time = end_time ? end_time : null

    return apiRequest(url,"PATCH",{
        id,worker_id,day_of_week,start_time,end_time
    })
}

export async function retrieveWorkerOrLocations(column,id){
    const url = `retrieve-workers-locations/${column}/${id}`
    return apiRequest(url)
}

export async function createOccupancy(worker_id,event_date,note){
    if (!worker_id || !event_date){
        return{"error":"Invalid Params"}
    }

    return apiRequest("create-occupancy","POST",{
        worker_id,event_date,note
    })
}

export async function retrieveOccupancies(event_date,worker_id,note){
    let url = "retrieve-occupancies"
    const params = []

    if (event_date){
        params.push(`event_date=${event_date}`)
    }
    if (worker_id){
        params.push(`worker_id=${worker_id}`)
    }
    if (note){
        params.push(`note=${note}`)
    }

    if (params.length > 0){
        url += ('?' + params.join("&"))
    }
    
    return apiRequest(url,"GET")
}

export async function removeOccupancy(id){
    if (!id)return {"error":"Please insert a valid ID"}

    return apiRequest(`delete-occupancy/${id}`,"DELETE")
}

export async function clearOccupancies(){
    return apiRequest("clear-occupancies","DELETE")
}

export async function  saveRoster(location_id,month,year){
    if (!location_id || !month || !year){
        return {"error":"Location ID, Month and Year required"}
    }

    location_id = parseInt(location_id)
    month = parseInt(month)
    year = parseInt(year)

    return apiRequest("save-roster","POST",{
        location_id,month,year
    })
}

export async function retrieveRosters(roster_id=null,location_id=null,month=null,year=null){
    let url = 'retrieve-rosters'
    const queryParams = []

    if (roster_id){
        url += `?roster_id=${roster_id}`
    }else{
        if (location_id){
            queryParams.push(`location_id=${location_id}`)
        }
        if (month){
            queryParams.push(`month=${month}`)
        }if (year){
            queryParams.push(`year=${year}`)
        }

        const newparams = queryParams.join("&")
        url+=`?${newparams}`
    }
    
    return apiRequest(url,"GET")
}

export async function editRoster(idStr,location_id,month,year){
    const id = parseInt(idStr)

    location_id = location_id ? location_id : null
    month = month ? month : null
    year = year ? year : null

    return apiRequest(`edit-roster/${id}`,"PATCH",{
        location_id,month,year
    })
}

export async function deleteRoster(id,location_id,month,year){
    let url = `delete-roster?`

    if (id){
        url += `roster_id=${id}`
    }else{
        const params = []
        if (location_id){
            params.push(`location_id=${location_id}`)
        }
        if (month){
            params.push(`month=${month}`)
        }if (year){
            params.push(`year=${year}`)
        }

        url += params.join("&")
    }

    return apiRequest(url,"DELETE")
}

export async function newRosterEntry(roster_id,worker_id,shift_date,shift_type){
    const verifiedShifts = ["6am-6pm","6pm-6am","6am-2pm","2pm-10pm","10pm-6am"]

    if (!verifiedShifts.includes(shift_type)){
        return {"error":"Invalid shift type"}
    }

    roster_id = parseInt(roster_id)
    worker_id = parseInt(worker_id)

    return apiRequest("roster-entry","POST",{
        roster_id,worker_id,shift_date,shift_type
    })
}

export async function retrieveRosterEntries(entry_id,roster_id,worker_id,shift_date,shift_type){
    let url = "retrieve-entry"

    if (entry_id){
        url += `?entry_id${entry_id}`
    }else{
        const params = []
        if (roster_id){
            params.push(`roster_id=${roster_id}`)
        }
        if (worker_id){
            params.push(`worker_id=${worker_id}`)
        }
        if (shift_date){
            params.push(`shift_date=${shift_date}`)
        }
        if (shift_type){
            params.push(`shift_type=${shift_type}`)
        }

        url += ('?' + params.join("&"))
    }

    return apiRequest(url,"GET")
}

export async function editRosterEntry(entry_id,roster_id,worker_id,shift_date,shift_type){
    if (!entry_id){
        return {"error":"Invalid entry ID"}
    }
    roster_id = roster_id ? roster_id : null
    worker_id = worker_id ? worker_id : null
    shift_date = shift_date ? shift_date : null
    shift_type = shift_type ? shift_type : null

    if (shift_type){
        const verifiedShifts = ["6am-6pm","6pm-6am","6am-2pm","2pm-10pm","10pm-6am"]

        if (!verifiedShifts.includes(shift_type)){
            return {"error":"Invalid shift type"}
        }
    }

    return apiRequest(`edit-entry/${entry_id}`,"PATCH",{
        roster_id,worker_id,shift_date,shift_type,shift_hours
    })
}

export async function deleteRosterEntry(entry_id,roster_id,worker_id,shift_date,shift_type){
    let url = "delete-entry?"

    if (entry_id){
        url += `entry_id=${entry_id}`
    }else{
        const params = []
        if (roster_id){
            params.push(`roster_id=${roster_id}`)
        }
        if (worker_id){
            params.push(`worker_id=${worker_id}`)
        }
        if (shift_date){
            params.push(`shift_date=${shift_date}`)
        }if (shift_type){
            params.push(`shift_type=${shift_type}`)
        }

        url += params.join("&")
    }

    return apiRequest(url,"DELETE")
}

export async function login(username,password){
    if (!username || !password){
        return {"error":"Username and Password required"}
    }

    return apiRequest("login","POST",{
        username,password
    })
}

export async function logout(){
    return apiRequest("logout","POST")
}

export async function createAccount(username,password){

    if (!username || !password){
        return {"error":"Password and username required"}
    }

    return apiRequest("create-account","POST",{
        username,password
    })
}

export async function editAccount(account_id,username,password){
    if (!account_id){
        return {"error":"Account Id required"}
    }

    username = username ? username : null
    password = password ? password : null

    return apiRequest(`edit-account/${account_id}`,"PATCH",{
        username,password
    })
}

export async function findAccount(username){
    if(!username){
        return{"error":"Username required"}
    }

    return apiRequest(`retrieve-account/${username}`,"GET")
}

export async function deleteAccount(account_id,username){
    let url = "delete-account"

    if (account_id){
        url += `?account_id=${account_id}`
    }else if (username){
        url += `?username=${username}`
    }

    return apiRequest(url,"DELETE")
}
