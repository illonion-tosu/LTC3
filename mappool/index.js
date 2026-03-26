import { updateChat } from "../_shared/core/chat.js"
import { isStarOn, setDefaultStarCount, toggleStars, updateStarCount } from "../_shared/core/stars.js"
import { createTosuWsSocket } from "../_shared/core/websocket.js"

// Team Stars
const leftTeamStarContainerEl = document.getElementById("red-star-container")
const rightTeamStarContainerEl = document.getElementById("blue-star-container")

// Get Beatmaps
const roundNameEl = document.getElementById("round-name")
const sidebarMappoolContainerEl = document.getElementById("sidebar-mappool-container")
const preloadImagesEl = document.getElementById("preload-images")
let currentBestOf, currentFirstTo
let allBeatmaps, currentMap
/**
 * Get all beatmaps from the beatmaps.json file
 * Set the round name
 * Set the best of and first to
 * Create panels
 * Call create star display function
 * Create sidebar mappool buttons
 */
async function getBeatmaps() {
    const response = await fetch("../_data/beatmaps.json")
    const responseJson = await response.json()
    allBeatmaps = responseJson.beatmaps
    roundNameEl.innerText = responseJson.roundName

    switch (responseJson.roundName) {
        case "Round of 32": case "Round of 16":
            currentBestOf = 9; break;
        case "Quarterfinals": case "Semifinals":
            currentBestOf = 11; break;
        case "Finals": case "Grand Finals":
            currentBestOf = 13; break;
    }
    currentFirstTo = Math.ceil(currentBestOf / 2)

    setDefaultStarCount(currentBestOf, leftTeamStarContainerEl, rightTeamStarContainerEl)

    for (let i = 0; i < currentFirstTo - 1; i++) {
        createTeamPickWrapper("left")
        createTeamPickWrapper("right")
    }

    function createTeamPickWrapper(side) {
        const teamPickWrapper = document.createElement("div")
        teamPickWrapper.classList.add("team-pick-wrapper")
        teamPickWrapper.style.backgroundImage = `url("static/map-card-background/map-card-background-${currentBestOf}.png")`
        
        const teamPickBackgroundImage = document.createElement("div")
        teamPickBackgroundImage.classList.add("team-pick-background-image")

        const teamPickBackgroundOverlay = document.createElement("div")
        teamPickBackgroundOverlay.classList.add("team-pick-background-overlay")

        const teamPickOutline = document.createElement("div")
        teamPickOutline.classList.add("team-pick-outline")

        const teamPickWinnerCrown = document.createElement("img")
        teamPickWinnerCrown.classList.add("team-pick-winner-crown")

        const teamPickWinnerOverlay = document.createElement("img")
        teamPickWinnerOverlay.classList.add("team-pick-winner-overlay")

        const teamPickModId = document.createElement("div")
        teamPickModId.classList.add("team-pick-mod-id")

        const teamPickMapCardBorder = document.createElement("img")
        teamPickMapCardBorder.classList.add("team-pick-map-card-border")
        teamPickMapCardBorder.setAttribute("src", `static/map-card-border/map-card-border-${currentBestOf}.png`)

        teamPickWrapper.append(teamPickBackgroundImage, teamPickBackgroundOverlay, teamPickOutline, teamPickWinnerCrown,
            teamPickWinnerOverlay, teamPickModId, teamPickMapCardBorder)
        document.getElementById(`${side}-team-pick-container`).append(teamPickWrapper)
    }

    for (let i = 0; i < allBeatmaps.length; i++) {
        preloadImagesEl.setAttribute("srx", `https://assets.ppy.sh/beatmaps/${allBeatmaps[i].beatmapset_id}/covers/cover.jpg`)
        const button = document.createElement("button")
        button.innerText = `${allBeatmaps[i].mod}${allBeatmaps[i].order}`
        button.setAttribute("id", allBeatmaps[i].beatmap_id)
        button.dataset.id = allBeatmaps[i].beatmap_id
        button.dataset.pickTeam = "false"
        button.dataset.banTeam = "false"
        button.addEventListener("mousedown", mapClickEvent)
        button.addEventListener("contextmenu", event => event.preventDefault())
        sidebarMappoolContainerEl.append(button)
    }
}
getBeatmaps()

// Find beatmap
const findBeatmapById = beatmapId => allBeatmaps.find(beatmap => Number(beatmap.beatmap_id) === Number(beatmapId))

