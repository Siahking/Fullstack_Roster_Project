import { removeConstraint } from "../constraints/functions.js"

const table = document.getElementById("table")

export async function displayConstraints(){
    const constraints = JSON.parse(localStorage.getItem("Constraints"));

    for(const constraint of constraints){
        const worker1Info = `${constraint.worker1_firstname} ${constraint.worker1_lastname}`
        const worker2Info = `${constraint.worker2_firstname} ${constraint.worker2_lastname}`

        const tableRow = document.createElement("tr")
        const IDData = document.createElement("td")
        const worker1Data = document.createElement("td")
        const worker2Data = document.createElement("td")
        const summaryData = document.createElement("td")
        const deleteBtn = document.createElement("button")

        deleteBtn.innerText = "Delete Constraint"
        deleteBtn.value = constraint.id
        deleteBtn.id = `deleteBtn-${constraint.id}`
        deleteBtn.classList.add("delete-btn")
        deleteBtn.addEventListener("click",(event)=>removeConstraint(event.target.value))

        IDData.innerText = constraint.id
        worker1Data.innerText = worker1Info
        worker2Data.innerText = worker2Info
        summaryData.innerText = constraint.note

        for (const value of [IDData,worker1Data,worker2Data,summaryData]){
            tableRow.appendChild(value)
        }
        tableRow.appendChild(deleteBtn)
        table.appendChild(tableRow)
    }
}