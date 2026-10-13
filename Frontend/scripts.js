const form = document.querySelector("#chat-form");
const questionInput = document.querySelector("#question");
const messages = document.querySelector("#messages");

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const question = questionInput.value.trim();

  if (question === "") {
    return;
  }

  const questionMessage = addMessage(question, "user");
  questionInput.value = "";
  questionInput.focus();

  await getAnswer(question, questionMessage);
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
      body: JSON.stringify({ question: question })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Something went wrong.");
    }

    // Ignore an older response if the same question was edited again.
    if (thisRequest === questionMessage.requestNumber) {
      answerMessage.querySelector(".message-text").textContent = data.answer;
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

  const textElement = document.createElement("p");
  textElement.classList.add("message-text");
  textElement.textContent = text;

  const actions = document.createElement("div");
  actions.classList.add("message-actions");

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.textContent = "Copy";

  copyButton.addEventListener("click", async function () {
    try {
      await navigator.clipboard.writeText(textElement.textContent);
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
    editor.value = textElement.textContent;
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

      textElement.textContent = updatedText;
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