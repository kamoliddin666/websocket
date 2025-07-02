const ws = new WebSocket("ws://localhost:8080");
const username = prompt("Ismingizni kiriting:");

const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message");
const sendButton = document.getElementById("send");
const typingDiv = document.getElementById("typing");
const recordButton = document.getElementById("record");
const scheduleTime = document.getElementById("schedule-time");

let mediaRecorder;
let chunks = [];

ws.addEventListener("open", () => {
  ws.send(JSON.stringify({ type: "register", username }));
});

ws.addEventListener("message", (e) => {
  const msg = JSON.parse(e.data);

  if (msg.type === "reject") {
    alert(msg.reason);
    location.reload();
  }

  if (["message", "scheduled"].includes(msg.type)) {
    if (msg.username !== username) {
      showMessage(msg.username, msg.text);
    }
  }

  if (msg.type === "typing") {
    typingDiv.innerText = `${msg.username} is typing...`;
    typingDiv.style.display = "block";
    setTimeout(() => {
      typingDiv.innerText = "";
      typingDiv.style.display = "none";
    }, 2000);
  }

  if (msg.type === "file") {
    const isImage = msg.fileType.startsWith("image/");
    const isVideo = msg.fileType.startsWith("video/");
    const isAudio = msg.fileType.startsWith("audio/");

    let content = "";

    if (isImage) {
      content = `<img src="${msg.data}" alt="${msg.fileName}" onclick="window.open('${msg.data}', '_blank')" />`;
    } else if (isVideo) {
      content = `<video controls><source src="${msg.data}" type="${msg.fileType}">Videoni o'qib bo'lmadi.</video>`;
    } else if (isAudio) {
      content = `<audio controls><source src="${msg.data}" type="${msg.fileType}">Audioni o'qib bo'lmadi.</audio>`;
    } else {
      content = `<span class="file-icon">📎</span><a href="${msg.data}" download target="_blank">${msg.fileName}</a>`;
    }

    showMessage(msg.username, content);
  }

  if (msg.type === "voice") {
    const audio = `<audio controls src="${msg.blob}"></audio>`;
    showMessage(msg.username, audio);
  }
});

sendButton.onclick = () => {
  const text = messageInput.value.trim();
  const time = scheduleTime.value;
  if (!text) return;

  if (time) {
    const sendAt = new Date(time).toISOString();
    ws.send(JSON.stringify({ type: "scheduled", text, sendAt }));
    const previewTime = new Date(time).toLocaleTimeString();
    showMessage(username, `<span class='scheduled-time'>⏰ ${previewTime}</span>${text}`);
  } else {
    ws.send(JSON.stringify({ type: "message", text }));
    showMessage(username, text);
  }

  messageInput.value = "";
  scheduleTime.value = "";
};

messageInput.oninput = () => {
  ws.send(JSON.stringify({ type: "typing" }));
};

chatBox.ondragover = (e) => e.preventDefault();
chatBox.ondrop = (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  const reader = new FileReader();
  reader.onload = () => {
    ws.send(
      JSON.stringify({
        type: "file",
        fileName: file.name,
        fileType: file.type,
        data: reader.result,
      })
    );
  };
  reader.readAsDataURL(file);
};

recordButton.onclick = async () => {
  if (!mediaRecorder) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const reader = new FileReader();
      reader.onloadend = () => {
        ws.send(JSON.stringify({ type: "voice", blob: reader.result }));
        chunks = [];
      };
      reader.readAsDataURL(blob);
    };

    mediaRecorder.start();
    recordButton.innerText = "⏹";
  } else {
    mediaRecorder.stop();
    mediaRecorder = null;
    recordButton.innerText = "🎙";
  }
};

function showMessage(sender, content) {
  const container = document.createElement("div");
  container.className = sender === username ? "message me" : "message";

  if (sender !== username) {
    const avatar = document.createElement("span");
    avatar.className = "avatar";
    avatar.innerText = sender[0].toUpperCase();

    const bubble = document.createElement("span");
    bubble.className = "bubble";
    bubble.innerHTML = content;

    container.append(avatar);
    container.append(bubble);
  } else {
    const bubble = document.createElement("span");
    bubble.className = "bubble";
    bubble.innerHTML = content;
    container.append(bubble);
  }

  chatBox.append(container);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function showSystemMessage(text) {
  const div = document.createElement("div");
  div.className = "message system";
  div.innerText = text;
  chatBox.append(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}