// Create Ban Wrapper
function createBanWrapper(currentMap, currentContainer) {
    const teamBanWrapper = document.createElement("div")
    teamBanWrapper.classList.add("team-ban-wrapper")
    teamBanWrapper.dataset.id = currentMap.beatmap_id

    const teamBanBackgroundImage = document.createElement("div")
    teamBanBackgroundImage.classList.add("team-ban-background-image")
    teamBanBackgroundImage.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`

    const teamBanModId = document.createElement("team-ban-mod-id")
    teamBanModId.classList.add("team-ban-mod-id")
    teamBanModId.innerText = `${currentMap.mod}${currentMap.order}`

    teamBanWrapper.append(teamBanBackgroundImage, teamBanModId)
    currentContainer.append(teamBanWrapper)
}

// Team Ban Container
const leftTeamBanContainerEl = document.getElementById("left-team-ban-container")
const rightTeamBanContainerEl = document.getElementById("right-team-ban-container")
// Team Pick Container
const leftTeamPickContainerEl = document.getElementById("left-team-pick-container")
const rightTeamPickContainerEl = document.getElementById("right-team-pick-container")
let currentPickTile, currentPickMap
// Map Click Event
function mapClickEvent(event) {
    // Find map
    const currentMapId = this.dataset.id
    console.log(currentMapId)
    const currentMap = findBeatmapById(currentMapId)
    console.log(currentMap)
    if (!currentMap) return

    // Team
    let team
    if (event.button === 0) team = "red"
    else if (event.button === 2) team = "blue"
    if (!team) return

    // Action
    let action = "pick"
    if (event.ctrlKey) action = "ban"

    if (this.dataset.pickTeam === "true" || this.dataset.banTeam === "true") return

    if (action === "ban") {

        const currentContainer = team === "red" ? leftTeamBanContainerEl : rightTeamBanContainerEl
        
        // Check container size
        if (currentContainer.childElementCount < 2) {
            createBanWrapper(currentMap, currentContainer)
            this.dataset.banTeam = "true"
        }
    }

    if (action === "pick") {
        const currentContainer = team === "red" ? leftTeamPickContainerEl : rightTeamPickContainerEl

        // Get current tile
        let currentTile
        for (let i = 0; i < currentContainer.childElementCount; i++) {
            if (currentContainer.children[i].hasAttribute("data-id")) continue
            currentTile = currentContainer.children[i]
            break
        }
        if (!currentTile) return

        currentPickTile = currentTile
        currentTile.dataset.id = currentMap.beatmap_id
        currentTile.children[0].style.backgroundImage =  `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
        currentTile.children[1].style.opacity = 1
        currentTile.children[5].innerText = `${currentMap.mod}${currentMap.order}`
        currentTile.children[6].style.opacity = 1

        document.cookie = `currentPicker=${team}; path=/`
        currentPickMap = currentMap

        this.dataset.pickTeam = "true"
    }
}

// Team Names
const leftTeamNameEl = document.getElementById("left-team-name")
const rightTeamNameEl = document.getElementById("right-team-name")
let leftTeamName, rightTeamName

// Chat stuff
const chatDisplayContainerEl = document.getElementById("chat-display-container")
let chatLen

// Autopicking / beatmap stuff
let mapId, mapChecksum

// Scores
let currentLeftScore, currentRightScore, currentLeftSecondaryScore, currentRightSecondaryScore
let ipcState, checkedWinner = false

