"use strict";


const welcomeView = document.getElementById("welcomeView");
const chatView = document.getElementById("chatView");
const messagesArea = document.getElementById("messagesArea");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const newResearchButton = document.getElementById("newResearchButton");
const mobileMenuButton = document.getElementById("mobileMenuButton");
const navigationPanel = document.getElementById("navigationPanel");
const uploadButton = document.getElementById("uploadButton");
const fileInput = document.getElementById("fileInput");
const attachmentPreview = document.getElementById("attachmentPreview");
const workspaceStatus = document.getElementById("workspaceStatus");
const conversationTitle = document.getElementById("conversationTitle");
const settingsButton = document.getElementById("settingsButton");
const themeButton = document.getElementById("themeButton");
const helpButton = document.getElementById("helpButton");

const conversationMenuButton =
    document.getElementById("conversationmenu") ||
    document.getElementById("conversationMenu");

const RECENT_RESEARCH_KEY = "felix-legal-recent-research";
const THEME_KEY = "felix-legal-theme";
const SETTINGS_KEY = "felix-legal-settings";

const MAX_DOCUMENT_CONTEXT_CHARS = 30000;
const MAX_FILE_SIZE = 10 * 1024 * 1024;
const MAX_MESSAGE_LENGTH = 10000;
const MAX_RECENT_RESEARCH = 50;

const ALLOWED_EXTENSIONS = [".pdf", ".txt", ".docx"];

let currentConversationId = null;
let currentResearchKey = null;
let isSendingMessage = false;
let isUploadingFile = false;

let currentDocumentText = "";
let currentDocumentFilename = "";
let selectedFiles = [];

console.log("Felix Legal Chatbot JavaScript loaded.");

// Make the profile letter look like a proper profile icon.
document.querySelector("#profileButton span")?.classList.add("profile-circle");

// Set sensible accessibility labels.
mobileMenuButton?.setAttribute("aria-label", "Toggle navigation");
conversationMenuButton?.setAttribute("aria-label", "Conversation options");



// GENERAL HELPERS

function setStatus(message) {
    if (workspaceStatus) {
        workspaceStatus.textContent = message;
    }
}

function setNavigationOpen(isOpen) {
    navigationPanel?.classList.toggle("open", isOpen);
    mobileMenuButton?.setAttribute("aria-expanded", String(isOpen));
}

function closeMobileNavigation() {
    setNavigationOpen(false);
}

function getFileExtension(filename) {
    const lastDot = filename.lastIndexOf(".");
    return lastDot >= 0 ? filename.slice(lastDot).toLowerCase() : "";
}

function createResearchTitle(message) {
    const cleanMessage = String(message || "").replace(/\s+/g, " ").trim();

    if (!cleanMessage) {
        return "New Legal Research";
    }

    return cleanMessage.length > 70
        ? `${cleanMessage.slice(0, 67).trim()}...`
        : cleanMessage;
}

