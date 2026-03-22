import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Teams
const redTeamNameEl = document.getElementById("red-team-name")
const blueTeamNameEl = document.getElementById("blue-team-name")
let currentRedTeamName, currentBlueTeamName

// Socket
const socket = createTosuWsSocket()
socket.onmessage = event => {
    const data = JSON.parse(event.data)
    console.log(data)

    if (currentRedTeamName !== data.tourney.team.left) {
        currentRedTeamName = data.tourney.team.left
        redTeamNameEl.textContent = currentRedTeamName
    }
    if (currentBlueTeamName !== data.tourney.team.right) {
        currentBlueTeamName = data.tourney.team.right
        blueTeamNameEl.textContent = currentBlueTeamName
    }
}