// Socket
const socket = createTosuWsSocket()
socket.onmessage = event => {
    const data = JSON.parse(event.data)

    // Teams
    if (leftTeamName !== data.tourney.team.left) {
        leftTeamName = data.tourney.team.left
        leftTeamNameEl.innerText = leftTeamName
    }
    if (rightTeamName !== data.tourney.team.right) {
        rightTeamName = data.tourney.team.right
        rightTeamNameEl.innerText = rightTeamName
    }

    if (chatLen !== data.tourney.chat.length) {
        chatLen = updateChat(chatLen, data.tourney.chat, chatDisplayContainerEl)
    }

    if (mapId !== data.beatmap.id || mapChecksum !== data.beatmap.checksum) {
        mapId = data.beatmap.id
        mapChecksum = data.beatmap.checksum

        const currentMap = document.getElementById(mapId)

        if (currentMap && currentMap.dataset.pickTeam === "false" && currentMap.dataset.banTeam === "false" && isAutopickOn && nextPicker) {
            const event = new MouseEvent('mousedown', {
                bubbles: true,
                cancelable: true,
                view: window,
                button: (nextPicker === "blue")? 2 : 0,
            })
            currentMap.dispatchEvent(event)

            if (nextPicker === "red") updateNextAutoPicker("blue")
            else if (nextPicker === "blue") updateNextAutoPicker("red")
        }
    }

    // Scores
    if (ipcState === 2 || ipcState === 3) {
        currentLeftScore = 0
        currentRightScore = 0
        currentLeftSecondaryScore = 0
        currentRightSecondaryScore = 0

        // Get scores for each team
        for (let i = 0; i < data.tourney.clients.length; i++) {
            const currentPlayerPlay = data.tourney.clients[i].play
            if (currentMap && currentMap.mod === "EX" && currentMap.score_method === "combo") {
                data.tourney.clients[i].team === "left"? currentLeftScore += currentPlayerPlay.combo.max : currentRightScore += currentPlayerPlay.combo.max
                data.tourney.clients[i].team === "left"? currentLeftSecondaryScore += currentPlayerPlay.score : currentRightSecondaryScore += currentPlayerPlay.score
            } else if (currentMap && currentMap.mod === "EX" && currentMap.score_method === "miss") {
                data.tourney.clients[i].team === "left"? currentLeftScore += currentPlayerPlay.hits["0"] : currentRightScore += currentPlayerPlay.hits["0"]
                data.tourney.clients[i].team === "left"? currentLeftSecondaryScore += currentPlayerPlay.score : currentRightSecondaryScore += currentPlayerPlay.score
            } else if (currentMap && currentMap.mod === "EX" && currentMap.score_method === "miss") {
                data.tourney.clients[i].team === "left"? currentLeftScore += currentPlayerPlay.accuracy : currentRightScore += currentPlayerPlay.accuracy
                data.tourney.clients[i].team === "left"? currentLeftSecondaryScore += currentPlayerPlay.score : currentRightSecondaryScore += currentPlayerPlay.score
            } else {
                data.tourney.clients[i].team === "left"? currentLeftScore += currentPlayerPlay.score : currentRightScore += currentPlayerPlay.score
            }
        }
    }

    if (ipcState !== data.tourney.ipcState) {
        ipcState = data.tourney.ipcState

        if (ipcState !== 4) checkedWinner = false
        if (ipcState === 4 && !checkedWinner) {
            checkedWinner = true

            if (!isStarOn()) return
            let winner = ""
            if (currentPickMap && currentPickMap.mod === "EX" && (currentPickMap.score_method === "combo" || currentPickMap.score_method === "acc")) {
                if (currentLeftScore > currentRightScore) winner = "red"
                else if (currentLeftScore < currentRightScore) winner = "blue"
                else if (currentLeftSecondaryScore > currentRightSecondaryScore) winner = "red"
                else if (currentLeftSecondaryScore < currentRightSecondaryScore) winner = "blue"
            } else if (currentPickMap && currentPickMap.mod === "EX" && currentPickMap.score_method === "miss") {
                if (currentLeftScore < currentRightScore) winner = "red"
                else if (currentLeftScore > currentRightScore) winner = "blue"
                else if (currentLeftSecondaryScore > currentRightSecondaryScore) winner = "red"
                else if (currentLeftSecondaryScore < currentRightSecondaryScore) winner = "blue"
            } else {
                if (currentLeftScore > currentRightScore) winner = "red"
                else if (currentLeftScore < currentRightScore) winner = "blue"
            }

            if (!winner) return
            updateStarCount(winner, "plus", leftTeamStarContainerEl, rightTeamStarContainerEl)

            // Set winner on tile
            if (!currentPickTile) return
            currentPickTile.children[1].classList.add(`${winner === "red"? "left" : "right"}-team-pick-outline`)
            currentPickTile.children[1].classList.remove(`${winner === "red"? "right" : "left"}-team-pick-outline`)
            currentPickTile.children[2].setAttribute("src", `static/${winner === "red"? "green" : "blue"} crown.png`)
            currentPickTile.children[4].setAttribute("src", `static/winner-overlay/${winner === "red"? "green" : "blue"}-winner-overlay.png`)
        }
    }
}

// Update next auto picker
const nextAutopickerEl = document.getElementById("next-auto-picker-team")
let nextPicker
function updateNextAutoPicker(team) {
    nextAutopickerEl.innerText = team === "red" ? "Left" : "Right"
    nextPicker = team
}

// Toggle autopick
const toggleAutopickEl = document.getElementById("toggle-autopick")
let isAutopickOn = false
function toggleAutopick() {
    isAutopickOn = !isAutopickOn
    toggleAutopickEl.innerText = `Toggle Autopick: ${isAutopickOn? "ON" : "OFF"}`
}

// // Toggle Stars
const toggleStarsEl = document.getElementById("toggle-stars")
const toggleStarsTextEl = document.getElementById("toggle-stars-text")

