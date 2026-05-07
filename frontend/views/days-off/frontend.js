const valueLabel = document.getElementById("value-label")
const editCheckboxIds = ["newWorkerId","newStartTime","newEndTime"]

editCheckboxIds.forEach(id=>{
    const checkbox = document.getElementById(id)
    const input = document.getElementById(id+ "-value")

    checkbox.addEventListener("click",(event)=>{
        if (event.target.checked){
            input.classList.remove("hidden")
        }else{
            input.classList.add("hidden")
        }
    })
})

export function toogleDivs(currentDiv,otherDivs){
    if (currentDiv.classList.contains("hidden")){
        currentDiv.classList.remove("hidden")
        otherDivs.forEach(div => {
            div.classList.add("hidden")
        });
    }else{
        currentDiv.classList.add("hidden")
    }
}

export function toogleCheckboxes(event){
    if (event.target.checked){
        valueLabel.classList.remove("hidden")
    }else{
        valueLabel.classList.add("hidden")
    }
}

export function toogleEditDivs(){

}