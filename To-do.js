let todos = JSON.parse(localStorage.getItem('todos')) || [];
let currentFilter = 'all';
let searchQuery = '';
let deletedTodos = [];
let isBulkSelecting = false;
let selectedTodos = new Set();
let currentTab = 'all';
const userPrefs = JSON.parse(localStorage.getItem('userPrefs')) || { sound: true, theme: 'light' };

document.addEventListener('DOMContentLoaded', () => {
    const nameInput = document.querySelector('#name');
    const newTodoForm = document.querySelector('#new-todo-form');
    const filterCategory = document.querySelector('#filter-category');
    const clearCompleted = document.querySelector('#clear-completed');
    const markAll = document.querySelector('#mark-all');
    const bulkSelect = document.querySelector('#bulk-select');
    const todoList = document.querySelector('#todo-list');
    const searchInput = document.querySelector('#search');
    const themeToggle = document.querySelector('#theme-toggle');
    const actionSound = document.querySelector('#action-sound');
    const tabs = document.querySelectorAll('.tab');
    const particlesContainer = document.querySelector('#particles');

    document.body.className = userPrefs.theme + '-theme';
    const username = localStorage.getItem('username') || '';
    nameInput.value = username;

    // Initialize particles
    createParticles(particlesContainer);

    nameInput.addEventListener('change', (e) => {
        localStorage.setItem('username', e.target.value);
    });

    newTodoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = e.target.elements.content.value.trim();
        if (!content) {
            showToast('Please enter a todo item', 'error');
            return;
        }

        const todo = {
            content,
            category: e.target.elements.category.value,
            priority: e.target.elements.priority.value,
            dueDate: e.target.elements.dueDate.value,
            done: false,
            createdAt: new Date().getTime(),
            id: crypto.randomUUID()
        };

        todos.push(todo);
        localStorage.setItem('todos', JSON.stringify(todos));
        e.target.reset();
        document.querySelector('#category1').checked = true;
        showToast('Todo added successfully', 'success');
        playSound();
        displayTodos();
    });

    filterCategory.addEventListener('change', (e) => {
        currentFilter = e.target.value;
        displayTodos();
    });

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        displayTodos();
    });

    clearCompleted.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all completed todos?')) {
            deletedTodos = todos.filter(todo => todo.done);
            todos = todos.filter(todo => !todo.done);
            localStorage.setItem('todos', JSON.stringify(todos));
            showToast('Completed todos cleared <button onclick="undoDelete()">Undo</button>', 'success');
            playSound();
            displayTodos();
        }
    });

    markAll.addEventListener('click', () => {
        const allDone = todos.every(todo => todo.done);
        todos = todos.map(todo => ({ ...todo, done: !allDone }));
        localStorage.setItem('todos', JSON.stringify(todos));
        showToast(allDone ? 'All todos marked incomplete' : 'All todos marked complete', 'success');
        playSound();
        displayTodos();
    });

    bulkSelect.addEventListener('click', () => {
        isBulkSelecting = !isBulkSelecting;
        bulkSelect.textContent = isBulkSelecting ? 'Done' : 'Select';
        selectedTodos.clear();
        displayTodos();
        if (isBulkSelecting) {
            showToast('Select todos for bulk actions', 'info');
        }
    });

    themeToggle.addEventListener('click', () => {
        userPrefs.theme = userPrefs.theme === 'light' ? 'dark' : 'light';
        document.body.className = userPrefs.theme + '-theme';
        localStorage.setItem('userPrefs', JSON.stringify(userPrefs));
        showToast(`Switched to ${userPrefs.theme} theme`, 'success');
        playSound();
    });

    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            e.target.classList.add('active');
            currentTab = e.target.dataset.tab;
            displayTodos();
        });
    });

    // Drag and drop
    todoList.addEventListener('dragstart', (e) => {
        if (e.target.classList.contains('todo-item') && !isBulkSelecting) {
            e.target.classList.add('dragging');
            e.dataTransfer.setData('text/plain', e.target.dataset.id);
        }
    });

    todoList.addEventListener('dragend', (e) => {
        if (e.target.classList.contains('todo-item')) {
            e.target.classList.remove('dragging');
        }
    });

    todoList.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(todoList, e.clientY);
        const draggable = document.querySelector('.dragging');
        if (afterElement == null) {
            todoList.appendChild(draggable);
        } else {
            todoList.insertBefore(draggable, afterElement);
        }
    });

    todoList.addEventListener('drop', (e) => {
        e.preventDefault();
        const id = e.dataTransfer.getData('text');
        const draggable = document.querySelector(`[data-id="${id}"]`);
        const dropIndex = Array.from(todoList.children).indexOf(draggable);
        
        const draggedTodo = todos.find(todo => todo.id === id);
        todos.splice(todos.indexOf(draggedTodo), 1);
        todos.splice(dropIndex, 0, draggedTodo);
        
        localStorage.setItem('todos', JSON.stringify(todos));
        showToast('Todo reordered', 'success');
        playSound();
        displayTodos();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isBulkSelecting) {
            isBulkSelecting = false;
            bulkSelect.textContent = 'Select';
            selectedTodos.clear();
            displayTodos();
        }
    });

    // Ripple effect on buttons
    document.querySelectorAll('button, input[type="submit"]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            const rect = btn.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            ripple.style.width = ripple.style.height = `${size}px`;
            ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
            ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
            btn.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // Parallax effect
    document.addEventListener('mousemove', (e) => {
        const x = (window.innerWidth - e.pageX * 10) / 100;
        const y = (window.innerHeight - e.pageY * 10) / 100;
        particlesContainer.style.transform = `translate(${x}px, ${y}px)`;
    });

    displayTodos();
});

