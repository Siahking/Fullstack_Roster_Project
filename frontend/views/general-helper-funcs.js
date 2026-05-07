//function which returns true if an object key includes error and false otherwise
export function objectCheck(object){
    if(Object.keys(object).includes("error"))return true
    return false
}

export function displayError(errorTagId,message){
    const errorTag = document.getElementById(errorTagId+"-tag")
    const errorContainer = document.getElementById(errorTagId+"-container")
    errorContainer.classList.remove("specified-hidden")
    errorTag.innerText = message

    setTimeout(() => {
        errorContainer.classList.add("specified-hidden")
        errorTag.innerText = ""
    }, 3000)
}

export function deleteConfirmation(item){
    const confirmation = confirm(`Are you sure you want to delete this ${item}? This action cannot be undone.`)
    return confirmation
}

export function displayOptions(inputTag,resultsContainer,valuesArr,key){ 
    const value = inputTag.value.toLowerCase() // in this case i want to display the location so i set the id of each button to use the location id and of course use the location name
    let matches

    resultsContainer.innerHTML = ""
    resultsContainer.classList.add("hidden")

    if (value){
        matches = valuesArr.filter(item=>item[key].toLowerCase().includes(value))
        matches.map(result=>{
            const item = document.createElement("p")
            item.setAttribute("id",`${result.id}-option`)
            item.classList.add("search-item")
            item.innerText = result.location
            item.addEventListener("click",()=>selectOption(inputTag,resultsContainer,`${result.location}`))
            resultsContainer.appendChild(item)
        })
        if (matches.length>0)resultsContainer.classList.remove("hidden")
    }
}

function selectOption(input,container,value){
    input.value = value
    container.classList.add("hidden")
}