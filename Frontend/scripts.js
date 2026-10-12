const form = document.querySelector("#chat-form");
const questionInput = document.querySelector("#question");
const messages = document.querySelector("#messages");

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const question = questionInput.value.trim();

  if (question === "") {
    return;
  }

  addMessage(question, "user");
  questionInput.value = "";
  questionInput.focus();
});

function addMessage(text, sender) {
  const message = document.createElement("p");

  message.classList.add("message", sender);
  message.textContent = text;

  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;
}