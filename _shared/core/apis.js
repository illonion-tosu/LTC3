// Load osu! api
let osuApi
export async function initialiseOsuApi() {
    const response = await fetch("../_data/osu-api.json")
    const responseJson = await response.json()
    osuApi = responseJson.api
}

// Load logs api
let logsApi
export async function initialiseLogsApi() {
    const response = await fetch("../_data/logs-api.json")
    const responseJson = await response.json()
    logsApi = responseJson.api
}

// Get osu! api
export function getOsuApi() {
    return osuApi
}

// Get logs api
export function getLogsApi() {
    return logsApi
}

// Send Logs
export async function sendLog(logObject, collection, api) {
    try {
        const body = JSON.stringify(logObject, (key, value) =>
            value === undefined ? null : value
        )
        const res = await fetch(`http://46.62.195.72:3000/${collection}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-api-key": api,
            },
            body: body,
        })
      const data = await res.json()
    } catch (err) {
      console.error("Log failed:", err)
    }
}