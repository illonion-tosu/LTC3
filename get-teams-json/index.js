const textareaEl = document.getElementById("textarea")
let teamStats = []
async function submit() {
    const textareaElValue = textareaEl.value
    const textAreaElValueSplit = textareaElValue.split("\n")
    for (let i = 0; i < textAreaElValueSplit.length; i++) {
        const textAreaElValueSplitSplit = textAreaElValueSplit[i].split("\t")
        const teamStat = {
            "team_name": textAreaElValueSplitSplit[0],
            "team_player1": textAreaElValueSplitSplit[1],
            "team_player2": textAreaElValueSplitSplit[2],
            "team_player3": textAreaElValueSplitSplit[3]
        }
        teamStats.push(teamStat)
    }

    const jsonString = JSON.stringify(teamStats, null, 4)
    const blob = new Blob([jsonString], { type: "application/json" })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "teams.json"
    link.click()
}