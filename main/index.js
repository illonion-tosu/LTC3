import { findBeatmap, loadBeatmaps } from "../_shared/core/beatmaps.js"
import { updateChat } from "../_shared/core/chat.js"
import { delay, getModDetails, setLengthDisplay } from "../_shared/core/utils.js"
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
let currentRedTeamName, currentBlueTeamName, foundBeatmapInMappool

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
// Score Texts
const scoreDifferenceEl = document.getElementById("score-difference")
const redScoreEl = document.getElementById("red-score")
const blueScoreEl = document.getElementById("blue-score")
let currentRedScore, currentBlueScore
// Animations
const animations = {
    // Score
    "redScore": new CountUp(redScoreEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: ""}),
    "blueScore": new CountUp(blueScoreEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: ""}),
    "scoreDifference": new CountUp(scoreDifferenceEl, 0, 0, 0, 0.2, { useEasing: true, useGrouping: true, separator: ",", decimal: ".", suffix: ""}),
}
// Score visible
let scoreVisible
// Score Bar Lines
const scoreBarLineLeftEl = document.getElementById("score-bar-line-left")
const scoreBarLineRightEl = document.getElementById("score-bar-line-right")
// Bottom Score Background
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
        foundBeatmapInMappool = undefined

        // Now Playing Details
        nowPlayingBgEl.style.backgroundImage = `url("https://assets.ppy.sh/beatmaps/${data.beatmap.set}/covers/cover.jpg")`
        nowPlayingTitleEl.textContent = data.beatmap.title
        nowPlayingDifficultyEl.textContent = data.beatmap.version
        nowPlayingArtistEl.textContent = data.beatmap.artist

        foundBeatmapInMappool = findBeatmap(currentMapId)
        if (foundBeatmapInMappool) {
            const mapDetails = getModDetails(
                foundBeatmapInMappool.diff_size,
                foundBeatmapInMappool.diff_approach,
                foundBeatmapInMappool.diff_overall,
                foundBeatmapInMappool.bpm,
                foundBeatmapInMappool.totalLength,
                foundBeatmapInMappool.mod
            )

            nowPlayingSrEl.textContent = Math.round(Number(foundBeatmapInMappool.difficultyrating) * 100) / 100
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
        foundBeatmapInMappool = true
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
        currentRedScore = data.tourney.totalScore.left
        currentBlueScore = data.tourney.totalScore.right

        // Animations
        animations.redScore.update(currentRedScore)
        animations.blueScore.update(currentBlueScore)
        animations.scoreDifference.update(Math.abs(currentRedScore - currentBlueScore))

        // Score Bar Line
        scoreBarLineLeftEl.style.width = `${currentRedScore / 2000000 * 960}px`
        scoreBarLineRightEl.style.width = `${currentBlueScore / 2000000 * 960}px`

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