// Content script for element marking and form filling

let isMarkingMode = false;
let currentProjectId = null;
let highlightedElement = null;
let markingOverlay = null;
let markingTooltip = null;
let nameDialog = null;

// ===== Message Listener =====
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'startMarking') {
        startMarkingMode(message.projectId);
        sendResponse({ success: true });
    } else if (message.action === 'executeFill') {
        executeFill(message.elements, message.values);
        sendResponse({ success: true });
    }
    return true;
});

// ===== Marking Mode =====
function startMarkingMode(projectId) {
    if (isMarkingMode) return;

    isMarkingMode = true;
    currentProjectId = projectId;

    createMarkingUI();
    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown, true);
}

function stopMarkingMode() {
    isMarkingMode = false;
    currentProjectId = null;

    removeMarkingUI();
    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('keydown', handleKeyDown, true);

    if (highlightedElement) {
        highlightedElement.style.outline = '';
        highlightedElement = null;
    }
}

function createMarkingUI() {
    // Create overlay
    markingOverlay = document.createElement('div');
    markingOverlay.id = 'qff-marking-overlay';
    markingOverlay.innerHTML = `
    <div class="qff-marking-bar">
      <span class="qff-marking-icon">🎯</span>
      <span class="qff-marking-text">标记模式已启用 - 点击要标记的元素</span>
      <button class="qff-marking-exit">退出 (ESC)</button>
    </div>
  `;
    document.body.appendChild(markingOverlay);

    markingOverlay.querySelector('.qff-marking-exit').addEventListener('click', stopMarkingMode);

    // Create tooltip
    markingTooltip = document.createElement('div');
    markingTooltip.id = 'qff-marking-tooltip';
    markingTooltip.style.display = 'none';
    document.body.appendChild(markingTooltip);
}

function removeMarkingUI() {
    if (markingOverlay) {
        markingOverlay.remove();
        markingOverlay = null;
    }
    if (markingTooltip) {
        markingTooltip.remove();
        markingTooltip = null;
    }
    if (nameDialog) {
        nameDialog.remove();
        nameDialog = null;
    }
}

// ===== Event Handlers =====
function handleMouseOver(e) {
    if (!isMarkingMode || nameDialog) return;

    const target = e.target;
    if (isMarkableElement(target) && !isOurElement(target)) {
        if (highlightedElement) {
            highlightedElement.style.outline = '';
        }
        highlightedElement = target;
        target.style.outline = '2px solid #6366f1';
        target.style.outlineOffset = '2px';

        updateTooltip(target, e);
    }
}

function handleMouseOut(e) {
    if (!isMarkingMode || nameDialog) return;

    const target = e.target;
    if (target === highlightedElement) {
        target.style.outline = '';
        highlightedElement = null;
        if (markingTooltip) markingTooltip.style.display = 'none';
    }
}

function handleClick(e) {
    if (!isMarkingMode) return;
    if (isOurElement(e.target)) return;

    if (highlightedElement && isMarkableElement(highlightedElement)) {
        e.preventDefault();
        e.stopPropagation();
        showNameDialog(highlightedElement);
    }
}

function handleKeyDown(e) {
    if (e.key === 'Escape') {
        if (nameDialog) {
            nameDialog.remove();
            nameDialog = null;
        } else {
            stopMarkingMode();
        }
    }
}

// ===== Helper Functions =====
function isMarkableElement(el) {
    const tagName = el.tagName.toLowerCase();
    const type = el.type ? el.type.toLowerCase() : '';

    // Input elements
    if (tagName === 'input') {
        const validTypes = ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date', 'datetime-local', 'month', 'week', 'time', 'color'];
        return validTypes.includes(type) || !type;
    }

    // Other form elements
    if (['textarea', 'select'].includes(tagName)) return true;

    // Contenteditable
    if (el.isContentEditable) return true;

    // Checkbox and radio
    if (tagName === 'input' && ['checkbox', 'radio'].includes(type)) return true;

    return false;
}

function isOurElement(el) {
    return el.closest('#qff-marking-overlay') ||
        el.closest('#qff-marking-tooltip') ||
        el.closest('#qff-name-dialog');
}

function updateTooltip(element, event) {
    if (!markingTooltip) return;

    const tagName = element.tagName.toLowerCase();
    const type = element.type || '';
    const id = element.id || '';
    const name = element.name || '';
    const placeholder = element.placeholder || '';

    let info = `<${tagName}`;
    if (type) info += ` type="${type}"`;
    if (id) info += ` id="${id}"`;
    if (name) info += ` name="${name}"`;
    info += '>';
    if (placeholder) info += `\n${placeholder}`;

    markingTooltip.textContent = info;
    markingTooltip.style.display = 'block';

    const x = Math.min(event.clientX + 15, window.innerWidth - 200);
    const y = Math.min(event.clientY + 15, window.innerHeight - 50);

    markingTooltip.style.left = x + 'px';
    markingTooltip.style.top = y + 'px';
}

function getUniqueSelector(element) {
    // Try ID first
    if (element.id) {
        return `#${CSS.escape(element.id)}`;
    }

    // Try name attribute for form elements
    if (element.name) {
        const tag = element.tagName.toLowerCase();
        const selector = `${tag}[name="${CSS.escape(element.name)}"]`;
        if (document.querySelectorAll(selector).length === 1) {
            return selector;
        }
    }

    // Build path
    const path = [];
    let current = element;

    while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase();

        if (current.id) {
            selector = `#${CSS.escape(current.id)}`;
            path.unshift(selector);
            break;
        }

        if (current.className && typeof current.className === 'string') {
            const classes = current.className.trim().split(/\s+/).filter(c => c).slice(0, 2);
            if (classes.length > 0) {
                selector += '.' + classes.map(c => CSS.escape(c)).join('.');
            }
        }

        const parent = current.parentElement;
        if (parent) {
            const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
            if (siblings.length > 1) {
                const index = siblings.indexOf(current) + 1;
                selector += `:nth-of-type(${index})`;
            }
        }

        path.unshift(selector);
        current = current.parentElement;
    }

    return path.join(' > ');
}

