let taskList = [];
let currentFilter = 'all';
let folderStates = {};

window.onload = function () {
  const savedTasks = localStorage.getItem("tasks");
  const savedFolders = localStorage.getItem("folderStates");
  const theme = localStorage.getItem("theme");

  if (savedTasks) taskList = JSON.parse(savedTasks);
  if (savedFolders) folderStates = JSON.parse(savedFolders);
  if (theme === 'dark') document.body.classList.add('dark');

  setGreeting();
  animatePlaceholder("e.g. Finish assignment...");
  setQuote();
  refreshTaskList();
};

function addTask() {
  const taskInput = document.getElementById('taskInput');
  const folderInput = document.getElementById('folderInput');
  const taskText = taskInput.value.trim();
  const folder = folderInput.value.trim() || "General";

  if (taskText === '') return;

  const task = {
    text: taskText,
    folder,
    completed: false,
    createdAt: new Date().toISOString()
  };

  taskList.push(task);
  saveTasks();
  taskInput.value = '';
  folderInput.value = '';
  refreshTaskList();
}

function renderTask(task, index) {
  const li = document.createElement('li');

  const numberSpan = document.createElement('span');
  numberSpan.textContent = `${index + 1}. `;
  numberSpan.style.fontWeight = 'bold';
  numberSpan.style.marginRight = '6px';
  li.appendChild(numberSpan);

  const span = document.createElement('span');
  span.textContent = task.text;

  if (task.completed) li.classList.add('completed');

  span.ondblclick = () => {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = task.text;
    input.className = 'edit-input';

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        task.text = input.value.trim();
        saveTasks();
        refreshTaskList();
      }
    });

    input.addEventListener('blur', () => {
      task.text = input.value.trim();
      saveTasks();
      refreshTaskList();
    });

    li.replaceChild(input, span);
    input.focus();
  };

  span.addEventListener('click', () => {
    task.completed = !task.completed;
    saveTasks();
    refreshTaskList();
  });

  li.appendChild(span);

  const date = new Date(task.createdAt).toLocaleDateString();
  const dateSpan = document.createElement('small');
  dateSpan.textContent = `Added on: ${date}`;
  dateSpan.style.fontSize = '12px';
  dateSpan.style.color = '#888';
  li.appendChild(document.createElement("br"));
  li.appendChild(dateSpan);

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.classList.add('task-checkbox');
  checkbox.setAttribute('data-id', task.createdAt);
  checkbox.style.marginLeft = 'auto';
  checkbox.style.marginTop = '6px';
  li.appendChild(checkbox);

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '❌';
  deleteBtn.style.marginLeft = '10px';
  deleteBtn.onclick = () => {
    taskList = taskList.filter(t => t.createdAt !== task.createdAt);
    saveTasks();
    refreshTaskList();
  };
  li.appendChild(deleteBtn);

  return li;
}

