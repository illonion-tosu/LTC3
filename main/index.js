import { findBeatmap, loadBeatmaps } from "../_shared/core/beatmaps.js"
import { updateChat } from "../_shared/core/chat.js"
import { delay, getModDetails, setLengthDisplay } from "../_shared/core/utils.js"
import { renderStars, toggleStarContainers } from "../_shared/core/stars.js"
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
let currentRedTeamName, currentBlueTeamName, foundBeatmapInMappool, currentMap

// Now Playing Detrails
const nowPlayingBgEl = document.getElementById("now-playing-bg")
const nowPlayingTitleEl = document.getElementById("now-playing-title")
const nowPlayingDifficultyEl = document.getElementById("now-playing-difficulty")
const nowPlayingArtistEl = document.getElementById("now-playing-artist")
// Now Playing Stats
const nowPlayingSrEl = document.getElementById("now-playing-sr")
const nowPlayingCsEl = document.getElementById("now-playing-cs")
const nowPlayingBpmEl = document.getElementById("now-playing-bpm")
const nowPlayingArEl = document.getElementById("now-playing-ar")
const nowPlayingOdEl = document.getElementById("now-playing-od")
const nowPlayingLenEl = document.getElementById("now-playing-len")
let currentMapId, currentMapChecksum

// Score Section
const scoreSectionEl = document.getElementById("score-section")
// Score Difference Texts
const scoreDifferenceEl = document.getElementById("score-difference")
const scoreDifferenceComboEl = document.getElementById("score-difference-combo")
const scoreDifferenceMissEl = document.getElementById("score-difference-miss")
const scoreDifferenceAccEl = document.getElementById("score-difference-acc")
// Score Texts
const redScoreEl = document.getElementById("red-score")
const blueScoreEl = document.getElementById("blue-score")
const redScoreComboEl = document.getElementById("red-score-combo")
const blueScoreComboEl = document.getElementById("blue-score-combo")
const redScoreMissEl = document.getElementById("red-score-miss")
const blueScoreMissEl = document.getElementById("blue-score-miss")
const redScoreAccEl = document.getElementById("red-score-acc")
const blueScoreAccEl = document.getElementById("blue-score-acc")
const animation = {
    "redScore": new CountUp(redScoreEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    "blueScore": new CountUp(blueScoreEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    "scoreDifference": new CountUp(scoreDifferenceEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." }),
    "redCombo": new CountUp(redScoreComboEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." , suffix: "x"}),
    "blueCombo": new CountUp(blueScoreComboEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." , suffix: "x"}),
    "scoreDifferenceCombo": new CountUp(scoreDifferenceComboEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." , suffix: "x"}),
    "redMiss": new CountUp(redScoreMissEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." , suffix: "x"}),
    "blueMiss": new CountUp(blueScoreMissEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." , suffix: "x"}),
    "scoreDifferenceMiss": new CountUp(scoreDifferenceMissEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." , suffix: "x"}),
    "redAcc": new CountUp(redScoreAccEl, 0, 0, 2, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." , suffix: "%"}),
    "blueAcc": new CountUp(blueScoreAccEl, 0, 0, 2, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." , suffix: "%"}),
    "scoreDifferenceAcc": new CountUp(scoreDifferenceAccEl, 0, 0, 2, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: "." , suffix: "%"})
}
let currentRedScore, currentBlueScore
// Score visible
let scoreVisible
// Score Bar Lines
const scoreBarLineredEl = document.getElementById("score-bar-line-left")
const scoreBarLineblueEl = document.getElementById("score-bar-line-right")
// Bottom Score Backgroundf
const bottomScoreBackgroundEl = document.getElementById("bottom-score-background")

// Chat information
const chatDisplayEl = document.getElementById("chat-display")
const chatDisplayContainerEl = document.getElementById("chat-display-container")
let chatLen

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

    // Now Playing
    if ((currentMapId !== data.beatmap.id || currentMapChecksum !== data.beatmap.checksum) && allBeatmaps) {
        currentMapId = data.beatmap.id
        currentMapChecksum = data.beatmap.checksum
        foundBeatmapInMappool = false
        currentMap = undefined

        // Now Playing Details
        nowPlayingBgEl.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${data.beatmap.set}/covers/cover.jpg")`
        nowPlayingTitleEl.textContent = data.beatmap.title
        nowPlayingDifficultyEl.textContent = data.beatmap.version
        nowPlayingArtistEl.textContent = data.beatmap.artist

        currentMap = findBeatmap(currentMapId)
        if (currentMap) {
            foundBeatmapInMappool = true
            const mapDetails = getModDetails(
                currentMap.diff_size,
                currentMap.diff_approach,
                currentMap.diff_overall,
                currentMap.bpm,
                currentMap.total_length,
                currentMap.mod
            )

            nowPlayingSrEl.textContent = Math.round(Number(currentMap.difficultyrating) * 100) / 100
            nowPlayingCsEl.textContent = Math.round(mapDetails.cs * 10) / 10
            nowPlayingBpmEl.textContent =Math.round(mapDetails.bpm)
            nowPlayingArEl.textContent = Math.round(mapDetails.ar * 10) / 10
            nowPlayingOdEl.textContent = Math.round(mapDetails.od * 10) / 10
            nowPlayingLenEl.textContent = setLengthDisplay(mapDetails.len)
        } else {
            delay(250)
        }
    }

    // Found Beatmap In Mappool
    if (!foundBeatmapInMappool) {
        nowPlayingSrEl.textContent = Math.round(data.beatmap.stats.stars.total * 10) / 10
        nowPlayingCsEl.textContent = Math.round(data.beatmap.stats.cs.converted * 10) / 10
        nowPlayingBpmEl.textContent = Math.round(data.beatmap.stats.bpm.common)
        nowPlayingArEl.textContent = Math.round(data.beatmap.stats.ar.converted * 10) / 10
        nowPlayingOdEl.textContent = Math.round(data.beatmap.stats.od.converted * 10) / 10
        nowPlayingLenEl.textContent = setLengthDisplay(Math.round((data.beatmap.time.lastObject - data.beatmap.time.firstObject) / 1000))
    }

    // Score Visibility
    if (scoreVisible !== data.tourney.scoreVisible) {
        scoreVisible = data.tourney.scoreVisible
        if (scoreVisible) {
            chatDisplayEl.style.opacity = 0
            scoreSectionEl.style.opacity = 1
        } else {
            chatDisplayEl.style.opacity = 1
            scoreSectionEl.style.opacity = 0
        }
    }

    // Set score details
    if (scoreVisible) {
        currentRedScore = 0
        currentBlueScore = 0

        // Get scores for each team
        for (let i = 0; i < data.tourney.clients.length; i++) {
            const currentPlayerPlay = data.tourney.clients[i].play
            if (currentMap && currentMap.mod === "EX" && currentMap.score_method === "combo") {
                data.tourney.clients[i].team === "red"? currentRedScore += currentPlayerPlay.combo.max : currentBlueScore += currentPlayerPlay.combo.max
            } else if (currentMap && currentMap.mod === "EX" && currentMap.score_method === "miss") {
                data.tourney.clients[i].team === "red"? currentRedScore += currentPlayerPlay.hits["0"] : currentBlueScore += currentPlayerPlay.hits["0"]
            } else if (currentMap && currentMap.mod === "EX" && currentMap.score_method === "acc") {
                data.tourney.clients[i].team === "red"? currentRedScore += currentPlayerPlay.accuracy : currentBlueScore += currentPlayerPlay.accuracy
            } else {
                data.tourney.clients[i].team === "red"? currentRedScore += currentPlayerPlay.score : currentBlueScore += currentPlayerPlay.score
            }
        }

        // Reduce accuracy
        if (currentMap && currentMap.mod === "EX" && currentMap.score_method === "acc") {
            currentRedScore /= 2
            currentBlueScore /= 2
        }

        // Bar Width
        let barWidth
        const currentScoreDelta = Math.abs(currentRedScore - currentBlueScore)

        if (currentMap && currentMap.mod === "EX" && currentMap.score_method === "combo") {
            redScoreEl.style.opacity = 0
            blueScoreEl.style.opacity = 0
            redScoreComboEl.style.opacity = 1
            blueScoreComboEl.style.opacity = 1
            redScoreMissEl.style.opacity = 0
            blueScoreMissEl.style.opacity = 0
            redScoreAccEl.style.opacity = 0
            blueScoreAccEl.style.opacity = 0

            animation.redScore.update(0)
            animation.blueScore.update(0)
            animation.redCombo.update(currentRedScore)
            animation.blueCombo.update(currentBlueScore)
            animation.redMiss.update(0)
            animation.blueMiss.update(0)
            animation.redAcc.update(0)
            animation.blueAcc.update(0)

            scoreDifferenceEl.style.opacity = 0
            scoreDifferenceComboEl.style.opacity = 1
            scoreDifferenceMissEl.style.opacity = 0
            scoreDifferenceAccEl.style.opacity = 0

            animation.scoreDifference.update(0)
            animation.scoreDifferenceCombo.update(currentScoreDelta)
            animation.scoreDifferenceMiss.update(0)
            animation.scoreDifferenceAcc.update(0)

            barWidth = Math.min(currentScoreDelta / 50 * 960, 960)
        } else if (currentMap && currentMap.mod === "EX" && currentMap.score_method === "miss") {
            redScoreEl.style.opacity = 0
            blueScoreEl.style.opacity = 0
            redScoreComboEl.style.opacity = 0
            blueScoreComboEl.style.opacity = 0
            redScoreMissEl.style.opacity = 1
            blueScoreMissEl.style.opacity = 1
            redScoreAccEl.style.opacity = 0
            blueScoreAccEl.style.opacity = 0

            animation.redScore.update(0)
            animation.blueScore.update(0)
            animation.redCombo.update(0)
            animation.blueCombo.update(0)
            animation.redMiss.update(currentRedScore)
            animation.blueMiss.update(currentBlueScore)
            animation.redAcc.update(0)
            animation.blueAcc.update(0)

            scoreDifferenceEl.style.opacity = 0
            scoreDifferenceComboEl.style.opacity = 0
            scoreDifferenceMissEl.style.opacity = 1
            scoreDifferenceAccEl.style.opacity = 0

            animation.scoreDifference.update(0)
            animation.scoreDifferenceCombo.update(0)
            animation.scoreDifferenceMiss.update(currentScoreDelta)
            animation.scoreDifferenceAcc.update(0)

            barWidth = Math.min(currentScoreDelta / 20 * 960, 960)
        } else if (currentMap && currentMap.mod === "EX" && currentMap.score_method === "acc") {
            // Set Display
            redScoreEl.style.opacity = 0
            blueScoreEl.style.opacity = 0
            redScoreComboEl.style.opacity = 0
            blueScoreComboEl.style.opacity = 0
            redScoreMissEl.style.opacity = 0
            blueScoreMissEl.style.opacity = 0
            redScoreAccEl.style.opacity = 1
            blueScoreAccEl.style.opacity = 1

            animation.redScore.update(0)
            animation.blueScore.update(0)
            animation.redCombo.update(0)
            animation.blueCombo.update(0)
            animation.redMiss.update(0)
            animation.blueMiss.update(0)
            animation.redAcc.update(currentRedScore)
            animation.blueAcc.update(currentBlueScore)

            scoreDifferenceEl.style.opacity = 0
            scoreDifferenceComboEl.style.opacity = 0
            scoreDifferenceMissEl.style.opacity = 0
            scoreDifferenceAccEl.style.opacity = 1

            animation.scoreDifference.update(0)
            animation.scoreDifferenceCombo.update(0)
            animation.scoreDifferenceMiss.update(0)
            animation.scoreDifferenceAcc.update(currentScoreDelta)

            // Bar Width
            barWidth = Math.min(currentScoreDelta / 10 * 960, 960)
        } else {
            // Set Display
            redScoreEl.style.opacity = 1
            blueScoreEl.style.opacity = 1
            redScoreComboEl.style.opacity = 0
            blueScoreComboEl.style.opacity = 0
            redScoreMissEl.style.opacity = 0
            blueScoreMissEl.style.opacity = 0
            redScoreAccEl.style.opacity = 0
            blueScoreAccEl.style.opacity = 0

            animation.redScore.update(currentRedScore)
            animation.blueScore.update(currentBlueScore)
            animation.redCombo.update(0)
            animation.blueCombo.update(0)
            animation.redMiss.update(0)
            animation.blueMiss.update(0)
            animation.redAcc.update(0)
            animation.blueAcc.update(0)

            scoreDifferenceEl.style.opacity = 1
            scoreDifferenceComboEl.style.opacity = 0
            scoreDifferenceMissEl.style.opacity = 0
            scoreDifferenceAccEl.style.opacity = 0

            animation.scoreDifference.update(currentScoreDelta)
            animation.scoreDifferenceCombo.update(0)
            animation.scoreDifferenceMiss.update(0)
            animation.scoreDifferenceAcc.update(0)

            // Bar Width
            barWidth = Math.min(Math.pow(currentScoreDelta / 500000, 0.5) * 960, 960)
        }

        // Score Bar - Set who is winning
        let winning = ""
        if (currentRedScore === currentBlueScore) winning = "none"
        else if (currentMap && currentMap.mod === "EX" && currentMap.score_method === "miss" && currentRedScore > currentBlueScore) winning = "right"
        else if (currentMap && currentMap.mod === "EX" && currentMap.score_method === "miss" && currentRedScore < currentBlueScore) winning = "left"
        else if (currentRedScore > currentBlueScore) winning = "left"
        else if (currentBlueScore > currentRedScore) winning = "right"

        if (winning === "left") {
            scoreBarLineredEl.style.width = `${barWidth}px`
            scoreBarLineblueEl.style.width = "0px"
        } else if (winning === "right") {
            scoreBarLineredEl.style.width = "0px"
            scoreBarLineblueEl.style.width = `${barWidth}px`
        } else if (winning === "none") {
            scoreBarLineredEl.style.width = "0px"
            scoreBarLineblueEl.style.width = "0px"
        }

        // Show who is winning
        let imageText = "none"
        if (currentRedScore > currentBlueScore) imageText = "red"
        else if (currentBlueScore > currentRedScore) imageText = "blue"
        bottomScoreBackgroundEl.setAttribute("src", `static/bottom-score-background/${imageText}-winning-background.png`)

    } else {
        if (chatLen !== data.tourney.chat.length) {
            chatLen = updateChat(chatLen, data.tourney.chat, chatDisplayContainerEl)
        }
    }
}

const redTeamStarContainerEl = document.getElementById("red-team-star-container")
const blueTeamStarContainerEl = document.getElementById("blue-team-star-container")
setInterval(() => {
    renderStars(redTeamStarContainerEl, blueTeamStarContainerEl)
    toggleStarContainers(redTeamStarContainerEl, blueTeamStarContainerEl)
}, 200)