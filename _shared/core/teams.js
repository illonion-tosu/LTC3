let allTeams = []

// Load player
export async function loadTeams() {
    const response = await axios.get("../_data/teams.json")
    allTeams = response.data
}

// Find player
export function findTeam(team_name) {
    return allTeams.find(t => t.team_name === team_name)
}