// Mappool Management System
const mappoolManagementSystemEl = document.getElementById("mappool-management-system")
const mappoolManagementSetActionEl = document.getElementById("mappool-management-set-action")
let mappoolManagementAction
function mappoolManagementSetAction() {
    mappoolManagementAction = mappoolManagementSetActionEl.value
    
    // Remove all other elements
    while (mappoolManagementSystemEl.childElementCount > 3) {
        mappoolManagementSystemEl.lastChild.remove()
    }

    // Remove all variables
    mappoolManagementSetWhoseBanTeam = undefined
    mappoolManagementSetWhoseBanNumber = undefined
    mappoolManagementSelectedMap = undefined
    mappoolManagementSetWhosePickTeam = undefined
    mappoolManagementSetWhosePickNumber = undefined

    // Set Ban
    if (mappoolManagementAction === "setBan" || mappoolManagementAction === "removeBan") {
        // Whose Ban Title
        const whoseBanTitle = document.createElement("div")
        whoseBanTitle.classList.add("sidebar-title")
        whoseBanTitle.innerText = "Whose Ban?"

        // Get number of bans from each team
        let currentLeftBanNumberTotal = mappoolManagementAction === "setBan"? Math.min(leftTeamBanContainerEl.childElementCount + 1, 2) : leftTeamBanContainerEl.childElementCount
        let currentRightBanNumberTotal = mappoolManagementAction === "setBan"? Math.min(rightTeamBanContainerEl.childElementCount + 1, 2) : rightTeamBanContainerEl.childElementCount

        // If there are no bans (removeBan only)
        if (currentLeftBanNumberTotal + currentRightBanNumberTotal === 0) {
            const sidebarText = document.createElement("div")
            sidebarText.classList.add("sidebar-text")
            sidebarText.innerText = "Please set some bans first!"
            mappoolManagementSystemEl.append(sidebarText)
            return
        }

        // Create select 
        const mappoolManagementWhoseBanSelect = document.createElement("select")
        mappoolManagementWhoseBanSelect.classList.add("sidebar-select")
        mappoolManagementWhoseBanSelect.setAttribute("id", "mappool-management-set-whose-ban")
        const totalBans = currentLeftBanNumberTotal + currentRightBanNumberTotal
        const mappoolManagementWhoseBanSelectSize = (totalBans < 2 && mappoolManagementAction === "removeBan")? 2 : totalBans
        mappoolManagementWhoseBanSelect.setAttribute("size", mappoolManagementWhoseBanSelectSize)
        mappoolManagementWhoseBanSelect.addEventListener("change", mappoolManagementSetWhoseBan)
        // Get Bans
        let i = 0
        for (let i = 0; i < currentLeftBanNumberTotal; i++) {
            const mappoolManagementWhoseBanOption = document.createElement("option")
            mappoolManagementWhoseBanOption.setAttribute("value", `green|${i}`)
            if (i < leftTeamBanContainerEl.childElementCount) mappoolManagementWhoseBanOption.innerText = `Green Ban ${i + 1} - ${leftTeamBanContainerEl.children[i].innerText}`
            else mappoolManagementWhoseBanOption.innerText = `Green Ban ${i + 1}`

            mappoolManagementWhoseBanSelect.append(mappoolManagementWhoseBanOption)
        }
        for (let i = 0; i < currentRightBanNumberTotal; i++) {
            const mappoolManagementWhoseBanOption = document.createElement("option")
            mappoolManagementWhoseBanOption.setAttribute("value", `blue|${i}`)
            if (i < rightTeamBanContainerEl.childElementCount) mappoolManagementWhoseBanOption.innerText = `Blue Ban ${i + 1} - ${rightTeamBanContainerEl.children[i].innerText}`
            else mappoolManagementWhoseBanOption.innerText = `Blue Ban ${i + 1}`

            mappoolManagementWhoseBanSelect.append(mappoolManagementWhoseBanOption)
        }

        mappoolManagementSystemEl.append(whoseBanTitle, mappoolManagementWhoseBanSelect)

        if (mappoolManagementAction === "setBan") {
            // Which Map?
            const whichMapTitle = document.createElement("div")
            whichMapTitle.classList.add("sidebar-title")
            whichMapTitle.innerText = "Which Map?"

            const mappoolManagementWhichMapButtonContainer = document.createElement("div")
            mappoolManagementWhichMapButtonContainer.setAttribute("id", "mappool-management-which-ban-button-container")
            mappoolManagementWhichMapButtonContainer.classList.add("sidebar-mappool-management-button-container")

            for (let i = 0; i < allBeatmaps.length; i++) {
                const mappoolManagementWhichMapButton = document.createElement("div")
                mappoolManagementWhichMapButton.innerText = `${allBeatmaps[i].mod}${allBeatmaps[i].order}`
                mappoolManagementWhichMapButton.addEventListener("click", mappoolManagementSetMap)
                mappoolManagementWhichMapButton.dataset.id = allBeatmaps[i].beatmap_id
                mappoolManagementWhichMapButtonContainer.append(mappoolManagementWhichMapButton)
            }

            mappoolManagementSystemEl.append( whichMapTitle, mappoolManagementWhichMapButtonContainer)
        }
    }

    // Set Pick
    if (mappoolManagementAction === "setPick" || mappoolManagementAction === "removePick") {
        // Whose Pick Title
        const whosePickTitle = document.createElement("div")
        whosePickTitle.classList.add("sidebar-title")
        whosePickTitle.innerText = "Whose Pick?"

        // Create select 
        const mappoolManagementWhosePickSelect = document.createElement("select")
        mappoolManagementWhosePickSelect.classList.add("sidebar-select")
        mappoolManagementWhosePickSelect.setAttribute("id", "mappool-management-set-whose-pick")
        mappoolManagementWhosePickSelect.setAttribute("size", (currentFirstTo - 1) * 2)
        mappoolManagementWhosePickSelect.addEventListener("change", mappoolManagementSetWhosePick)

        // Create options
        for (let i = 0; i < leftTeamPickContainerEl.childElementCount; i++) {
            const mappoolManagementWhosePickOption = document.createElement("option")
            mappoolManagementWhosePickOption.setAttribute("value", `green|${i}`)
            if (leftTeamPickContainerEl.children[i].hasAttribute("data-id")) mappoolManagementWhosePickOption.innerText = `Green Pick ${i + 1} - ${leftTeamPickContainerEl.children[i].children[3].innerText}`
            else mappoolManagementWhosePickOption.innerText = `Green Pick ${i + 1}`

            mappoolManagementWhosePickSelect.append(mappoolManagementWhosePickOption)
        }
        for (let i = 0; i < rightTeamPickContainerEl.childElementCount; i++) {
            const mappoolManagementWhosePickOption = document.createElement("option")
            mappoolManagementWhosePickOption.setAttribute("value", `blue|${i}`)
            if (rightTeamPickContainerEl.children[i].hasAttribute("data-id")) mappoolManagementWhosePickOption.innerText = `Blue Pick ${i + 1} - ${rightTeamPickContainerEl.children[i].children[3].innerText}`
            else mappoolManagementWhosePickOption.innerText = `Blue Pick ${i + 1}`

            mappoolManagementWhosePickSelect.append(mappoolManagementWhosePickOption)
        }

        mappoolManagementSystemEl.append( whosePickTitle, mappoolManagementWhosePickSelect)

        if (mappoolManagementAction === "setPick") {
            // Which Map?
            const whichMapTitle = document.createElement("div")
            whichMapTitle.classList.add("sidebar-title")
            whichMapTitle.innerText = "Which Map?"

            const mappoolManagementWhichMapButtonContainer = document.createElement("div")
            mappoolManagementWhichMapButtonContainer.setAttribute("id", "mappool-management-which-ban-button-container")
            mappoolManagementWhichMapButtonContainer.classList.add("sidebar-mappool-management-button-container")

            for (let i = 0; i < allBeatmaps.length; i++) {
                const mappoolManagementWhichMapButton = document.createElement("div")
                mappoolManagementWhichMapButton.innerText = `${allBeatmaps[i].mod}${allBeatmaps[i].order}`
                mappoolManagementWhichMapButton.addEventListener("click", mappoolManagementSetMap)
                mappoolManagementWhichMapButton.dataset.id = allBeatmaps[i].beatmap_id
                mappoolManagementWhichMapButtonContainer.append(mappoolManagementWhichMapButton)
            }

            mappoolManagementSystemEl.append( whichMapTitle, mappoolManagementWhichMapButtonContainer)
        }
    } 
    // Set Pick
    if (mappoolManagementAction === "setWinner" || mappoolManagementAction === "removeWinner") {
        // Whose Pick Title
        const whosePickTitle = document.createElement("div")
        whosePickTitle.classList.add("sidebar-title")
        whosePickTitle.innerText = "Whose Pick?"

        // Create select 
        const mappoolManagementWhosePickSelect = document.createElement("select")
        mappoolManagementWhosePickSelect.classList.add("sidebar-select")
        mappoolManagementWhosePickSelect.setAttribute("id", "mappool-management-set-whose-pick")
        mappoolManagementWhosePickSelect.setAttribute("size", (currentFirstTo - 1) * 2)
        mappoolManagementWhosePickSelect.addEventListener("change", mappoolManagementSetWhosePick)

        // Create options
        for (let i = 0; i < leftTeamPickContainerEl.childElementCount; i++) {
            const mappoolManagementWhosePickOption = document.createElement("option")
            mappoolManagementWhosePickOption.setAttribute("value", `green|${i}`)
            if (leftTeamPickContainerEl.children[i].hasAttribute("data-id")) mappoolManagementWhosePickOption.innerText = `Green Pick ${i + 1} - ${leftTeamPickContainerEl.children[i].children[3].innerText}`
            else mappoolManagementWhosePickOption.innerText = `Green Pick ${i + 1}`

            mappoolManagementWhosePickSelect.append(mappoolManagementWhosePickOption)
        }
        for (let i = 0; i < rightTeamPickContainerEl.childElementCount; i++) {
            const mappoolManagementWhosePickOption = document.createElement("option")
            mappoolManagementWhosePickOption.setAttribute("value", `blue|${i}`)
            if (rightTeamPickContainerEl.children[i].hasAttribute("data-id")) mappoolManagementWhosePickOption.innerText = `Blue Pick ${i + 1} - ${rightTeamPickContainerEl.children[i].children[3].innerText}`
            else mappoolManagementWhosePickOption.innerText = `Blue Pick ${i + 1}`

            mappoolManagementWhosePickSelect.append(mappoolManagementWhosePickOption)
        }

        mappoolManagementSystemEl.append( whosePickTitle, mappoolManagementWhosePickSelect)

        if (mappoolManagementAction === "setWinner") {
            // Which Map?
            const whichTeamTitle = document.createElement("div")
            whichTeamTitle.classList.add("sidebar-title")
            whichTeamTitle.innerText = "Which Team?"

            const mappoolManagementWhichTeamContainer = document.createElement("select")
            mappoolManagementWhichTeamContainer.classList.add("sidebar-select")
            mappoolManagementWhichTeamContainer.setAttribute("id", "mappool-management-set-which-team")
            mappoolManagementWhichTeamContainer.addEventListener("change", mappoolManagementSetWhichTeam)
            mappoolManagementWhichTeamContainer.setAttribute("size", 2)

            const mappoolManagementWhichTeamOptionOne = document.createElement("option")
            mappoolManagementWhichTeamOptionOne.setAttribute("value", "green")
            mappoolManagementWhichTeamOptionOne.innerText = "Green"
            const mappoolManagementWhichTeamOptionTwo = document.createElement("option")
            mappoolManagementWhichTeamOptionTwo.setAttribute("value", "blue")
            mappoolManagementWhichTeamOptionTwo.innerText = "Blue"

            mappoolManagementWhichTeamContainer.append(mappoolManagementWhichTeamOptionOne, mappoolManagementWhichTeamOptionTwo)

            mappoolManagementSystemEl.append( whichTeamTitle, mappoolManagementWhichTeamContainer)
        }
    }

    // Apply Changes Button
    const applyChangesButtonContainer = document.createElement("div")
    applyChangesButtonContainer.classList.add("sidebar-button-container")

    const applyChangesButton = document.createElement("button")
    applyChangesButton.classList.add("full-length-button")
    applyChangesButton.innerText = "Apply Changes"

    switch (mappoolManagementAction) {
        case "setBan":
            applyChangesButton.addEventListener("click", mappoolManagementSetBan)
            break
        case "removeBan":
            applyChangesButton.addEventListener("click", mappoolManagementRemoveBan)
            break
        case "setPick":
            applyChangesButton.addEventListener("click", mappoolManagementSetPick)
            break
        case "removePick":
            applyChangesButton.addEventListener("click", mappoolManagementRemovePick)
            break
        case "setWinner":
            applyChangesButton.addEventListener("click", mappoolManagementSetWinner)
            break
        case "removeWinner":
            applyChangesButton.addEventListener("click", mappoolManagementRemoveWinner)
            break
    }
    
    applyChangesButtonContainer.append(applyChangesButton)
    mappoolManagementSystemEl.append(applyChangesButtonContainer)
}