function refreshTaskList() {
  document.getElementById('folderContainer').innerHTML = '';
  const grouped = {};

  taskList
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .forEach(task => {
      if (!grouped[task.folder]) grouped[task.folder] = [];
      grouped[task.folder].push(task);
    });

  Object.keys(grouped).forEach(folderName => {
    const section = document.createElement('div');
    section.classList.add('folder-section');

    const titleWrapper = document.createElement('div');
    titleWrapper.classList.add('folder-title');

    const toggleBtn = document.createElement('button');
    toggleBtn.textContent = folderStates[folderName] ? '🔽' : '▶️';
    toggleBtn.style.marginRight = '8px';
    toggleBtn.onclick = () => {
      folderStates[folderName] = !folderStates[folderName];
      saveFolderStates();
      refreshTaskList();
    };
    titleWrapper.appendChild(toggleBtn);

    const titleText = document.createElement('span');
    titleText.textContent = folderName;
    titleText.style.cursor = 'pointer';

    titleText.ondblclick = () => {
      const input = document.createElement('input');
      input.type = 'text';
      input.value = folderName;
      input.className = 'edit-input';

      input.onkeydown = (e) => {
        if (e.key === 'Enter') renameFolder(folderName, input.value.trim());
      };
      input.onblur = () => renameFolder(folderName, input.value.trim());

      titleWrapper.replaceChild(input, titleText);
      input.focus();
    };

    titleWrapper.appendChild(titleText);

    const deleteFolderBtn = document.createElement('button');
    deleteFolderBtn.textContent = '🗑️';
    deleteFolderBtn.style.marginLeft = '10px';
    deleteFolderBtn.onclick = () => {
      if (confirm(`Delete folder "${folderName}" and all its tasks?`)) {
        taskList = taskList.filter(t => t.folder !== folderName);
        delete folderStates[folderName];
        saveTasks();
        saveFolderStates();
        refreshTaskList();
      }
    };
    titleWrapper.appendChild(deleteFolderBtn);

    section.appendChild(titleWrapper);

    const ul = document.createElement('ul');
    if (folderStates[folderName]) {
      grouped[folderName].forEach((task, idx) => {
        if (
          currentFilter === 'all' ||
          (currentFilter === 'active' && !task.completed) ||
          (currentFilter === 'completed' && task.completed)
        ) {
          ul.appendChild(renderTask(task, idx));
        }
      });
    }
    section.appendChild(ul);
    document.getElementById('folderContainer').appendChild(section);
  });
}

function renameFolder(oldName, newName) {
  if (!newName || newName === oldName) return;
  taskList.forEach(task => {
    if (task.folder === oldName) task.folder = newName;
  });

  if (folderStates[oldName] !== undefined) {
    folderStates[newName] = folderStates[oldName];
    delete folderStates[oldName];
  }

  saveTasks();
  saveFolderStates();
  refreshTaskList();
}

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(taskList));
}

function saveFolderStates() {
  localStorage.setItem('folderStates', JSON.stringify(folderStates));
}

function filterTasks(filterType) {
  currentFilter = filterType;
  refreshTaskList();
}

function deleteSelected() {
  const checkboxes = document.querySelectorAll('.task-checkbox:checked');
  if (checkboxes.length === 0) {
    alert("No tasks selected 😅");
    return;
  }
  const selectedIds = Array.from(checkboxes).map(cb => cb.dataset.id);
  taskList = taskList.filter(task => !selectedIds.includes(task.createdAt));
  saveTasks();
  refreshTaskList();
}

function toggleTheme() {
  document.body.classList.toggle('dark');
  localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

function setGreeting() {
  const hour = new Date().getHours();
  let greet = "Hey!";
  if (hour < 12) greet = "Good morning! 🌅";
  else if (hour < 18) greet = "Good afternoon! ☀️";
  else greet = "Good evening! 🌙";
  document.getElementById("greeting").textContent = `${greet} What’s on your mind today?`;
}

function animatePlaceholder(text, speed = 80) {
  const input = document.getElementById("taskInput");
  let i = 0;
  function typing() {
    if (i < text.length) {
      input.setAttribute("placeholder", text.substring(0, i + 1));
      i++;
      setTimeout(typing, speed);
    }
  }
  typing();
}

function startListening() {
  const micBtn = document.getElementById("micBtn");

  if (!('webkitSpeechRecognition' in window)) {
    alert("Speech recognition not supported in this browser 😢");
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.lang = 'en-IN';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  micBtn.classList.add("listening");

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript.trim();
    document.getElementById("taskInput").value = transcript;
    addTask();
  };

  recognition.onerror = function (event) {
    alert("Error during speech recognition: " + event.error);
  };

  recognition.onend = function () {
    micBtn.classList.remove("listening");
  };

  recognition.start();
}

const quotes = [
  "You're doing amazing, keep going! 🚀",
  "Let’s make today productive 💪",
  "Small steps every day = Big results ✨",
  "Stay focused and never give up 🔥",
  "Progress, not perfection 🧠",
  "Your future self will thank you 🙌"
];

function setQuote() {
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  document.getElementById("quote").textContent = quote;
}
