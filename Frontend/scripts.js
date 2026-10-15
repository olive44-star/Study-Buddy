const form = document.querySelector("#chat-form");
const questionInput = document.querySelector("#question");
const messages = document.querySelector("#messages");



let ageRange = null;
let questionWaitingForAge = null;
let waitingForAgeRange = false;
function renderMessage(element, markdown) {
  element.dataset.markdown = markdown;
  element.innerHTML = DOMPurify.sanitize(marked.parse(markdown));
}

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const answer = questionInput.value.trim();

  if (answer === "") {
    return;
  }

  questionInput.value = "";
  questionInput.focus();

  // The user's next message supplies their age range.
  if (waitingForAgeRange) {
    ageRange = answer;
    addMessage(answer, "user");
    waitingForAgeRange = false;

    const pending = questionWaitingForAge;
    questionWaitingForAge = null;

    await getAnswer(pending.question, pending.message);
    return;
  }

  const questionMessage = addMessage(answer, "user");

  // Ask once, after the first question in this chat session.
  if (ageRange === null) {
    questionWaitingForAge = {
      question: answer,
      message: questionMessage
    };
    waitingForAgeRange = true;

    addMessage(
      "Before I answer, what age range should I tailor this for? For example: 6–8, 9–11, 12–14, 15–17, or 18+.",
      "assistant"
    );
    return;
  }

  await getAnswer(answer, questionMessage);
});

async function getAnswer(question, questionMessage) {
  // Reuse this question's existing answer when it is edited.
  let answerMessage = questionMessage.replyMessage;

  if (answerMessage) {
    answerMessage.querySelector(".message-text").textContent = "Thinking…";
  } else {
    answerMessage = addMessage("Thinking…", "assistant");
    questionMessage.replyMessage = answerMessage;
  }

  questionMessage.requestNumber = (questionMessage.requestNumber || 0) + 1;
  const thisRequest = questionMessage.requestNumber;

  try {
    const response = await fetch("http://127.0.0.1:8000/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
body: JSON.stringify({
  question: question,
  age_range: ageRange
})
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Something went wrong.");
    }

    // Ignore an older response if the same question was edited again.
    if (thisRequest === questionMessage.requestNumber) {
    renderMessage(answerMessage.querySelector(".message-text"), data.answer);      
    }
  } catch (error) {
    if (thisRequest === questionMessage.requestNumber) {
      answerMessage.querySelector(".message-text").textContent =
        `Sorry, I couldn't get an answer: ${error.message}`;
    }
  }
}

function addMessage(text, sender) {
  const message = document.createElement("div");
  message.classList.add("message", sender);

  const textElement = document.createElement("div");
textElement.classList.add("message-text");
renderMessage(textElement, text);

  const actions = document.createElement("div");
  actions.classList.add("message-actions");

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.textContent = "Copy";

  copyButton.addEventListener("click", async function () {
    try {
      await navigator.clipboard.writeText(textElement.innerText);
      copyButton.textContent = "Copied!";

      setTimeout(function () {
        copyButton.textContent = "Copy";
      }, 1200);
    } catch {
      copyButton.textContent = "Copy failed";
    }
  });

  const editButton = document.createElement("button");
  editButton.type = "button";
  editButton.textContent = "Edit";

  editButton.addEventListener("click", function () {
    const editor = document.createElement("textarea");
    editor.value = textElement.dataset.markdown || textElement.innerText;
    editor.classList.add("message-editor");

    const saveButton = document.createElement("button");
    saveButton.type = "button";
    saveButton.textContent = "Save";

    const cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.textContent = "Cancel";

    saveButton.addEventListener("click", async function () {
      const updatedText = editor.value.trim();

      if (updatedText === "") {
        return;
      }

    renderMessage(textElement, updatedText);
      message.replaceChild(textElement, editor);
      actions.replaceChildren(copyButton, editButton);

      // Editing a question asks the AI again and updates its answer.
      if (sender === "user") {
        await getAnswer(updatedText, message);
      }
    });

    cancelButton.addEventListener("click", function () {
      message.replaceChild(textElement, editor);
      actions.replaceChildren(copyButton, editButton);
    });

    message.replaceChild(editor, textElement);
    actions.replaceChildren(saveButton, cancelButton);
    editor.focus();
  });

  actions.append(copyButton, editButton);
  message.append(textElement, actions);
  messages.appendChild(message);
  messages.scrollTop = messages.scrollHeight;

  return message;
}