// Mappool Management Whose Ban
let mappoolManagementSetWhoseBanTeam
let mappoolManagementSetWhoseBanNumber
function mappoolManagementSetWhoseBan() {
    const mappoolManagementSetWhoseBanElValue = document.getElementById("mappool-management-set-whose-ban").value
    const mappoolManagementSetWhoseBanElValueSplit = mappoolManagementSetWhoseBanElValue.split("|")
    mappoolManagementSetWhoseBanTeam = mappoolManagementSetWhoseBanElValueSplit[0]
    mappoolManagementSetWhoseBanNumber = Number(mappoolManagementSetWhoseBanElValueSplit[1])
}

// Mappool Management Set Map
let mappoolManagementSelectedMap
function mappoolManagementSetMap() {
    const mappoolManagementWhichMapButtonContainerEl = document.getElementById("mappool-management-which-ban-button-container")
    for (let i = 0; i < mappoolManagementWhichMapButtonContainerEl.childElementCount; i++) {
        mappoolManagementWhichMapButtonContainerEl.children[i].style.backgroundColor = "transparent"
        mappoolManagementWhichMapButtonContainerEl.children[i].style.color = "white"
    }
    this.style.backgroundColor = "#CECECE"
    this.style.color = "black"
    mappoolManagementSelectedMap = this.dataset.id
}

