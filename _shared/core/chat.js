export function updateChat(chatLen, chatData, chatContainerEl) {
    // This is also mostly taken from Victim Crasher: https://github.com/VictimCrasher/static/tree/master/WaveTournament
    if (chatLen !== chatData.length) {
        (chatLen === 0 || chatLen > chatData.length) ? (chatContainerEl.innerHTML = "", chatLen = 0) : null
        const fragment = document.createDocumentFragment()

        for (let i = chatLen; i < chatData.length; i++) {
            const chatColour = chatData[i].team

            // Chat message container
            const chatMessageContainer = document.createElement("div")
            chatMessageContainer.classList.add("message-container")

            // Name
            const chatDisplayName = document.createElement("span")
            chatDisplayName.classList.add("message-name")
            chatDisplayName.classList.add(chatColour)
            chatDisplayName.innerText = chatData[i].name + ": ";

            // Message
            const chatDisplayMessage = document.createElement("span")
            chatDisplayMessage.classList.add("message-content")
            chatDisplayMessage.innerText = chatData[i].message

            chatMessageContainer.append(chatDisplayName, chatDisplayMessage)
            fragment.append(chatMessageContainer)
        }

        chatContainerEl.append(fragment)
        chatLen = chatData.length
        chatContainerEl.scrollTop = chatContainerEl.scrollHeight
    }

    return chatLen
}