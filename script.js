/**
 * MCP.ToDo - Task Management Application
 * AI-Driven Development Proof of Concept
 * 
 * This file implements the core functionality for adding new tasks
 * as specified in GitHub Issue #1
 */

class TodoApp {
    constructor() {
        this.tasks = [];
        this.taskIdCounter = 1;
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.loadTasksFromStorage();
        this.bindEvents();
        this.renderTasks();
        this.updateTaskCount();
        
        // Focus on input field for better UX
        document.getElementById('taskInput').focus();
        
        console.log('MCP.ToDo initialized successfully');
    }

    /**
     * Bind event listeners to UI elements
     */
    bindEvents() {
        const taskInput = document.getElementById('taskInput');
        const addTaskBtn = document.getElementById('addTaskBtn');

        // Add task button click
        addTaskBtn.addEventListener('click', () => this.handleAddTask());

        // Enter key submission
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleAddTask();
            }
        });

        // Input validation on typing
        taskInput.addEventListener('input', () => this.clearMessages());

        // Handle paste events
        taskInput.addEventListener('paste', (e) => {
            setTimeout(() => this.clearMessages(), 10);
        });
    }

    /**
     * Handle adding a new task
     */
    handleAddTask() {
        const taskInput = document.getElementById('taskInput');
        const taskText = taskInput.value.trim();

        // Clear any existing messages
        this.clearMessages();

        // Validate input
        if (!this.validateTaskInput(taskText)) {
            return;
        }

        // Create and add the task
        const task = this.createTask(taskText);
        this.addTask(task);

        // Clear input and provide feedback
        taskInput.value = '';
        taskInput.focus();
        
        this.showSuccessMessage('Task added successfully!');
        
        // Auto-hide success message after 2 seconds
        setTimeout(() => this.clearMessages(), 2000);
    }

    /**
     * Validate task input
     * @param {string} taskText - The task text to validate
     * @returns {boolean} - Whether the input is valid
     */
    validateTaskInput(taskText) {
        if (!taskText) {
            this.showErrorMessage('Please enter a task description');
            return false;
        }

        if (taskText.length > 500) {
            this.showErrorMessage('Task description must be less than 500 characters');
            return false;
        }

        // Check for duplicate tasks
        const isDuplicate = this.tasks.some(task => 
            task.text.toLowerCase() === taskText.toLowerCase()
        );

        if (isDuplicate) {
            this.showErrorMessage('This task already exists');
            return false;
        }

        return true;
    }

    /**
     * Create a new task object
     * @param {string} text - The task description
     * @returns {object} - The task object
     */
    createTask(text) {
        return {
            id: this.taskIdCounter++,
            text: text,
            completed: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }

    /**
     * Add a task to the list
     * @param {object} task - The task to add
     */
    addTask(task) {
        this.tasks.push(task);
        this.saveTasksToStorage();
        this.renderTasks();
        this.updateTaskCount();
    }

    /**
     * Render all tasks in the UI
     */
    renderTasks() {
        const taskList = document.getElementById('taskList');
        const emptyState = document.getElementById('emptyState');

        // Clear current tasks
        taskList.innerHTML = '';

        if (this.tasks.length === 0) {
            // Show empty state
            emptyState.style.display = 'flex';
            return;
        }

        // Hide empty state
        emptyState.style.display = 'none';

        // Render each task
        this.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            taskList.appendChild(taskElement);
        });
    }

    /**
     * Create a DOM element for a task
     * @param {object} task - The task object
     * @returns {HTMLElement} - The task list item element
     */
    createTaskElement(task) {
        const li = document.createElement('li');
        li.className = `task-item${task.completed ? ' completed' : ''}`;
        li.setAttribute('data-task-id', task.id);
        li.setAttribute('role', 'listitem');

        const checkboxId = `task-checkbox-${task.id}`;
        const createdDate = new Date(task.createdAt).toLocaleDateString();
        
        li.innerHTML = `
            <div class="task-checkbox-container">
                <input 
                    type="checkbox" 
                    id="${checkboxId}"
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''}
                    aria-label="Mark task as ${task.completed ? 'incomplete' : 'complete'}"
                />
            </div>
            <label for="${checkboxId}" class="task-text">
                ${this.escapeHtml(task.text)}
            </label>
            <div class="task-metadata">
                <span class="task-timestamp">Added ${createdDate}</span>
                ${task.completed ? '<span class="completion-badge">✓ Done</span>' : ''}
            </div>
        `;

        // Add event listener for checkbox toggle
        const checkbox = li.querySelector('.task-checkbox');
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            this.toggleTaskCompletion(task.id);
        });

        // Add keyboard support for the task item
        li.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                this.toggleTaskCompletion(task.id);
            }
        });

        // Make task item focusable
        li.setAttribute('tabindex', '0');

        return li;
    }

    /**
     * Toggle the completion status of a task
     * @param {number} taskId - The ID of the task to toggle
     */
    toggleTaskCompletion(taskId) {
        const task = this.tasks.find(t => t.id === taskId);
        if (!task) {
            console.error(`Task with ID ${taskId} not found`);
            return;
        }

        // Toggle completion status
        task.completed = !task.completed;
        task.updatedAt = new Date().toISOString();
        
        if (task.completed) {
            task.completedAt = new Date().toISOString();
        } else {
            delete task.completedAt;
        }

        // Update storage and UI
        this.saveTasksToStorage();
        this.updateTaskElement(task);
        this.updateTaskCount();
        
        // Provide user feedback
        const message = task.completed 
            ? 'Task marked as complete!' 
            : 'Task marked as incomplete';
        this.showSuccessMessage(message);
        
        // Auto-hide success message
        setTimeout(() => this.clearMessages(), 1500);
        
        // Announce to screen readers
        this.announceToScreenReader(
            task.completed 
                ? `Task "${task.text}" marked as complete`
                : `Task "${task.text}" marked as incomplete`
        );
    }

    /**
     * Update a specific task element in the UI
     * @param {object} task - The task object to update
     */
    updateTaskElement(task) {
        const taskElement = document.querySelector(`[data-task-id="${task.id}"]`);
        if (!taskElement) return;

        const checkbox = taskElement.querySelector('.task-checkbox');
        const metadata = taskElement.querySelector('.task-metadata');
        
        // Update completion class and checkbox state
        if (task.completed) {
            taskElement.classList.add('completed');
            checkbox.checked = true;
            checkbox.setAttribute('aria-label', 'Mark task as incomplete');
            
            // Add completion badge if not exists
            if (!metadata.querySelector('.completion-badge')) {
                const badge = document.createElement('span');
                badge.className = 'completion-badge';
                badge.innerHTML = '✓ Done';
                metadata.appendChild(badge);
            }
        } else {
            taskElement.classList.remove('completed');
            checkbox.checked = false;
            checkbox.setAttribute('aria-label', 'Mark task as complete');
            
            // Remove completion badge
            const badge = metadata.querySelector('.completion-badge');
            if (badge) {
                badge.remove();
            }
        }
    }

    /**
     * Update the task counter display
     */
    updateTaskCount() {
        const taskCountElement = document.getElementById('taskCount');
        const completedCountElement = document.getElementById('completedCount');
        
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        
        taskCountElement.textContent = totalTasks;
        completedCountElement.textContent = completedTasks;
        
        // Update document title with completion status
        if (totalTasks === 0) {
            document.title = 'MCP.ToDo - AI-Driven Task Management';
        } else if (completedTasks === totalTasks) {
            document.title = `MCP.ToDo - All tasks completed! ✓`;
        } else {
            document.title = `MCP.ToDo (${totalTasks - completedTasks} pending)`;
        }
        
        // Update completion stats visibility
        const completionStats = document.querySelector('.completion-stats');
        if (completionStats) {
            if (totalTasks > 0) {
                completionStats.style.display = 'flex';
            } else {
                completionStats.style.display = 'none';
            }
        }
    }


    /**
     * Show error message to user
     * @param {string} message - The error message to display
     */
    showErrorMessage(message) {
        const errorElement = document.getElementById('inputError');
        errorElement.textContent = message;
        errorElement.classList.add('show');
        
        // Hide any existing success message
        this.hideSuccessMessage();
        
        // Auto-hide after 5 seconds
        setTimeout(() => this.hideErrorMessage(), 5000);
    }

    /**
     * Show success message to user
     * @param {string} message - The success message to display
     */
    showSuccessMessage(message) {
        const successElement = document.getElementById('successMessage');
        successElement.textContent = message;
        successElement.classList.add('show');
        
        // Hide any existing error message
        this.hideErrorMessage();
    }

    /**
     * Hide error message
     */
    hideErrorMessage() {
        const errorElement = document.getElementById('inputError');
        errorElement.classList.remove('show');
        setTimeout(() => errorElement.textContent = '', 200);
    }

    /**
     * Hide success message
     */
    hideSuccessMessage() {
        const successElement = document.getElementById('successMessage');
        successElement.classList.remove('show');
        setTimeout(() => successElement.textContent = '', 200);
    }

    /**
     * Clear all messages
     */
    clearMessages() {
        this.hideErrorMessage();
        this.hideSuccessMessage();
    }

    /**
     * Save tasks to localStorage
     */
    saveTasksToStorage() {
        try {
            const data = {
                tasks: this.tasks,
                taskIdCounter: this.taskIdCounter,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem('mcp-todo-data', JSON.stringify(data));
        } catch (error) {
            console.error('Failed to save tasks to localStorage:', error);
            this.showErrorMessage('Failed to save tasks. Your changes may not persist.');
        }
    }

    /**
     * Load tasks from localStorage
     */
    loadTasksFromStorage() {
        try {
            const stored = localStorage.getItem('mcp-todo-data');
            if (stored) {
                const data = JSON.parse(stored);
                this.tasks = data.tasks || [];
                this.taskIdCounter = data.taskIdCounter || 1;
                
                console.log(`Loaded ${this.tasks.length} tasks from localStorage`);
            }
        } catch (error) {
            console.error('Failed to load tasks from localStorage:', error);
            this.tasks = [];
            this.taskIdCounter = 1;
        }
    }

    /**
     * Escape HTML to prevent XSS attacks
     * @param {string} text - The text to escape
     * @returns {string} - The escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Announce message to screen readers
     * @param {string} message - Message to announce
     */
    announceToScreenReader(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        
        document.body.appendChild(announcement);
        
        // Remove after announcement
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    /**
     * Get application statistics
     * @returns {object} - Application statistics
     */
    getStats() {
        const completedTasks = this.tasks.filter(task => task.completed);
        const pendingTasks = this.tasks.filter(task => !task.completed);
        
        return {
            totalTasks: this.tasks.length,
            completedTasks: completedTasks.length,
            pendingTasks: pendingTasks.length,
            completionRate: this.tasks.length > 0 
                ? Math.round((completedTasks.length / this.tasks.length) * 100) 
                : 0,
            completedToday: completedTasks.filter(task => {
                if (!task.completedAt) return false;
                const today = new Date().toDateString();
                const completedDate = new Date(task.completedAt).toDateString();
                return today === completedDate;
            }).length
        };
    }
}

/**
 * Utility functions for localStorage management
 */
class StorageManager {
    static STORAGE_KEY = 'mcp-todo-data';

    /**
     * Check if localStorage is available
     * @returns {boolean} - Whether localStorage is supported
     */
    static isStorageSupported() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Get storage usage information
     * @returns {object} - Storage usage information
     */
    static getStorageInfo() {
        if (!this.isStorageSupported()) {
            return { supported: false };
        }

        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            const size = data ? new Blob([data]).size : 0;
            
            return {
                supported: true,
                size: size,
                sizeFormatted: this.formatBytes(size)
            };
        } catch (error) {
            return { supported: true, error: error.message };
        }
    }

    /**
     * Format bytes to human readable format
     * @param {number} bytes - Number of bytes
     * @returns {string} - Formatted string
     */
    static formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

/**
 * Initialize the application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    // Check for localStorage support
    if (!StorageManager.isStorageSupported()) {
        console.warn('localStorage is not supported. Tasks will not persist between sessions.');
    }

    // Initialize the todo app
    window.todoApp = new TodoApp();
    
    // Expose utilities for debugging
    window.StorageManager = StorageManager;
    
    // Log initialization
    console.log('MCP.ToDo application loaded successfully');
    console.log('Storage info:', StorageManager.getStorageInfo());
});