function getSuggestedName(element) {
    // Try label
    if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) return label.textContent.trim();
    }

    // Try parent label
    const parentLabel = element.closest('label');
    if (parentLabel) {
        const text = parentLabel.textContent.replace(element.value || '', '').trim();
        if (text) return text;
    }

    // Try placeholder
    if (element.placeholder) return element.placeholder;

    // Try name attribute
    if (element.name) return element.name;

    // Try aria-label
    if (element.getAttribute('aria-label')) return element.getAttribute('aria-label');

    return '';
}

// ===== Name Dialog =====
function showNameDialog(element) {
    if (nameDialog) nameDialog.remove();

    const suggestedName = getSuggestedName(element);
    const selector = getUniqueSelector(element);

    nameDialog = document.createElement('div');
    nameDialog.id = 'qff-name-dialog';
    nameDialog.innerHTML = `
    <div class="qff-dialog-content">
      <h3>为此元素命名</h3>
      <p class="qff-dialog-selector">${escapeHtml(selector)}</p>
      <input type="text" id="qff-element-name" placeholder="输入元素名称..." value="${escapeHtml(suggestedName)}">
      <div class="qff-dialog-buttons">
        <button class="qff-btn-cancel">取消</button>
        <button class="qff-btn-save">保存</button>
      </div>
    </div>
  `;

    document.body.appendChild(nameDialog);

    const input = nameDialog.querySelector('#qff-element-name');
    input.focus();
    input.select();

    nameDialog.querySelector('.qff-btn-cancel').addEventListener('click', () => {
        nameDialog.remove();
        nameDialog = null;
    });

    nameDialog.querySelector('.qff-btn-save').addEventListener('click', () => saveElement(element, input.value));

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') saveElement(element, input.value);
        if (e.key === 'Escape') { nameDialog.remove(); nameDialog = null; }
    });
}

async function saveElement(element, name) {
    name = name.trim();
    if (!name) {
        alert('请输入元素名称');
        return;
    }

    const selector = getUniqueSelector(element);
    const type = element.tagName.toLowerCase();
    const inputType = element.type || '';

    try {
        const result = await chrome.storage.local.get('projects');
        const projects = result.projects || [];
        const project = projects.find(p => p.id === currentProjectId);

        if (project) {
            project.elements.push({
                id: Date.now().toString(),
                name,
                selector,
                type,
                inputType,
                createdAt: new Date().toISOString()
            });

            await chrome.storage.local.set({ projects });

            // Notify popup
            chrome.runtime.sendMessage({ action: 'elementMarked', projectId: currentProjectId });

            showNotification(`已标记: ${name}`);
        }
    } catch (error) {
        console.error('Error saving element:', error);
        showNotification('保存失败', true);
    }

    if (nameDialog) {
        nameDialog.remove();
        nameDialog = null;
    }

    if (highlightedElement) {
        highlightedElement.style.outline = '';
        highlightedElement = null;
    }
}

// ===== Form Filling =====
async function executeFill(elements, values) {
    const results = [];

    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        const value = values[i] !== undefined ? values[i] : '';

        try {
            const el = document.querySelector(element.selector);

            if (!el) {
                results.push({ name: element.name, success: false, error: '元素未找到' });
                continue;
            }

            await fillElement(el, value, element);
            results.push({ name: element.name, success: true });

            // Add delay between fills
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
            results.push({ name: element.name, success: false, error: error.message });
        }
    }

    showFillResults(results);
}

async function fillElement(el, value, elementInfo) {
    const tagName = el.tagName.toLowerCase();
    const type = el.type ? el.type.toLowerCase() : '';

    // Highlight element being filled
    el.style.transition = 'box-shadow 0.3s ease';
    el.style.boxShadow = '0 0 0 3px rgba(99, 102, 241, 0.5)';

    if (tagName === 'select') {
        // Handle select dropdown
        const option = Array.from(el.options).find(opt =>
            opt.value === value || opt.textContent.trim() === value
        );
        if (option) {
            el.value = option.value;
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    } else if (tagName === 'input' && (type === 'checkbox' || type === 'radio')) {
        // Handle checkbox/radio
        const shouldCheck = value.toLowerCase() === 'true' || value === '1' || value === 'yes';
        if (el.checked !== shouldCheck) {
            el.checked = shouldCheck;
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }
    } else if (el.isContentEditable) {
        // Handle contenteditable
        el.textContent = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
    } else {
        // Handle input/textarea
        el.focus();
        el.value = value;
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Remove highlight after delay
    setTimeout(() => {
        el.style.boxShadow = '';
    }, 500);
}

function showFillResults(results) {
    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    let message = `填写完成！成功: ${successCount}`;
    if (failCount > 0) {
        message += `, 失败: ${failCount}`;
        const failures = results.filter(r => !r.success).map(r => `${r.name}: ${r.error}`).join('\n');
        message += '\n' + failures;
    }

    showNotification(message.split('\n')[0], failCount > 0);

    if (failCount > 0) {
        console.log('Quick Form Filler - Fill Results:', results);
    }
}

// ===== Notification =====
function showNotification(message, isError = false) {
    const existing = document.getElementById('qff-notification');
    if (existing) existing.remove();

    const notification = document.createElement('div');
    notification.id = 'qff-notification';
    notification.className = isError ? 'qff-notification-error' : 'qff-notification-success';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 10);
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