function createParticles(container) {
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 5}s`;
        container.appendChild(particle);
    }
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.todo-item:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        }
        return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function showToast(message, type) {
    const toast = document.querySelector('#toast');
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    toast.innerHTML = `<span class="toast-icon">${icon}</span> ${message}`;
    toast.className = `toast ${type}`;
    toast.style.opacity = '1';
    toast.style.transform = 'translateY(0)';
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
    }, 5000);
}

function playSound() {
    if (userPrefs.sound) {
        const sound = document.querySelector('#action-sound');
        sound.currentTime = 0;
        sound.play().catch(() => {});
    }
}

function undoDelete() {
    todos = [...todos, ...deletedTodos];
    deletedTodos = [];
    localStorage.setItem('todos', JSON.stringify(todos));
    showToast('Todos restored', 'success');
    playSound();
    displayTodos();
}

function displayTodos() {
    const todoList = document.querySelector('#todo-list');
    const todoCount = document.querySelector('#todo-count');
    const emptyState = document.querySelector('#empty-state');
    const progressCircle = document.querySelector('#progress-circle');
    const progressFill = progressCircle.querySelector('.progress-fill');
    const progressText = progressCircle.querySelector('.progress-text');
    const allCount = document.querySelector('#all-count');
    const activeCount = document.querySelector('#active-count');
    const completedCount = document.querySelector('#completed-count');

    todoList.innerHTML = '';
    todoList.classList.add('loading');

    setTimeout(() => {
        todoList.classList.remove('loading');
        
        let filteredTodos = todos
            .filter(todo => currentFilter === 'all' || todo.category === currentFilter)
            .filter(todo => todo.content.toLowerCase().includes(searchQuery));

        if (currentTab === 'active') {
            filteredTodos = filteredTodos.filter(todo => !todo.done);
        } else if (currentTab === 'completed') {
            filteredTodos = filteredTodos.filter(todo => todo.done);
        }

        emptyState.style.display = filteredTodos.length === 0 ? 'block' : 'none';

        filteredTodos.forEach((todo) => {
            const todoItem = document.createElement('div');
            todoItem.classList.add('todo-item');
            todoItem.setAttribute('draggable', !isBulkSelecting);
            todoItem.dataset.id = todo.id;
            todoItem.setAttribute('role', 'listitem');
            todoItem.style.animation = 'flipIn 0.5s ease';
            if (selectedTodos.has(todo.id)) {
                todoItem.classList.add('selected');
            }

            const label = document.createElement('label');
            const input = document.createElement('input');
            const span = document.createElement('span');
            const content = document.createElement('div');
            const actions = document.createElement('div');
            const edit = document.createElement('button');
            const deleteButton = document.createElement('button');
            const timestamp = document.createElement('div');
            const bulkCheckbox = document.createElement('input');
            const meta = document.createElement('div');
            const priority = document.createElement('span');
            const dueDate = document.createElement('span');

            input.type = 'checkbox';
            input.checked = todo.done;
            input.setAttribute('aria-label', `Mark ${todo.content} as ${todo.done ? 'incomplete' : 'complete'}`);
            span.classList.add('bubble');
            span.classList.add(todo.category);
            span.innerHTML = `<i class="icon">${todo.category === 'business' ? '💼' : '🏠'}</i>`;

            content.classList.add('todo-content');
            actions.classList.add('actions');
            edit.classList.add('edit');
            deleteButton.classList.add('delete');
            timestamp.classList.add('timestamp');
            bulkCheckbox.classList.add('bulk-checkbox');
            meta.classList.add('meta');
            priority.classList.add('priority', todo.priority);
            dueDate.classList.add('due-date');
            
            content.innerHTML = `<input type="text" value="${todo.content}" readonly aria-label="Todo content">`;
            edit.innerHTML = 'Edit';
            edit.title = 'Edit this todo';
            edit.setAttribute('aria-label', `Edit ${todo.content}`);
            deleteButton.innerHTML = 'Delete';
            deleteButton.title = 'Delete this todo';
            deleteButton.setAttribute('aria-label', `Delete ${todo.content}`);
            timestamp.textContent = new Date(todo.createdAt).toLocaleDateString();
            bulkCheckbox.type = 'checkbox';
            bulkCheckbox.checked = selectedTodos.has(todo.id);
            bulkCheckbox.style.display = isBulkSelecting ? 'block' : 'none';
            bulkCheckbox.setAttribute('aria-label', `Select ${todo.content} for bulk actions`);
            priority.textContent = todo.priority.charAt(0).toUpperCase() + todo.priority.slice(1);
            dueDate.textContent = todo.dueDate ? `Due: ${new Date(todo.dueDate).toLocaleDateString()}` : '';

            label.appendChild(input);
            label.appendChild(span);
            meta.appendChild(priority);
            meta.appendChild(dueDate);
            actions.appendChild(edit);
            actions.appendChild(deleteButton);
            todoItem.appendChild(bulkCheckbox);
            todoItem.appendChild(label);
            todoItem.appendChild(content);
            todoItem.appendChild(meta);
            todoItem.appendChild(timestamp);
            todoItem.appendChild(actions);
            todoList.appendChild(todoItem);

            if (todo.done) {
                todoItem.classList.add('done');
            }

            input.addEventListener('click', (e) => {
                todo.done = e.target.checked;
                localStorage.setItem('todos', JSON.stringify(todos));
                showToast(todo.done ? 'Todo marked complete' : 'Todo marked incomplete', 'success');
                playSound();
                displayTodos();
            });

            edit.addEventListener('click', () => {
                const input = content.querySelector('input');
                input.removeAttribute('readonly');
                input.focus();

                input.addEventListener('blur', (e) => {
                    input.setAttribute('readonly', true);
                    const newContent = e.target.value.trim();
                    if (newContent) {
                        todo.content = newContent;
                        localStorage.setItem('todos', JSON.stringify(todos));
                        showToast('Todo updated successfully', 'success');
                        playSound();
                        displayTodos();
                    } else {
                        showToast('Todo content cannot be empty', 'error');
                    }
                });

                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        input.blur();
                    }
                });
            });

            deleteButton.addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete "${todo.content}"?`)) {
                    deletedTodos = [todo];
                    todos = todos.filter((t) => t !== todo);
                    localStorage.setItem('todos', JSON.stringify(todos));
                    showToast('Todo deleted <button onclick="undoDelete()">Undo</button>', 'success');
                    playSound();
                    displayTodos();
                }
            });

            bulkCheckbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    selectedTodos.add(todo.id);
                } else {
                    selectedTodos.delete(todo.id);
                }
                displayTodos();
            });

            todoItem.addEventListener('click', (e) => {
                if (isBulkSelecting && e.target !== input && e.target !== edit && e.target !== deleteButton) {
                    bulkCheckbox.checked = !bulkCheckbox.checked;
                    bulkCheckbox.dispatchEvent(new Event('change'));
                }
            });
        });

        const remainingTodos = filteredTodos.filter(todo => !todo.done).length;
        todoCount.textContent = `${remainingTodos} item${remainingTodos !== 1 ? 's' : ''} left`;

        allCount.textContent = todos.length;
        activeCount.textContent = todos.filter(todo => !todo.done).length;
        completedCount.textContent = todos.filter(todo => todo.done).length;

        const completionPercentage = filteredTodos.length > 0 
            ? Math.round((filteredTodos.length - remainingTodos) / filteredTodos.length * 100)
            : 0;
        progressFill.style.strokeDasharray = `${completionPercentage}, 100`;
        progressText.textContent = `${completionPercentage}%`;
        progressCircle.setAttribute('aria-valuenow', completionPercentage);
    }, 300);
}