function makeResearchKey() {
    return `research-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function closeElementById(id) {
    document.getElementById(id)?.remove();
}

function readRecentResearch() {
    try {
        const saved = localStorage.getItem(RECENT_RESEARCH_KEY);
        const parsed = saved ? JSON.parse(saved) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error("Could not read Recent Research:", error);
        return [];
    }
}

function writeRecentResearch(items) {
    try {
        localStorage.setItem(
            RECENT_RESEARCH_KEY,
            JSON.stringify(items.slice(0, MAX_RECENT_RESEARCH))
        );
        return true;
    } catch (error) {
        console.error("Could not save Recent Research:", error);
        setStatus("Browser storage is full. Some research may not be saved.");
        return false;
    }
}

function getCurrentResearch() {
    if (!currentResearchKey) {
        return null;
    }

    return readRecentResearch().find(
        item => item.key === currentResearchKey
    ) || null;
}

function updateCurrentResearch(updates = {}) {
    if (!currentResearchKey) {
        return;
    }

    const items = readRecentResearch();
    const index = items.findIndex(
        item => item.key === currentResearchKey
    );

    if (index === -1) {
        return;
    }

    items[index] = {
        ...items[index],
        ...updates,
        updatedAt: Date.now()
    };

    items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
    writeRecentResearch(items);
    renderRecentResearch();
}

function ensureCurrentResearch(title) {
    if (currentResearchKey && getCurrentResearch()) {
        return currentResearchKey;
    }

    currentResearchKey = makeResearchKey();

    const items = readRecentResearch();

    items.unshift({
        key: currentResearchKey,
        id: currentConversationId,
        title: title || "New Legal Research",
        updatedAt: Date.now(),
        messages: []
    });

    writeRecentResearch(items);
    renderRecentResearch();

    return currentResearchKey;
}

function saveLocalMessage(role, content, sources = []) {
    if (!currentResearchKey) {
        return;
    }

    const items = readRecentResearch();
    const index = items.findIndex(
        item => item.key === currentResearchKey
    );

    if (index === -1) {
        return;
    }

    const messages = Array.isArray(items[index].messages)
        ? items[index].messages
        : [];

    messages.push({
        role,
        content: String(content || ""),
        sources: Array.isArray(sources) ? sources : [],
        createdAt: Date.now()
    });

    // Keep the browser cache at a reasonable size.
    items[index].messages = messages.slice(-100);
    items[index].id = currentConversationId;
    items[index].updatedAt = Date.now();

    items.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));

    writeRecentResearch(items);
    renderRecentResearch();
}


// CHAT VIEW AND NEW RESEARCH

function openChat(title = "New Legal Research") {
    welcomeView?.classList.add("hidden");
    chatView?.classList.remove("hidden");

    if (conversationTitle) {
        conversationTitle.textContent = title;
    }

    if (selectedFiles.length > 0) {
        setStatus(`${selectedFiles.length} document(s) selected`);
    } else if (currentDocumentText) {
        setStatus(`Document ready: ${currentDocumentFilename}`);
    } else {
        setStatus("FelixLawAI ready");
    }
}

function renderAttachmentPreview() {
    if (!attachmentPreview) {
        return;
    }

    attachmentPreview.replaceChildren();

    if (selectedFiles.length === 0) {
        attachmentPreview.classList.add("hidden");
        return;
    }

    attachmentPreview.classList.remove("hidden");

    const heading = document.createElement("p");
    heading.textContent = `Selected documents (${selectedFiles.length})`;
    heading.style.fontWeight = "600";
    heading.style.marginBottom = "10px";
    attachmentPreview.appendChild(heading);

    selectedFiles.forEach((file, index) => {
        const row = document.createElement("div");
        row.className = "attachment-preview-item";

        Object.assign(row.style, {
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "10px",
            padding: "9px 10px",
            marginTop: "6px",
            border: "1px solid var(--border)",
            borderRadius: "9px"
        });

        const details = document.createElement("div");
        details.style.minWidth = "0";

        const filename = document.createElement("div");
        filename.textContent = file.name;
        filename.title = file.name;
        filename.style.overflowWrap = "anywhere";
        filename.style.fontWeight = "500";

        const size = document.createElement("div");
        size.textContent = `${(file.size / 1024).toFixed(1)} KB`;
        size.style.fontSize = "0.8rem";
        size.style.marginTop = "3px";

        details.append(filename, size);

        const removeButton = document.createElement("button");
        removeButton.type = "button";
        removeButton.textContent = "Remove";
        removeButton.setAttribute("aria-label", `Remove ${file.name}`);

        Object.assign(removeButton.style, {
            flexShrink: "0",
            padding: "6px 9px",
            border: "1px solid var(--border)",
            borderRadius: "7px",
            background: "transparent",
            color: "inherit"
        });

        removeButton.addEventListener("click", () => {
            selectedFiles.splice(index, 1);
            renderAttachmentPreview();
            setStatus(
                selectedFiles.length
                    ? `${selectedFiles.length} document(s) selected`
                    : "Ready"
            );
        });

        row.append(details, removeButton);
        attachmentPreview.appendChild(row);
    });

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.textContent = "Remove all attachments";
    clearButton.style.marginTop = "10px";
    clearButton.style.color = "var(--blue-600)";

    clearButton.addEventListener("click", () => {
        selectedFiles = [];
        renderAttachmentPreview();
        setStatus("Attachments removed");
    });

    attachmentPreview.appendChild(clearButton);
}

function clearDocumentContext() {
    currentDocumentText = "";
    currentDocumentFilename = "";
    selectedFiles = [];

    if (fileInput) {
        fileInput.value = "";
    }

    if (folderInput) {
        folderInput.value = "";
    }

    renderAttachmentPreview();

    if (messageInput) {
        messageInput.placeholder = "Ask a legal question...";
    }
}

function createNewResearch() {
    if (isSendingMessage || isUploadingFile) {
        return;
    }

    closeConversationMenu();

    currentConversationId = null;
    currentResearchKey = null;

    clearDocumentContext();

    messagesArea?.replaceChildren();

    if (messageInput) {
        messageInput.value = "";
        resizeTextarea();
    }

    welcomeView?.classList.remove("hidden");
    chatView?.classList.add("hidden");

    if (conversationTitle) {
        conversationTitle.textContent = "New Legal Research";
    }

    setStatus("Ready");
    closeMobileNavigation();
    renderRecentResearch();
}


// NAVIGATION

function selectTool(tool) {
    const titles = {
        research: "Legal Research",
        "case-analysis": "Case Analysis",
        drafting: "Legal Drafting",
        documents: "Document Review",
        authorities: "Legal Authorities",
        chat: "New Legal Research"
    };

    if (tool === "chat") {
        createNewResearch();
    } else {
        openChat(titles[tool] || "FelixLawAI Assistant");
    }
}

document.querySelectorAll("[data-tool]").forEach(button => {
    button.addEventListener("click", () => {
        selectTool(button.dataset.tool);

        document.querySelectorAll(".navigation-item").forEach(item => {
            item.classList.remove("active");
        });

        if (button.classList.contains("navigation-item")) {
            button.classList.add("active");
        }

        closeMobileNavigation();
    });
});

newResearchButton?.addEventListener("click", createNewResearch);

mobileMenuButton?.addEventListener("click", () => {
    const isOpen = navigationPanel?.classList.contains("open");
    setNavigationOpen(!isOpen);
});


// RECENT RESEARCH: DISPLAY, OPEN, AND DELETE

function removeRecentResearch(researchKey) {
    const items = readRecentResearch();
    const item = items.find(research => research.key === researchKey);

    if (!item) {
        return;
    }

    const confirmed = window.confirm(
        `Remove "${item.title || "Untitled research"}" from Recent Research?\n\nThis removes the browser-saved entry. It does not delete the database conversation.`
    );

    if (!confirmed) {
        return;
    }

    writeRecentResearch(
        items.filter(research => research.key !== researchKey)
    );

    if (currentResearchKey === researchKey) {
        currentResearchKey = null;
        currentConversationId = null;
        clearDocumentContext();
        messagesArea?.replaceChildren();

        if (conversationTitle) {
            conversationTitle.textContent = "New Legal Research";
        }

        chatView?.classList.add("hidden");
        welcomeView?.classList.remove("hidden");
    }

    renderRecentResearch();
    setStatus("Removed from Recent Research");
}

function renderRecentResearch() {
    const container = document.querySelector(".recentResearch");

    if (!container) {
        return;
    }

    const items = readRecentResearch().sort(
        (a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)
    );

    container.replaceChildren();

    if (items.length === 0) {
        const empty = document.createElement("p");
        empty.className = "recent-empty";
        empty.textContent = "Your research will appear here.";
        container.appendChild(empty);
        return;
    }

    items.forEach(item => {
        const row = document.createElement("div");
        row.className = "recent-item-row";

        if (item.key === currentResearchKey) {
            row.classList.add("active");
        }

        const openButton = document.createElement("button");
        openButton.type = "button";
        openButton.className = "recent-item";
        openButton.textContent = item.title || "Untitled research";
        openButton.title = item.title || "Untitled research";

        if (item.key === currentResearchKey) {
            openButton.setAttribute("aria-current", "true");
        }

        openButton.addEventListener("click", () => {
            closeMobileNavigation();
            openLocalResearch(item.key);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "recent-delete-button";
        deleteButton.textContent = "×";
        deleteButton.title = "Remove from Recent Research";
        deleteButton.setAttribute(
            "aria-label",
            `Remove ${item.title || "research"} from Recent Research`
        );

        deleteButton.addEventListener("click", event => {
            event.stopPropagation();
            removeRecentResearch(item.key);
        });

        row.append(openButton, deleteButton);
        container.appendChild(row);
    });
}

function openLocalResearch(researchKey) {
    if (isSendingMessage || isUploadingFile) {
        return;
    }

    const item = readRecentResearch().find(
        research => research.key === researchKey
    );

    if (!item) {
        renderRecentResearch();
        return;
    }

    currentResearchKey = item.key;
    currentConversationId = item.id ?? null;

    clearDocumentContext();
    closeConversationMenu();

    if (messageInput) {
        messageInput.value = "";
        resizeTextarea();
    }

    messagesArea?.replaceChildren();

    openChat(item.title || "New Legal Research");

    const messages = Array.isArray(item.messages) ? item.messages : [];

    messages.forEach(message => {
        const sender = message.role === "user" ? "user" : "assistant";
        const element = addMessage(message.content || "", sender);

        if (sender === "assistant" && Array.isArray(message.sources)) {
            renderResearchSources(element, message.sources);
        }
    });

    renderRecentResearch();
    messageInput?.focus();

    setStatus(
        "Research restored from this browser. Documents must be attached again to analyse them."
    );
}


// API RESPONSE AND ERROR HELPERS

async function readJsonResponse(response) {
    const responseText = await response.text();

    let data;

    try {
        data = JSON.parse(responseText);
    } catch {
        throw new Error(
            `The server returned an unreadable response (HTTP ${response.status}).`
        );
    }

    if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("The server returned an invalid response.");
    }

    if (!response.ok) {
        throw new Error(
            data.error || data.message ||
            `The request failed (HTTP ${response.status}).`
        );
    }

    return data;
}

function getChatErrorMessage(data, status) {
    const rawError =
        typeof data?.error === "string" ? data.error :
        typeof data?.message === "string" ? data.message : "";

    const errorText = rawError.toLowerCase();

    if (
        status === 401 || status === 403 ||
        /api.?key|invalid.?key|unauthori[sz]ed|permission denied|authentication/.test(errorText)
    ) {
        return "FelixLawAI could not authenticate with its AI provider. Check the server configuration.";
    }

    if (
        status === 429 ||
        /quota|rate.?limit|resource.?exhausted|usage limit|too many requests/.test(errorText)
    ) {
        return "The AI provider's usage limit may have been reached. Check your API quota or try again later.";
    }

    if (
        status === 502 || status === 503 || status === 504 ||
        /service unavailable|temporarily unavailable|overloaded|timed out/.test(errorText)
    ) {
        return "FelixLawAI could not obtain a response from its AI provider. Please try again.";
    }

    if (status >= 500) {
        return `The server returned error ${status}. Check the Flask terminal for details.`;
    }

    if (status >= 400) {
        return rawError || `Your request could not be processed (HTTP ${status}).`;
    }

    return rawError || "FelixLawAI could not connect to the server.";
}


// SAFE MARKDOWN RENDERING

function prepareAssistantMarkdown(message) {
    return String(message ?? "")
        .trim()
        .replace(
            /^```(?:markdown|md)?\s*\n([\s\S]*?)\n```\s*$/i,
            "$1"
        );
}

function renderMessageContent(container, message, sender) {
    const text = String(message ?? "");

    if (sender === "user") {
        container.textContent = text;
        return;
    }

    const cleanText = prepareAssistantMarkdown(text);

    if (
        typeof window.marked !== "undefined" &&
        typeof window.DOMPurify !== "undefined"
    ) {
        try {
            const html = window.marked.parse(cleanText, {
                gfm: true,
                breaks: false
            });

            container.innerHTML = window.DOMPurify.sanitize(html, {
                USE_PROFILES: { html: true }
            });

            container.classList.add("markdown-content");
            return;
        } catch (error) {
            console.error("Markdown rendering failed:", error);
        }
    }

    container.textContent = cleanText;
}

function addMessage(message, sender) {
    if (!messagesArea) {
        return null;
    }

    const element = document.createElement("div");
    element.classList.add("message");

    const senderClasses = String(sender).split(/\s+/);
    element.classList.add(...senderClasses);

    const isUser = senderClasses.includes("user");

    const label = document.createElement("div");
    label.className = "message-label";
    label.textContent = isUser ? "You" : "FelixLawAI";

    const content = document.createElement("div");
    content.className = "message-content";

    renderMessageContent(content, message, isUser ? "user" : "assistant");

    element.append(label, content);
    messagesArea.appendChild(element);

    messagesArea.scrollTop = messagesArea.scrollHeight;

    return element;
}

function showTyping() {
    if (!messagesArea || document.getElementById("typingIndicator")) {
        return;
    }

    const indicator = document.createElement("div");
    indicator.id = "typingIndicator";
    indicator.className = "message assistant typing-indicator";

    const label = document.createElement("div");
    label.className = "message-label";
    label.textContent = "FelixLawAI";

    const content = document.createElement("div");
    content.className = "message-content";
    content.textContent = "Preparing your legal response...";

    indicator.append(label, content);
    messagesArea.appendChild(indicator);
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

function hideTyping() {
    closeElementById("typingIndicator");
}


// LEGAL RESEARCH SOURCES

function renderResearchSources(messageElement, sources) {
    if (
        !messageElement ||
        !Array.isArray(sources) ||
        sources.length === 0
    ) {
        return;
    }

    const validSources = sources.filter(source => {
        if (
            !source ||
            typeof source.title !== "string" ||
            typeof source.url !== "string"
        ) {
            return false;
        }

        try {
            const url = new URL(source.url);
            return ["https:", "http:"].includes(url.protocol) &&
                source.title.trim().length > 0;
        } catch {
            return false;
        }
    }).slice(0, 15);

    if (validSources.length === 0) {
        return;
    }

    const panel = document.createElement("section");
    panel.className = "legal-sources";
    panel.setAttribute("aria-label", "Legal research sources");

    Object.assign(panel.style, {
        marginTop: "18px",
        padding: "16px",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        background: "var(--surface-soft)"
    });

    const heading = document.createElement("h3");
    heading.textContent = "Legal Research Sources";
    heading.style.marginBottom = "12px";
    heading.style.fontSize = "1rem";
    panel.appendChild(heading);

    validSources.forEach((source, index) => {
        const card = document.createElement("article");
        card.style.padding = "10px 0";

        if (index > 0) {
            card.style.borderTop = "1px solid var(--border)";
        }

        const link = document.createElement("a");
        link.href = source.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = `${index + 1}. ${source.title}`;
        link.style.fontWeight = "600";
        link.style.color = "var(--blue-600)";
        link.style.textDecoration = "none";
        link.style.overflowWrap = "anywhere";

        card.appendChild(link);

        if (typeof source.snippet === "string" && source.snippet.trim()) {
            const description = document.createElement("p");
            description.textContent = source.snippet;
            description.style.marginTop = "6px";
            description.style.fontSize = "0.9rem";
            description.style.lineHeight = "1.6";
            card.appendChild(description);
        }

        panel.appendChild(card);
    });

    messageElement.appendChild(panel);

    if (messagesArea) {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    }
}


// ATTACHMENT PICKERS

if (fileInput) {
    fileInput.accept = ".pdf,.txt,.docx";
    fileInput.multiple = true;
}

const folderInput = document.createElement("input");
folderInput.type = "file";
folderInput.multiple = true;
folderInput.accept = ".pdf,.txt,.docx";
folderInput.setAttribute("webkitdirectory", "");
folderInput.hidden = true;
folderInput.setAttribute("aria-label", "Choose a folder of documents");
document.body.appendChild(folderInput);

if (uploadButton && !document.getElementById("chooseFolderButton")) {
    const folderButton = document.createElement("button");

    folderButton.id = "chooseFolderButton";
    folderButton.type = "button";
    folderButton.textContent = "Choose folder";
    folderButton.title = "Select a folder of documents";

    Object.assign(folderButton.style, {
        marginLeft: "6px",
        padding: "7px 10px",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        background: "transparent",
        color: "inherit",
        fontSize: "0.82rem"
    });

    uploadButton.insertAdjacentElement("afterend", folderButton);

    folderButton.addEventListener("click", () => {
        if (!isUploadingFile && !isSendingMessage) {
            folderInput.click();
        }
    });
}

function queueSelectedFiles(fileList) {
    const accepted = [];
    const rejected = [];

    Array.from(fileList || []).forEach(file => {
        const extension = getFileExtension(file.name);

        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            rejected.push(`${file.name}: unsupported file type`);
            return;
        }

        if (file.size > MAX_FILE_SIZE) {
            rejected.push(`${file.name}: exceeds the 10 MB limit`);
            return;
        }

        if (file.size === 0) {
            rejected.push(`${file.name}: file is empty`);
            return;
        }

        const duplicate = selectedFiles.some(existing =>
            existing.name === file.name &&
            existing.size === file.size &&
            existing.lastModified === file.lastModified
        );

        if (!duplicate) {
            accepted.push(file);
        }
    });

    selectedFiles = [...selectedFiles, ...accepted];
    renderAttachmentPreview();

    if (accepted.length > 0) {
        openChat(conversationTitle?.textContent || "Document Review");
        setStatus(`${selectedFiles.length} document(s) selected`);
    }

    if (rejected.length > 0) {
        addMessage(
            `Some files were not added:\n${rejected.map(item => `- ${item}`).join("\n")}`,
            "assistant error"
        );
    }
}

fileInput?.addEventListener("change", () => {
    queueSelectedFiles(fileInput.files);
    fileInput.value = "";
});

folderInput.addEventListener("change", () => {
    queueSelectedFiles(folderInput.files);
    folderInput.value = "";
});

uploadButton?.addEventListener("click", () => {
    if (!isUploadingFile && !isSendingMessage) {
        fileInput?.click();
    }
});


// UPLOAD AND EXTRACT DOCUMENT TEXT

async function uploadSelectedDocuments() {
    if (selectedFiles.length === 0) {
        return;
    }

    isUploadingFile = true;

    if (uploadButton) {
        uploadButton.disabled = true;
    }

    const extractedDocuments = [];

    try {
        for (let index = 0; index < selectedFiles.length; index++) {
            const file = selectedFiles[index];

            setStatus(
                `Processing document ${index + 1} of ${selectedFiles.length}...`
            );

            const formData = new FormData();
            formData.append("file", file);

            const controller = new AbortController();
            const timeoutId = setTimeout(
                () => controller.abort(),
                120000
            );

            try {
                const response = await fetch("/api/upload", {
                    method: "POST",
                    headers: { "Accept": "application/json" },
                    body: formData,
                    signal: controller.signal
                });

                const data = await readJsonResponse(response);

                if (
                    typeof data.extracted_text !== "string" ||
                    !data.extracted_text.trim()
                ) {
                    throw new Error(
                        `No readable text was extracted from ${file.name}.`
                    );
                }

                extractedDocuments.push({
                    filename: data.filename || file.name,
                    text: data.extracted_text
                });
            } finally {
                clearTimeout(timeoutId);
            }
        }

        const combinedText = extractedDocuments
            .map(document =>
                `DOCUMENT: ${document.filename}\n\n${document.text}`
            )
            .join("\n\n------------------------------\n\n");

        currentDocumentText = combinedText.slice(
            0,
            MAX_DOCUMENT_CONTEXT_CHARS
        );

        currentDocumentFilename = extractedDocuments
            .map(document => document.filename)
            .join(", ");

        selectedFiles = [];
        renderAttachmentPreview();

        if (combinedText.length > MAX_DOCUMENT_CONTEXT_CHARS) {
            addMessage(
                "The combined document text exceeded 30,000 characters. Only the first 30,000 characters will be sent for analysis.",
                "assistant"
            );
        }
    } finally {
        isUploadingFile = false;

        if (uploadButton) {
            uploadButton.disabled = false;
        }
    }
}


// SEND A MESSAGE TO THE EXISTING /api/chat ROUTE

async function sendMessage() {
    if (!messageInput || !sendButton) {
        return;
    }

    let message = messageInput.value.trim();

    if (!message && selectedFiles.length > 0) {
        message =
            "Please analyse the attached document(s). Identify the key legal issues, relevant provisions, important clauses, potential risks, and recommended next steps. Distinguish the document's actual contents from your interpretation.";
    }

    if (!message || isSendingMessage || isUploadingFile) {
        return;
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
        addMessage(
            `Your question exceeds the ${MAX_MESSAGE_LENGTH.toLocaleString()}-character limit. Please shorten it and try again.`,
            "assistant error"
        );
        return;
    }

    isSendingMessage = true;
    sendButton.disabled = true;

    const originalInput = messageInput.value;
    messageInput.value = "";
    resizeTextarea();

    showTyping();

    try {
        // Upload attachments first. The selected files remain available
        // if an upload fails, allowing the user to retry.
        if (selectedFiles.length > 0) {
            await uploadSelectedDocuments();
        }

        const title = createResearchTitle(message);

        if (!currentResearchKey) {
            ensureCurrentResearch(title);

            if (conversationTitle) {
                conversationTitle.textContent = title;
            }
        }

        openChat(conversationTitle?.textContent || title);

        const displayedUserMessage = currentDocumentFilename
            ? `${message}\n\nAttached document(s): ${currentDocumentFilename}`
            : message;

        addMessage(displayedUserMessage, "user");
        saveLocalMessage("user", displayedUserMessage);

        setStatus(
            currentDocumentText
                ? "Analysing your question and document..."
                : "FelixLawAI is thinking..."
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(
            () => controller.abort(),
            90000
        );

        try {
            // The existing Flask /api/chat route creates a conversation
            // when conversation_id is null. Do not call a missing
            // /api/conversations endpoint before this request.
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify({
                    message,
                    conversation_id: currentConversationId,
                    document_text: currentDocumentText,
                    document_filename: currentDocumentFilename
                }),
                signal: controller.signal
            });

            const data = await readJsonResponse(response);

            if (data.conversation_id !== undefined &&
                data.conversation_id !== null) {
                currentConversationId = data.conversation_id;
            }

            const answer =
                typeof data.message === "string" ? data.message :
                typeof data.response === "string" ? data.response :
                typeof data.reply === "string" ? data.reply : "";

            if (!answer.trim()) {
                throw new Error(
                    "The server responded, but no answer was returned. Check ai.py and the Flask terminal."
                );
            }

            const assistantAnswer = answer.trim();
            const sources = Array.isArray(data.sources) ? data.sources : [];

            const assistantElement = addMessage(
                assistantAnswer,
                "assistant"
            );

            renderResearchSources(assistantElement, sources);
            saveLocalMessage("assistant", assistantAnswer, sources);

            // Save the server's conversation ID in the local entry.
            updateCurrentResearch({
                id: currentConversationId,
                title: conversationTitle?.textContent || title
            });

            setStatus(
                currentDocumentText
                    ? `Document ready: ${currentDocumentFilename}`
                    : "FelixLawAI ready"
            );
        } finally {
            clearTimeout(timeoutId);
        }
    } catch (error) {
        console.error("FelixLawAI request failed:", error);

        let messageToShow;

        if (error.name === "AbortError") {
            messageToShow =
                "The request exceeded its time limit. Check the Flask terminal and AI provider status.";
        } else if (error instanceof TypeError) {
            messageToShow =
                "FelixLawAI could not reach the server. Confirm that Flask is running and reload the page.";
        } else {
            messageToShow =
                error.message || "An unexpected error occurred.";
        }

        addMessage(messageToShow, "assistant error");
        setStatus("Request failed");

        // Restore the question if it failed before being sent.
        if (!messageInput.value.trim()) {
            messageInput.value = originalInput;
            resizeTextarea();
        }
    } finally {
        hideTyping();
        isSendingMessage = false;
        sendButton.disabled = false;
        messageInput?.focus();
    }
}

sendButton?.addEventListener("click", sendMessage);


// TEXTAREA RESIZING AND KEYBOARD SHORTCUT

function resizeTextarea() {
    if (!messageInput) {
        return;
    }

    messageInput.style.height = "auto";
    messageInput.style.height =
        `${Math.min(messageInput.scrollHeight, 160)}px`;
}

messageInput?.addEventListener("input", resizeTextarea);

messageInput?.addEventListener("keydown", event => {
    if (
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.isComposing
    ) {
        event.preventDefault();
        sendMessage();
    }
});


// CONVERSATION MENU

function closeConversationMenu() {
    closeElementById("conversationActionMenu");

    document.removeEventListener(
        "click",
        handleConversationMenuOutsideClick,
        true
    );

    document.removeEventListener(
        "keydown",
        handleConversationMenuEscape
    );
}

function handleConversationMenuOutsideClick(event) {
    const menu = document.getElementById("conversationActionMenu");

    if (
        menu &&
        !menu.contains(event.target) &&
        !conversationMenuButton?.contains(event.target)
    ) {
        closeConversationMenu();
    }
}

function handleConversationMenuEscape(event) {
    if (event.key === "Escape") {
        closeConversationMenu();
        conversationMenuButton?.focus();
    }
}

function renameCurrentResearch() {
    const item = getCurrentResearch();

    if (!item) {
        alert("Send a message first to create a research entry.");
        return;
    }

    const newTitle = window.prompt(
        "Enter a new title for this research:",
        item.title || "New Legal Research"
    );

    if (newTitle === null) {
        return;
    }

    const cleanTitle = newTitle.trim();

    if (!cleanTitle) {
        alert("The title cannot be empty.");
        return;
    }

    if (cleanTitle.length > 150) {
        alert("The title cannot exceed 150 characters.");
        return;
    }

    updateCurrentResearch({ title: cleanTitle });

    if (conversationTitle) {
        conversationTitle.textContent = cleanTitle;
    }

    setStatus("Research title updated in this browser");
}

async function copyCurrentConversation() {
    const text = messagesArea?.innerText?.trim() || "";

    if (!text) {
        alert("There are no messages to copy yet.");
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        setStatus("Conversation copied to clipboard");
        closeConversationMenu();
    } catch (error) {
        console.warn("Clipboard API unavailable:", error);

        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";

        document.body.appendChild(textarea);
        textarea.select();

        const copied = document.execCommand("copy");
        textarea.remove();

        if (copied) {
            setStatus("Conversation copied to clipboard");
            closeConversationMenu();
        } else {
            alert("Copying was blocked. Please select and copy the text manually.");
        }
    }
}

function openConversationMenu() {
    if (document.getElementById("conversationActionMenu")) {
        closeConversationMenu();
        return;
    }

    const menu = document.createElement("div");
    menu.id = "conversationActionMenu";
    menu.setAttribute("role", "menu");

    Object.assign(menu.style, {
        position: "fixed",
        zIndex: "1500",
        width: "230px",
        padding: "6px",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        background: "var(--surface)",
        color: "var(--text-main)",
        boxShadow: "0 12px 35px rgba(15, 23, 42, 0.16)"
    });

    const actions = [
        {
            label: "Rename research",
            action: renameCurrentResearch
        },
        {
            label: "Copy conversation",
            action: copyCurrentConversation
        },
        {
            label: "Remove from Recent Research",
            danger: true,
            action: () => {
                if (currentResearchKey) {
                    removeRecentResearch(currentResearchKey);
                } else {
                    alert("There is no saved research entry to remove.");
                }
            }
        }
    ];

    actions.forEach(item => {
        const button = document.createElement("button");
        button.type = "button";
        button.setAttribute("role", "menuitem");
        button.textContent = item.label;

        Object.assign(button.style, {
            display: "block",
            width: "100%",
            padding: "11px 12px",
            borderRadius: "8px",
            color: item.danger ? "#dc2626" : "inherit",
            textAlign: "left",
            fontSize: "0.9rem"
        });

        button.addEventListener("mouseenter", () => {
            button.style.background = "var(--surface-soft)";
        });

        button.addEventListener("mouseleave", () => {
            button.style.background = "transparent";
        });

        button.addEventListener("click", () => {
            closeConversationMenu();
            item.action();
        });

        menu.appendChild(button);
    });

    document.body.appendChild(menu);

    const rect = conversationMenuButton?.getBoundingClientRect();

    if (rect) {
        const width = 230;

        menu.style.left = `${Math.max(
            8,
            Math.min(rect.right - width, window.innerWidth - width - 8)
        )}px`;

        menu.style.top = `${Math.min(
            rect.bottom + 6,
            window.innerHeight - 170
        )}px`;
    } else {
        menu.style.top = "70px";
        menu.style.right = "16px";
    }

    document.addEventListener(
        "click",
        handleConversationMenuOutsideClick,
        true
    );

    document.addEventListener(
        "keydown",
        handleConversationMenuEscape
    );
}

conversationMenuButton?.addEventListener("click", event => {
    event.stopPropagation();
    openConversationMenu();
});


// SETTINGS PANEL

function openSettings() {
    if (document.getElementById("settingsDialog")) {
        return;
    }

    let savedSettings = {};

    try {
        savedSettings = JSON.parse(
            localStorage.getItem(SETTINGS_KEY) || "{}"
        );
    } catch {
        savedSettings = {};
    }

    const overlay = document.createElement("div");
    overlay.id = "settingsDialog";
    overlay.className = "settings-overlay";

    const dialog = document.createElement("section");
    dialog.className = "settings-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "settingsTitle");

    const title = document.createElement("h2");
    title.id = "settingsTitle";
    title.textContent = "FelixLawAI Settings";

    const description = document.createElement("p");
    description.textContent =
        "Customise your reading experience. Preferences are saved in this browser.";

    const label = document.createElement("label");
    label.className = "settings-option";
    label.htmlFor = "settingsTheme";

    const labelText = document.createElement("span");
    labelText.textContent = "Dark appearance";

    const checkbox = document.createElement("input");
    checkbox.id = "settingsTheme";
    checkbox.type = "checkbox";
    checkbox.checked =
        savedSettings.theme === "dark" ||
        (
            savedSettings.theme !== "light" &&
            document.body.classList.contains("dark-preview")
        );

    label.append(labelText, checkbox);

    const note = document.createElement("p");
    note.className = "settings-note";
    note.textContent =
        "These settings change the interface only. AI configuration remains on the server.";

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "settings-close";
    closeButton.textContent = "Done";

    function closeSettings() {
        overlay.remove();
        settingsButton?.focus();
        document.removeEventListener("keydown", handleEscape);
    }

    function handleEscape(event) {
        if (event.key === "Escape") {
            closeSettings();
        }
    }

    checkbox.addEventListener("change", () => {
        const theme = checkbox.checked ? "dark" : "light";
        applyTheme(theme);

        try {
            savedSettings.theme = theme;
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(savedSettings));
            localStorage.setItem(THEME_KEY, theme);
        } catch (error) {
            console.warn("Could not save theme preference:", error);
        }
    });

    closeButton.addEventListener("click", closeSettings);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeSettings();
        }
    });

    dialog.append(title, description, label, note, closeButton);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    document.addEventListener("keydown", handleEscape);
    closeButton.focus();
}

settingsButton?.addEventListener("click", openSettings);


// THEME TOGGLE

function applyTheme(theme) {
    const dark = theme === "dark";

    document.body.classList.toggle("dark-preview", dark);

    if (themeButton) {
        themeButton.setAttribute("aria-pressed", String(dark));
        themeButton.setAttribute(
            "aria-label",
            dark ? "Switch to light appearance" : "Switch to dark appearance"
        );
    }
}

function saveTheme(theme) {
    applyTheme(theme);

    try {
        localStorage.setItem(THEME_KEY, theme);

        const settings = JSON.parse(
            localStorage.getItem(SETTINGS_KEY) || "{}"
        );

        localStorage.setItem(
            SETTINGS_KEY,
            JSON.stringify({ ...settings, theme })
        );
    } catch (error) {
        console.warn("Could not save the theme:", error);
    }
}

themeButton?.addEventListener("click", () => {
    const dark = document.body.classList.contains("dark-preview");
    saveTheme(dark ? "light" : "dark");
});


// HELP PANEL

function openHelpPanel() {
    if (document.getElementById("felixHelpDialog")) {
        return;
    }

    const overlay = document.createElement("div");
    overlay.id = "felixHelpDialog";
    overlay.className = "settings-overlay";

    const dialog = document.createElement("section");
    dialog.className = "settings-dialog";
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "felixHelpTitle");

    const title = document.createElement("h2");
    title.id = "felixHelpTitle";
    title.textContent = "How to use Felix Legal Chatbot";

    const introduction = document.createElement("p");
    introduction.textContent =
        "Use Felix Legal Chatbot to organise Nigerian legal research, review supported documents, and explore legal questions.";

    dialog.append(title, introduction);

    const sections = [
        [
            "1. Ask a legal question",
            "Enter your question in the message box. Press Enter to send, or Shift + Enter for a new line."
        ],
        [
            "2. Review research sources",
            "Open returned source links and verify statutes, case reports, dates, and citations against authoritative material."
        ],
        [
            "3. Analyse documents",
            "Select PDF, TXT, or DOCX files. Remove unwanted attachments before sending. Scanned PDFs may not contain extractable text."
        ],
        [
            "4. Reopen research",
            "Use Recent Research to reopen browser-saved chats. Use the × beside an item to remove it from this browser's Recent Research list."
        ],
        [
            "5. Important legal caution",
            "AI-generated legal information can contain mistakes or omissions. Verify legal authorities and exercise professional judgment."
        ]
    ];

    sections.forEach(([headingText, paragraphText]) => {
        const block = document.createElement("div");
        block.style.marginTop = "16px";

        const heading = document.createElement("h3");
        heading.textContent = headingText;
        heading.style.fontSize = "0.98rem";
        heading.style.marginBottom = "5px";

        const paragraph = document.createElement("p");
        paragraph.textContent = paragraphText;
        paragraph.style.lineHeight = "1.6";
        paragraph.style.marginTop = "0";

        block.append(heading, paragraph);
        dialog.appendChild(block);
    });

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "settings-close";
    closeButton.textContent = "Close";

    function closeHelp() {
        overlay.remove();
        helpButton?.focus();
        document.removeEventListener("keydown", handleEscape);
    }

    function handleEscape(event) {
        if (event.key === "Escape") {
            closeHelp();
        }
    }

    closeButton.addEventListener("click", closeHelp);

    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closeHelp();
        }
    });

    dialog.appendChild(closeButton);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    document.addEventListener("keydown", handleEscape);
    closeButton.focus();
}

helpButton?.addEventListener("click", openHelpPanel);



// RESTORE THEME AND INITIALISE THE APP

try {
    const savedSettings = JSON.parse(
        localStorage.getItem(SETTINGS_KEY) || "{}"
    );

    const theme =
        localStorage.getItem(THEME_KEY) ||
        savedSettings.theme ||
        "light";

    applyTheme(theme);
} catch {
    applyTheme("light");
}

renderAttachmentPreview();
resizeTextarea();
renderRecentResearch();

console.log("FelixLawAI interface initialisation completed.");
