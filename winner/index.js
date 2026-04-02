import { getStarCount } from "../_shared/core/stars.js"
import { findTeam, loadTeams } from "../_shared/core/teams.js"
import { getCookie } from "../_shared/core/utils.js"

// Round Name
async function getBeatmaps() {
    const response = await fetch("../_data/beatmaps.json")
    const responseJson = await response.json()
    roundNameEl.innerText = responseJson.roundName
}
const roundNameEl = document.getElementById("round-name")
getBeatmaps()
loadTeams()

// Elements 
const winGradientEl = document.getElementById("win-gradient")
const teamNameEl = document.getElementById("team-name")
const playerNamesContainerEl = document.getElementById("player-names-container")
let redStarCount, blueStarCount, currentStarCount, previousStarCount
let currentWinningTeam, previousWinningTeam
setInterval(() => {
    currentStarCount = getStarCount()
    if (previousStarCount !== currentStarCount) {
        previousStarCount = currentStarCount
        redStarCount = Number(currentStarCount.redStarCount)
        blueStarCount = Number(currentStarCount.blueStarCount)

        // Set winner information
        if (redStarCount > blueStarCount) {
            winGradientEl.setAttribute("src", "static/win-gradient/green-win-gradient.png")
            currentWinningTeam = getCookie("leftTeamName")
        } else if (blueStarCount > redStarCount) {
            winGradientEl.setAttribute("src", "static/win-gradient/blue-win-gradient.png") 
            currentWinningTeam = getCookie("rightTeamName")
        }

        teamNameEl.textContent = currentWinningTeam

        // See if winning team is the same
        if (previousWinningTeam !== currentWinningTeam) {
            previousWinningTeam = currentWinningTeam
            findTeam(currentWinningTeam)

            // Set player details
            playerNamesContainerEl.innerHTML = ""
            playerNamesContainerEl.append(createDivElement(currentWinningTeam.team_player1))
            playerNamesContainerEl.append(createDivElement(currentWinningTeam.team_player2))
            if (currentWinningTeam.team_player3) {
                playerNamesContainerEl.append(createDivElement(currentWinningTeam.team_player3))
            }
        }
    }
}, 200)

// Create element
function createDivElement(text) {
    const div = document.createElement("div")
    div.textContent = text
    return div
}