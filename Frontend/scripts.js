const form = document.querySelector("#chat-form");
const questionInput = document.querySelector("#question");
const messages = document.querySelector("#messages");

form.addEventListener("submit", async function (event) {
  event.preventDefault();

  const question = questionInput.value.trim();

  if (question === "") {
    return;
  }

  addMessage(question, "user");
  questionInput.value = "";
  questionInput.focus();

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

    addMessage(data.answer, "assistant");
  } catch (error) {
    addMessage(
      `Sorry, I couldn't get an answer: ${error.message}`,
      "assistant"
    );
  }
});

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

    saveButton.addEventListener("click", function () {
      const updatedText = editor.value.trim();

      if (updatedText !== "") {
        textElement.textContent = updatedText;
      }

      message.replaceChild(textElement, editor);
      actions.replaceChildren(copyButton, editButton);
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
}