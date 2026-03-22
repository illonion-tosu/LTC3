import { loadBeatmaps } from "../_shared/core/beatmaps.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Load Beatmaps
const roundNameTextEl = document.getElementById("round-name-text")
let allBeatmaps
Promise.all([loadBeatmaps()]).then(([beatmaps]) => {
    // Load beatmaps
    allBeatmaps = beatmaps.beatmaps
    roundNameTextEl.textContent = beatmaps.roundName
})

// Teams
const redTeamNameEl = document.getElementById("red-team-name")
const blueTeamNameEl = document.getElementById("blue-team-name")
let currentRedTeamName, currentBlueTeamName

// Socket
const socket = createTosuWsSocket()
socket.onmessage = event => {
    const data = JSON.parse(event.data)
    console.log(data)

    // Team Names
    if (currentRedTeamName !== data.tourney.team.left) {
        currentRedTeamName = data.tourney.team.left
        redTeamNameEl.textContent = currentRedTeamName
    }
    if (currentBlueTeamName !== data.tourney.team.right) {
        currentBlueTeamName = data.tourney.team.right
        blueTeamNameEl.textContent = currentBlueTeamName
    }
}