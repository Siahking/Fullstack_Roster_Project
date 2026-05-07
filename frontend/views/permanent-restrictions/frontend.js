const findRestrictionDiv = document.getElementById("find-restriction-div")

const checkboxes = ["newWorkerCheckbox","dayOfWeekCheckbox","newStartTimeCheckbox","newEndTimeCheckbox"]
const removeStartLabel = document.getElementById("removeStartLabel")
const removeEndLabel = document.getElementById("removeEndLabel")

checkboxes.forEach(id=>{
    const checkbox = document.getElementById(id)
    const dayRadioBtns = document.querySelectorAll('[name="newDay"]')

    checkbox.addEventListener("click",(event)=>{
        let toogleTagId
        switch (event.target.id){
            case "newWorkerCheckbox":
                toogleTagId = "newWorker"
                break
            case "dayOfWeekCheckbox":
                toogleTagId = "dayOfWeekOptions"
                break
            case "newStartTimeCheckbox":
                toogleTagId = "newRestrictionStart"
                break
            case "newEndTimeCheckbox":
                toogleTagId = "newRestrictionEnd"
                break
        }

        const toogleTag = document.getElementById(toogleTagId)

        if (event.target.checked){
            toogleTag.classList.remove("hidden")
            if (event.target.id == "newStartTimeCheckbox")toogleTimeTags("newStartTimeCheckbox",true)
            else if (event.target.id == "newEndTimeCheckbox")toogleTimeTags("newEndTimeCheckbox",true)
        }else{
            toogleTag.classList.add("hidden")
            if (event.target.id === "dayOfWeekCheckbox"){
                dayRadioBtns.forEach(btn => btn.checked = false);
            }else if (event.target.id == "newStartTimeCheckbox")toogleTimeTags("newStartTimeCheckbox",false)
            else if (event.target.id == "newEndTimeCheckbox")toogleTimeTags("newEndTimeCheckbox",false)
        }

    })
})

export function toogleRestrictonDivs(currentDiv,otherDiv){
    if (currentDiv.classList.contains("hidden")){
        currentDiv.classList.remove("hidden")
        otherDiv.forEach(div => div.classList.add("hidden"));
        currentDiv.scrollIntoView({
            behavior: "smooth",
            block: "start"
        })
    }else{
        currentDiv.classList.add("hidden")
    }
}

function toogleTimeTags(tagId,display){
    if (display){
        if (tagId === "newStartTimeCheckbox"){
            removeStartLabel.classList.remove("hidden")
        }else{
            removeEndLabel.classList.remove("hidden")
        }
    }else{
        if (tagId === "newStartTimeCheckbox"){
            removeStartLabel.classList.add("hidden")
        }else{
            removeEndLabel.classList.add("hidden")
        }
    }
}

