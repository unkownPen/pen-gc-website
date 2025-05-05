// Firebase Config (Replace with yours)
const firebaseConfig = {
apiKey: "AIzaSyCvAEJLfyFnbwT-XHwsEW7Et-R1A11yKrs",
  authDomain: "pen-gc.firebaseapp.com",
  projectId: "pen-gc",
  storageBucket: "pen-gc.firebasestorage.app",
  messagingSenderId: "814914537437",
  appId: "1:814914537437:web:158678044c4eb2e05c5834",
  measurementId: "G-8VB5M5QN2C"
};
// Replace old Firebase imports with these:
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.0/firebase-auth.js";

// Initialize Firebase
const firebaseConfig = { /* your config */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
// DOM Elements
const penNameInput = document.getElementById("pen-name-input");
const savePenNameBtn = document.getElementById("save-pen-name");
const messageInput = document.getElementById("message-input");
const sendMessageBtn = document.getElementById("send-message");
const messagesDiv = document.getElementById("messages");
const announcementInput = document.getElementById("announcement-input");
const postAnnouncementBtn = document.getElementById("post-announcement");
const announcementsList = document.getElementById("announcements-list");
const adminAnnouncementForm = document.getElementById("admin-announcement-form");
const pollQuestion = document.getElementById("poll-question");
const pollOption1 = document.getElementById("poll-option1");
const pollOption2 = document.getElementById("poll-option2");
const createPollBtn = document.getElementById("create-poll");
const pollsList = document.getElementById("polls-list");
const adminPollForm = document.getElementById("admin-poll-form");
const suggestionInput = document.getElementById("suggestion-input");
const submitSuggestionBtn = document.getElementById("submit-suggestion");
const suggestionsList = document.getElementById("suggestions-list");

// Tab Switching
document.querySelectorAll(".tab-button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".tab-button").forEach(btn => btn.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(pane => pane.classList.remove("active"));
    button.classList.add("active");
    document.getElementById(button.dataset.tab).classList.add("active");
  });
});

// Sign in anonymously (for simplicity)
auth.signInAnonymously()
  .then(() => {
    console.log("Signed in anonymously");
    checkIfAdmin();
  })
  .catch(error => {
    console.error("Sign-in error:", error);
  });

// Check if user is admin (you)
function checkIfAdmin() {
  auth.onAuthStateChanged(user => {
    if (user && user.uid === "YOUR_UID") { // Replace with your UID
      adminAnnouncementForm.style.display = "block";
      adminPollForm.style.display = "block";
    }
  });
}

// Save Pen Name
savePenNameBtn.addEventListener("click", () => {
  const penName = penNameInput.value.trim();
  if (penName) {
    const user = auth.currentUser;
    if (user) {
      db.collection("users").doc(user.uid).set({
        penName: penName
      }, { merge: true });
    }
  }
});

// Load Pen Name
auth.onAuthStateChanged(user => {
  if (user) {
    db.collection("users").doc(user.uid).get()
      .then(doc => {
        if (doc.exists && doc.data().penName) {
          penNameInput.value = doc.data().penName;
        }
      });
  }
});

// Send Message
sendMessageBtn.addEventListener("click", () => {
  const messageText = messageInput.value.trim();
  if (messageText) {
    const user = auth.currentUser;
    if (user) {
      db.collection("users").doc(user.uid).get()
        .then(doc => {
          const penName = doc.exists && doc.data().penName ? doc.data().penName : "Anonymous";
          db.collection("messages").add({
            text: messageText,
            penName: penName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          messageInput.value = "";
        });
    }
  }
});

// Display Messages
db.collection("messages")
  .orderBy("timestamp", "asc")
  .onSnapshot(snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(doc => {
      const message = doc.data();
      const messageElement = document.createElement("div");
      messageElement.innerHTML = `<strong>${message.penName}:</strong> ${message.text}`;
      messagesDiv.appendChild(messageElement);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });

// Post Announcement (Admin Only)
postAnnouncementBtn.addEventListener("click", () => {
  const announcementText = announcementInput.value.trim();
  if (announcementText) {
    db.collection("announcements").add({
      text: announcementText,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    announcementInput.value = "";
  }
});

// Display Announcements
db.collection("announcements")
  .orderBy("timestamp", "desc")
  .onSnapshot(snapshot => {
    announcementsList.innerHTML = "";
    snapshot.forEach(doc => {
      const announcement = doc.data();
      const announcementElement = document.createElement("div");
      announcementElement.innerHTML = `<strong>📢 Announcement:</strong> ${announcement.text}`;
      announcementsList.appendChild(announcementElement);
    });
  });

// Create Poll (Admin Only)
createPollBtn.addEventListener("click", () => {
  const question = pollQuestion.value.trim();
  const option1 = pollOption1.value.trim();
  const option2 = pollOption2.value.trim();
  if (question && option1 && option2) {
    db.collection("polls").add({
      question: question,
      options: [option1, option2],
      votes: {},
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
    pollQuestion.value = "";
    pollOption1.value = "";
    pollOption2.value = "";
  }
});

// Display Polls
db.collection("polls")
  .orderBy("timestamp", "desc")
  .onSnapshot(snapshot => {
    pollsList.innerHTML = "";
    snapshot.forEach(doc => {
      const poll = doc.data();
      const pollElement = document.createElement("div");
      pollElement.innerHTML = `
        <strong>📊 ${poll.question}</strong><br>
        ${poll.options.map((opt, i) => `
          <div>
            <input type="radio" name="poll-${doc.id}" id="opt-${doc.id}-${i}" value="${i}">
            <label for="opt-${doc.id}-${i}">${opt}</label>
          </div>
        `).join("")}
        <button onclick="vote('${doc.id}')">Vote</button>
      `;
      pollsList.appendChild(pollElement);
    });
  });

// Vote on Poll
window.vote = function(pollId) {
  const selectedOption = document.querySelector(`input[name="poll-${pollId}"]:checked`);
  if (selectedOption) {
    const user = auth.currentUser;
    if (user) {
      db.collection("polls").doc(pollId).update({
        [`votes.${user.uid}`]: parseInt(selectedOption.value)
      });
    }
  }
};

// Submit Suggestion
submitSuggestionBtn.addEventListener("click", () => {
  const suggestionText = suggestionInput.value.trim();
  if (suggestionText) {
    const user = auth.currentUser;
    if (user) {
      db.collection("users").doc(user.uid).get()
        .then(doc => {
          const penName = doc.exists && doc.data().penName ? doc.data().penName : "Anonymous";
          db.collection("suggestions").add({
            text: suggestionText,
            penName: penName,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
          });
          suggestionInput.value = "";
        });
    }
  }
});

// Display Suggestions
db.collection("suggestions")
  .orderBy("timestamp", "desc")
  .onSnapshot(snapshot => {
    suggestionsList.innerHTML = "";
    snapshot.forEach(doc => {
      const suggestion = doc.data();
      const suggestionElement = document.createElement("div");
      suggestionElement.innerHTML = `<strong>${suggestion.penName}:</strong> ${suggestion.text}`;
      suggestionsList.appendChild(suggestionElement);
    });
  });
