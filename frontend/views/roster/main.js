import * as frontend from "./frontend.js"

const date = JSON.parse(localStorage.getItem("Date"))

frontend.generateCalender(date.month,date.year)