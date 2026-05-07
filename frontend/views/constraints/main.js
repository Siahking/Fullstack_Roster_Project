import * as backendFuncs from "./functions.js"
import * as frontendFuncs from "./frontend.js"

const addConstraintBtn = document.getElementById("add-constraint-btn")
const addConstraintDiv = document.getElementById("add-constraint-div")
const findConstraintBtn = document.getElementById("find-constraint-btn")
const findConstraintDiv = document.getElementById("find-constraint-div")
const addConstraintForm = document.getElementById("add-constraint-form")
const findConstraintForm = document.getElementById("find-constraint-form")
const editBtn = document.getElementById("edit-constraint")
const editDiv = document.getElementById("edit-constraint-div")
const worker1Checkbox = document.getElementById("worker1-checkbox")
const worker2Checkbox = document.getElementById("worker2-checkbox")
const summaryCheckbox = document.getElementById("summary-checkbox")

backendFuncs.displayConstraints("")

addConstraintBtn.addEventListener("click",()=>
    frontendFuncs.toogleDiv(addConstraintDiv,[editDiv,findConstraintDiv])
)

findConstraintBtn.addEventListener("click",()=>
    frontendFuncs.toogleDiv(findConstraintDiv,[editDiv,addConstraintDiv])
)

editBtn.addEventListener("click",()=>
    frontendFuncs.toogleDiv(editDiv,[findConstraintDiv,addConstraintDiv])
)

addConstraintForm.addEventListener("submit",(event)=>{
    backendFuncs.addConstraint(event)
})

findConstraintForm.addEventListener("submit",(event)=>
    backendFuncs.findConstraint(event)
)

for (const checkbox of [worker1Checkbox,worker2Checkbox,summaryCheckbox]){
    checkbox.addEventListener("change",
        (event)=>frontendFuncs.toogleInputTags(event)
    )
}

editDiv.addEventListener("submit",(event)=>
    backendFuncs.changeConstraint(event)
)