// Check ban count
function mapCurrentlyBannedElsewhereCheck(previousMapId, banRequirement) {
    let banCount = 0
    for (let i = 0; i < leftTeamBanContainerEl.childElementCount; i++) {
        if (leftTeamBanContainerEl.children[i].dataset.id === previousMapId) banCount++
    }
    for (let i = 0; i < rightTeamBanContainerEl.childElementCount; i++) {
        if (rightTeamBanContainerEl.children[i].dataset.id === previousMapId) banCount++
    }
    if (banCount > banRequirement) return true
    return false
}

// Check pick count
function mapCurrentlyPickedElsewhereCheck(previousMapId, pickRequirement) {
    let pickCount = 0
    for (let i = 0; i < leftTeamPickContainerEl.childElementCount; i++) {
        if (leftTeamPickContainerEl.children[i].dataset.id === previousMapId) pickCount++
    }
    for (let i = 0; i < rightTeamPickContainerEl.childElementCount; i++) {
        if (rightTeamPickContainerEl.children[i].dataset.id === previousMapId) pickCount++
    }
    if (pickCount > pickRequirement) return true
    return false
}

// Mappool Management Set Ban
function mappoolManagementSetBan() {
    if (mappoolManagementSetWhoseBanTeam === undefined || mappoolManagementSetWhoseBanNumber === undefined || mappoolManagementSelectedMap === undefined) return

    // Find which map
    const currentMap = findBeatmapById(mappoolManagementSelectedMap)
    if (!currentMap) return

    // Find which container
    const currentContainer = mappoolManagementSetWhoseBanTeam === "green"? leftTeamBanContainerEl : rightTeamBanContainerEl
    if (!currentContainer) return

    // Find if ban number currently exists or not
    let tileExists = false
    if (currentContainer.childElementCount > mappoolManagementSetWhoseBanNumber) tileExists = true

    // If tile does not exist
    if (!tileExists) {
        createBanWrapper(currentMap, currentContainer)
        document.getElementById(currentMap.beatmap_id).dataset.banTeam = "true"
    } else {
        const currentTile = currentContainer.children[mappoolManagementSetWhoseBanNumber]
        const previousMapId = currentTile.dataset.id

        // Check if map is currently banned elsewhere
        const mapCurrentlyBannedElsewhere = mapCurrentlyBannedElsewhereCheck(previousMapId, 1)
        
        // Check if map is currently picked elsewhere
        const mapCurrentlyPickedElsewhere = mapCurrentlyPickedElsewhereCheck(previousMapId, 0)

        // Set attributes depending on the above
        const previousMapButton = document.getElementById(previousMapId)
        previousMapButton.dataset.banTeam = mapCurrentlyBannedElsewhere? "true" : "false"
        previousMapButton.dataset.pickTeam = mapCurrentlyPickedElsewhere? "true" : "false"

        // Set attributes for current map
        currentTile.dataset.id = currentMap.beatmap_id
        currentTile.children[0].style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
        currentTile.children[1].innerText = `${currentMap.mod}${currentMap.order}`
    }
}

