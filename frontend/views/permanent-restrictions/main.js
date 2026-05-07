import * as funcs from './functions.js'
import * as frontend from "./frontend.js"

const addRestrictionBtn = document.getElementById("add-restriction-btn")
const findRestrictionBtn = document.getElementById("find-restriction-btn")
const editRestrictionBtn = document.getElementById("edit-restriction-btn")
const addRestrictionDiv = document.getElementById("add-restriction-div")
const findRestrictionDiv = document.getElementById("find-restriction-div")
const editRestrictionDiv = document.getElementById("edit-restriction-div")
const addRestrictionForm = document.getElementById("add-restriction-form")
const findRestrictionForm = document.getElementById("find-restriction-form")
const editRestrictionForm = document.getElementById("edit-restriction-form")

funcs.displayRestrictions()

findRestrictionBtn.addEventListener("click",()=>
    frontend.toogleRestrictonDivs(findRestrictionDiv,[addRestrictionDiv,editRestrictionDiv])
)

addRestrictionBtn.addEventListener("click",()=>
    frontend.toogleRestrictonDivs(addRestrictionDiv,[findRestrictionDiv,editRestrictionDiv])
)

editRestrictionBtn.addEventListener("click",()=>
    frontend.toogleRestrictonDivs(editRestrictionDiv,[addRestrictionDiv,findRestrictionDiv])
)

addRestrictionForm.addEventListener("submit",(event)=>{
    funcs.addRestriction(event)
})

findRestrictionForm.addEventListener("submit",(event)=>{
    funcs.findRestriction(event)
})

editRestrictionForm.addEventListener("submit",(event)=>{
    funcs.editRestriction(event)
})