// Mappool Management Remove Ban
function mappoolManagementRemoveBan() {
    if (mappoolManagementSetWhoseBanTeam === undefined || mappoolManagementSetWhoseBanNumber === undefined) return

    // Find which container
    const currentContainer = mappoolManagementSetWhoseBanTeam === "green"? leftTeamBanContainerEl : rightTeamBanContainerEl
    if (!currentContainer) return

    // Find which tile
    const currentTile = currentContainer.children[mappoolManagementSetWhoseBanNumber]
    const previousMapId = currentTile.dataset.id
    if (!currentTile) return

    // Check if map is currently banned elsewhere
    const mapCurrentlyBannedElsewhere = mapCurrentlyBannedElsewhereCheck(previousMapId, 1)
    
    // Check if map is currently picked elsewhere
    const mapCurrentlyPickedElsewhere = mapCurrentlyPickedElsewhereCheck(previousMapId, 0)

    // Set attributes depending on the above
    const previousMapButton = document.getElementById(previousMapId)
    previousMapButton.dataset.banTeam = mapCurrentlyBannedElsewhere? "true" : "false"
    previousMapButton.dataset.pickTeam = mapCurrentlyPickedElsewhere? "true" : "false"

    // Remove tile
    currentTile.remove()
}

// Mappool Management Set Whose Pick
let mappoolManagementSetWhosePickTeam
let mappoolManagementSetWhosePickNumber
function mappoolManagementSetWhosePick() {
    const mappoolManagementSetWhosePickElValue = document.getElementById("mappool-management-set-whose-pick").value
    const mappoolManagementSetWhosePickElValueSplit = mappoolManagementSetWhosePickElValue.split("|")
    mappoolManagementSetWhosePickTeam = mappoolManagementSetWhosePickElValueSplit[0]
    mappoolManagementSetWhosePickNumber = Number(mappoolManagementSetWhosePickElValueSplit[1])
}

// Mappool Management Set Pick
function mappoolManagementSetPick() {
    if (mappoolManagementSetWhosePickTeam === undefined || mappoolManagementSetWhosePickNumber === undefined || mappoolManagementSelectedMap === undefined) return

    // Find which map
    const currentMap = findBeatmapById(mappoolManagementSelectedMap)
    if (!currentMap) return

    // Find which container
    const currentContainer = mappoolManagementSetWhosePickTeam === "green"? leftTeamPickContainerEl : rightTeamPickContainerEl
    if (!currentContainer) return

    // Find if ban number currently exists or not
    let tileExists = false
    if (currentContainer.children[mappoolManagementSetWhosePickNumber].hasAttribute("data-id")) tileExists = true

    const currentTile = currentContainer.children[mappoolManagementSetWhosePickNumber]

    if (tileExists) {
        const previousMapId = currentTile.dataset.id

        // Check if map is currently banned elsewhere
        const mapCurrentlyBannedElsewhere = mapCurrentlyBannedElsewhereCheck(previousMapId, 0)
        
        // Check if map is currently picked elsewhere
        const mapCurrentlyPickedElsewhere = mapCurrentlyPickedElsewhereCheck(previousMapId, 1)

        // Set attributes depending on the above
        const previousMapButton = document.getElementById(previousMapId)
        previousMapButton.dataset.banTeam = mapCurrentlyBannedElsewhere? "true" : "false"
        previousMapButton.dataset.pickTeam = mapCurrentlyPickedElsewhere? "true" : "false"

        currentTile.dataset.id = currentMap.beatmap_id
        currentTile.children[0].style.backgroundImage =  `url("https://assets.ppy.sh/beatmaps/${currentMap.beatmapset_id}/covers/cover.jpg")`
        currentTile.children[1].style.opacity = 1
        currentTile.children[3].innerText = `${currentMap.mod}${currentMap.order}`
        currentTile.children[5].innerText = `${currentMap.mod}${currentMap.order}`
        currentTile.children[6].style.opacity = 1
        document.getElementById(`${currentMap.beatmap_id}`).dataset.pickTeam = "true"
    }
}

function mappoolManagementRemovePick() {
    if (mappoolManagementSetWhosePickTeam === undefined || mappoolManagementSetWhosePickNumber === undefined) return

    // Find which container
    const currentContainer = mappoolManagementSetWhosePickTeam === "green"? leftTeamPickContainerEl : rightTeamPickContainerEl
    if (!currentContainer) return

    // Find if ban number currently exists or not
    let tileExists = false
    if (currentContainer.children[mappoolManagementSetWhosePickNumber].hasAttribute("data-id")) tileExists = true
    if (!tileExists) return

    const currentTile = currentContainer.children[mappoolManagementSetWhosePickNumber]
    const previousMapId = currentTile.dataset.id

    // Check if map is currently banned elsewhere
    const mapCurrentlyBannedElsewhere = mapCurrentlyBannedElsewhereCheck(previousMapId, 0)
    
    // Check if map is currently picked elsewhere
    const mapCurrentlyPickedElsewhere = mapCurrentlyPickedElsewhereCheck(previousMapId, 1)

    // Set attributes depending on the above
    const previousMapButton = document.getElementById(previousMapId)
    previousMapButton.dataset.banTeam = mapCurrentlyBannedElsewhere? "true" : "false"
    previousMapButton.dataset.pickTeam = mapCurrentlyPickedElsewhere? "true" : "false"

    currentTile.removeAttribute("data-id")
    currentTile.children[0].style.backgroundImage = ""
    currentTile.children[1].style.opacity = 0
    currentTile.children[2].classList.remove("left-team-pick-outline")
    currentTile.children[2].classList.remove("right-team-pick-outline")
    currentTile.children[3].setAttribute("src", "")
    currentTile.children[5].innerText = ""
    currentTile.children[6].style.opacity = 0
}

// Mappool Management Set Which Team
let mappoolManagementSetWhichTeamTeam
function mappoolManagementSetWhichTeam() {
    mappoolManagementSetWhichTeamTeam = document.getElementById("mappool-management-set-which-team").value
}

// Mappool Managemnt Set Winner
function mappoolManagementSetWinner() {
    if (mappoolManagementSetWhosePickTeam === undefined || mappoolManagementSetWhosePickNumber === undefined || mappoolManagementSetWhichTeamTeam === undefined) return

    // Find which container
    const currentContainer = mappoolManagementSetWhosePickTeam === "green"? leftTeamPickContainerEl : rightTeamPickContainerEl
    if (!currentContainer) return
    const currentTile = currentContainer.children[mappoolManagementSetWhosePickNumber]

    currentTile.children[2].classList.add(`${mappoolManagementSetWhichTeamTeam === "green"? "left" : "right"}-team-pick-outline`)
    currentTile.children[2].classList.remove(`${mappoolManagementSetWhichTeamTeam === "green"? "right" : "left"}-team-pick-outline`)
    currentTile.children[3].setAttribute("src", `static/${mappoolManagementSetWhichTeamTeam} crown.png`)
    currentTile.children[4].setAttribute("src", `static/winner-overlay/${mappoolManagementSetWhichTeamTeam}-winner-overlay.png`)
    currentTile.children[4].style.opacity = 1
}

// Mappool Managemnt Set Winner
function mappoolManagementRemoveWinner() {
    if (mappoolManagementSetWhosePickTeam === undefined || mappoolManagementSetWhosePickNumber === undefined) return

    // Find which container'
    const currentContainer = mappoolManagementSetWhosePickTeam === "green"? leftTeamPickContainerEl : rightTeamPickContainerEl
    if (!currentContainer) return
    const currentTile = currentContainer.children[mappoolManagementSetWhosePickNumber]

    currentTile.children[2].classList.remove("right-team-pick-outline")
    currentTile.children[2].classList.remove("left-team-pick-outline")
    currentTile.children[3].setAttribute("src", "")
    currentTile.children[4].style.opacity = 0
}

// Buttons
const updateStarRedMinusEl = document.getElementById("update-star-red-minus")
const updateStarRedPlusEl = document.getElementById("update-star-red-plus")
const updateStarBlueMinusEl = document.getElementById("update-star-blue-minus")
const updateStarBluePlusEl = document.getElementById("update-star-blue-plus")
const updateNextAutopickerRedEl = document.getElementById("update-next-autopicker-red")
const updateNextAutopickerBlueEl = document.getElementById("update-next-autopicker-blue")
document.addEventListener("DOMContentLoaded", () => {
    updateStarRedMinusEl.addEventListener("click", () => updateStarCount("red", "minus", leftTeamStarContainerEl, rightTeamStarContainerEl))
    updateStarRedPlusEl.addEventListener("click", () => updateStarCount("red", "plus", leftTeamStarContainerEl, rightTeamStarContainerEl))
    updateStarBlueMinusEl.addEventListener("click", () => updateStarCount("blue", "minus", leftTeamStarContainerEl, rightTeamStarContainerEl))
    updateStarBluePlusEl.addEventListener("click", () => updateStarCount("blue", "plus", leftTeamStarContainerEl, rightTeamStarContainerEl))
    updateNextAutopickerRedEl.addEventListener("click", () => updateNextAutoPicker('red'))
    updateNextAutopickerBlueEl.addEventListener("click", () => updateNextAutoPicker('blue'))
    toggleAutopickEl.addEventListener("click", toggleAutopick)
    toggleStarsEl.addEventListener("click", () => toggleStars(toggleStarsTextEl, toggleStarsEl, leftTeamStarContainerEl, rightTeamStarContainerEl))
    mappoolManagementSetActionEl.addEventListener("click", mappoolManagementSetAction)
})