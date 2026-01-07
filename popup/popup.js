// ===== State Management =====
let currentProject = null;
let currentEditingElementIndex = null;
let projects = [];
let draggedElement = null;

// ===== DOM Elements =====
const views = {
  main: document.getElementById('mainView'),
  create: document.getElementById('createView'),
  project: document.getElementById('projectView'),
  editProject: document.getElementById('editProjectView'),
  editElement: document.getElementById('editElementView'),
  run: document.getElementById('runView')
};

// ===== Initialization =====
document.addEventListener('DOMContentLoaded', async () => {
  await loadProjects();
  renderProjectList();
  setupEventListeners();
});

// ===== Data Management =====
async function loadProjects() {
  const result = await chrome.storage.local.get('projects');
  projects = result.projects || [];
}

async function saveProjects() {
  await chrome.storage.local.set({ projects });
}

// ===== View Navigation =====
function showView(viewName) {
  Object.values(views).forEach(view => view.classList.remove('active'));
  views[viewName].classList.add('active');
}

// ===== Event Listeners =====
function setupEventListeners() {
  // Create project
  document.getElementById('createProjectBtn').addEventListener('click', () => {
    showView('create');
    document.getElementById('projectName').value = '';
    document.getElementById('projectDesc').value = '';
  });

  // Back buttons
  document.getElementById('backFromCreate').addEventListener('click', () => showView('main'));
  document.getElementById('backFromProject').addEventListener('click', () => {
    showView('main');
    currentProject = null;
  });
  document.getElementById('backFromRun').addEventListener('click', () => showView('project'));
  document.getElementById('backFromEditProject').addEventListener('click', () => showView('project'));
  document.getElementById('backFromEditElement').addEventListener('click', () => {
    showView('project');
    currentEditingElementIndex = null;
  });

  // Project actions
  document.getElementById('saveProjectBtn').addEventListener('click', createProject);
  document.getElementById('deleteProjectBtn').addEventListener('click', deleteProject);
  document.getElementById('editProjectBtn').addEventListener('click', showEditProjectView);
  document.getElementById('updateProjectBtn').addEventListener('click', updateProject);

  // Element actions
  document.getElementById('updateElementBtn').addEventListener('click', updateElement);

  // Marking and running
  document.getElementById('startMarkingBtn').addEventListener('click', startMarking);
  document.getElementById('runProjectBtn').addEventListener('click', showRunView);
  document.getElementById('executeBtn').addEventListener('click', executeFill);
  document.getElementById('dataInput').addEventListener('input', previewData);

  // Import/Export
  document.getElementById('importProjectBtn').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });
  document.getElementById('importFileInput').addEventListener('change', handleImport);
  document.getElementById('exportProjectBtn').addEventListener('click', exportCurrentProject);
}

// ===== Project Management =====
function createProject() {
  const name = document.getElementById('projectName').value.trim();
  const desc = document.getElementById('projectDesc').value.trim();

  if (!name) {
    showToast('请输入项目名称', 'error');
    return;
  }

  const project = {
    id: Date.now().toString(),
    name,
    description: desc,
    elements: [],
    createdAt: new Date().toISOString()
  };

  projects.push(project);
  saveProjects();
  renderProjectList();
  showView('main');
  showToast('项目创建成功', 'success');
}

function deleteProject() {
  if (!currentProject) return;
  if (confirm('确定要删除这个项目吗？')) {
    projects = projects.filter(p => p.id !== currentProject.id);
    saveProjects();
    renderProjectList();
    showView('main');
    currentProject = null;
    showToast('项目已删除', 'success');
  }
}

function showEditProjectView() {
  if (!currentProject) return;
  document.getElementById('editProjectName').value = currentProject.name;
  document.getElementById('editProjectDesc').value = currentProject.description || '';
  showView('editProject');
}

function updateProject() {
  const name = document.getElementById('editProjectName').value.trim();
  const desc = document.getElementById('editProjectDesc').value.trim();

  if (!name) {
    showToast('请输入项目名称', 'error');
    return;
  }

  currentProject.name = name;
  currentProject.description = desc;
  saveProjects();

  document.getElementById('projectTitle').textContent = name;
  renderProjectList();
  showView('project');
  showToast('项目已更新', 'success');
}

function openProject(projectId) {
  currentProject = projects.find(p => p.id === projectId);
  if (!currentProject) return;
  document.getElementById('projectTitle').textContent = currentProject.name;
  renderElementList();
  showView('project');
}

// ===== Element Management =====
function showEditElementView(index) {
  if (!currentProject || !currentProject.elements[index]) return;

  currentEditingElementIndex = index;
  const element = currentProject.elements[index];

  document.getElementById('editElementName').value = element.name;
  document.getElementById('editElementSelector').textContent = element.selector;
  showView('editElement');
}

function updateElement() {
  if (currentEditingElementIndex === null || !currentProject) return;

  const name = document.getElementById('editElementName').value.trim();

  if (!name) {
    showToast('请输入元素名称', 'error');
    return;
  }

  currentProject.elements[currentEditingElementIndex].name = name;
  saveProjects();
  renderElementList();
  showView('project');
  currentEditingElementIndex = null;
  showToast('元素已更新', 'success');
}

function deleteElement(index) {
  currentProject.elements.splice(index, 1);
  saveProjects();
  renderElementList();
  showToast('元素已删除', 'success');
}

// ===== Rendering =====
function renderProjectList() {
  const container = document.getElementById('projectList');

  if (projects.length === 0) {
    container.innerHTML = `<div class="empty-state"><svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V9C21 7.89543 20.1046 7 19 7H13L11 5H5C3.89543 5 3 5.89543 3 7Z" stroke="currentColor" stroke-width="2"/></svg><p>暂无项目</p><span>点击"新建项目"开始创建</span></div>`;
    return;
  }

  container.innerHTML = projects.map(project => `
    <div class="project-card" data-id="${project.id}">
      <div class="project-card-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" stroke-width="2"/><path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5C15 6.10457 14.1046 7 13 7H11C9.89543 7 9 6.10457 9 5Z" stroke="currentColor" stroke-width="2"/></svg></div>
      <div class="project-card-content"><div class="project-card-name">${escapeHtml(project.name)}</div><div class="project-card-info">${project.elements.length} 个元素</div></div>
      <div class="project-card-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M9 6L15 12L9 18" stroke="currentColor" stroke-width="2"/></svg></div>
    </div>
  `).join('');

  container.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', () => openProject(card.dataset.id));
  });
}

function renderElementList() {
  const container = document.getElementById('elementList');
  const countSpan = document.getElementById('elementCount');
  countSpan.textContent = `(${currentProject.elements.length})`;

  if (currentProject.elements.length === 0) {
    container.innerHTML = `<div class="empty-state small"><p>暂无标记元素</p><span>点击"标记元素"开始标记</span></div>`;
    return;
  }

  container.innerHTML = currentProject.elements.map((el, i) => `
    <div class="element-item" data-index="${i}" draggable="true">
      <div class="element-item-drag" title="拖拽排序">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path d="M8 6H10M8 12H10M8 18H10M14 6H16M14 12H16M14 18H16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <div class="element-item-index">${i + 1}</div>
      <div class="element-item-info">
        <div class="element-item-name">${escapeHtml(el.name)}</div>
        <div class="element-item-selector">${escapeHtml(el.selector)}</div>
      </div>
      <div class="element-item-actions">
        <button class="element-item-edit" data-index="${i}" title="编辑元素">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M11 4H4C3.44772 4 3 4.44772 3 5V20C3 20.5523 3.44772 21 4 21H19C19.5523 21 20 20.5523 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="element-item-delete" data-index="${i}" title="删除元素">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  `).join('');

  // Add event listeners
  container.querySelectorAll('.element-item-edit').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      showEditElementView(parseInt(btn.dataset.index));
    });
  });

  container.querySelectorAll('.element-item-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      deleteElement(parseInt(btn.dataset.index));
    });
  });

  // Setup drag and drop
  setupDragAndDrop();
}

// ===== Drag and Drop =====
function setupDragAndDrop() {
  const container = document.getElementById('elementList');
  const items = container.querySelectorAll('.element-item');

  items.forEach(item => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragleave', handleDragLeave);
    item.addEventListener('drop', handleDrop);
  });
}

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', this.dataset.index);
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  document.querySelectorAll('.element-item').forEach(item => {
    item.classList.remove('drag-over');
  });
  draggedElement = null;
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
}

function handleDragEnter(e) {
  e.preventDefault();
  if (this !== draggedElement) {
    this.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');

  if (this === draggedElement) return;

  const fromIndex = parseInt(draggedElement.dataset.index);
  const toIndex = parseInt(this.dataset.index);

  if (fromIndex === toIndex) return;

  // Reorder elements
  const elements = currentProject.elements;
  const [movedElement] = elements.splice(fromIndex, 1);
  elements.splice(toIndex, 0, movedElement);

  saveProjects();
  renderElementList();
  showToast('顺序已更新', 'success');
}

// ===== Element Marking =====
async function startMarking() {
  if (!currentProject) return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { action: 'startMarking', projectId: currentProject.id });
    window.close();
  } catch (error) {
    showToast('无法启动标记模式，请刷新页面重试', 'error');
  }
}

// ===== Run Project =====
function showRunView() {
  if (!currentProject || currentProject.elements.length === 0) {
    showToast('请先标记至少一个元素', 'error');
    return;
  }
  document.getElementById('fieldOrder').innerHTML = currentProject.elements.map((el, i) => `<span class="field-tag"><span class="field-tag-index">${i + 1}.</span>${escapeHtml(el.name)}</span>`).join('');
  document.getElementById('dataInput').value = '';
  document.getElementById('dataPreview').classList.add('hidden');
  showView('run');
}

function previewData() {
  const input = document.getElementById('dataInput').value.trim();
  const previewContainer = document.getElementById('dataPreview');
  const previewContent = document.getElementById('previewContent');

  if (!input) { previewContainer.classList.add('hidden'); return; }

  const values = input.split('\t');
  const elements = currentProject.elements;
  let html = '<div class="preview-row">';

  values.forEach((v, i) => {
    const name = elements[i] ? elements[i].name : `列 ${i + 1}`;
    html += `<div class="preview-cell" style="${i >= elements.length ? 'opacity:0.5' : ''}"><span class="preview-cell-label">${escapeHtml(name)}:</span><span class="preview-cell-value">${escapeHtml(v) || '(空)'}</span></div>`;
  });

  html += '</div>';
  if (values.length !== elements.length) html += `<p style="color:var(--warning);font-size:11px;margin-top:8px">⚠️ 数据列数(${values.length})与元素数(${elements.length})不匹配</p>`;

  previewContent.innerHTML = html;
  previewContainer.classList.remove('hidden');
}

async function executeFill() {
  if (!currentProject) return;
  const input = document.getElementById('dataInput').value.trim();
  if (!input) { showToast('请输入要填写的数据', 'error'); return; }

  const values = input.split('\t');
  if (values.length !== currentProject.elements.length) {
    if (!confirm(`数据列数(${values.length})与元素数(${currentProject.elements.length})不匹配，是否继续？`)) return;
  }

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { action: 'executeFill', elements: currentProject.elements, values });
    window.close();
  } catch (error) {
    showToast('执行失败，请刷新页面重试', 'error');
  }
}

// ===== Import/Export =====
function exportCurrentProject() {
  if (!currentProject) return;

  const exportData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    projects: [currentProject]
  };

  const safeName = currentProject.name.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
  downloadJson(exportData, `quick-form-filler-${safeName}-${formatDate()}.json`);
  showToast(`已导出项目: ${currentProject.name}`, 'success');
}

function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function handleImport(event) {
  const files = Array.from(event.target.files);
  if (files.length === 0) return;

  let totalImported = 0;
  let allImportedProjects = [];
  let errors = [];

  // Process each file
  for (const file of files) {
    try {
      const text = await readFileAsText(file);
      const data = JSON.parse(text);

      // Validate data structure
      if (!data.projects || !Array.isArray(data.projects)) {
        errors.push(`${file.name}: 无效的文件格式`);
        continue;
      }

      // Validate each project
      let validProjects = [];
      for (const project of data.projects) {
        if (!project.name || !Array.isArray(project.elements)) {
          errors.push(`${file.name}: 项目数据格式不正确`);
          continue;
        }
        validProjects.push({
          ...project,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          importedAt: new Date().toISOString()
        });
      }

      allImportedProjects = [...allImportedProjects, ...validProjects];
      totalImported += validProjects.length;

    } catch (error) {
      errors.push(`${file.name}: ${error.message}`);
    }
  }

  if (allImportedProjects.length > 0) {
    // Ask user how to handle import if there are existing projects
    const existingCount = projects.length;
    let action = 'merge';

    if (existingCount > 0) {
      const confirmed = confirm(
        `当前已有 ${existingCount} 个项目。\n\n` +
        `点击"确定"将导入的 ${allImportedProjects.length} 个项目添加到现有项目中。\n` +
        `点击"取消"将替换所有现有项目。`
      );
      action = confirmed ? 'merge' : 'replace';
    }

    if (action === 'merge') {
      projects = [...projects, ...allImportedProjects];
    } else {
      projects = allImportedProjects;
    }

    await saveProjects();
    renderProjectList();

    if (errors.length > 0) {
      showToast(`导入 ${totalImported} 个项目，${errors.length} 个文件失败`, 'warning');
      console.error('Import errors:', errors);
    } else {
      showToast(`成功导入 ${totalImported} 个项目`, 'success');
    }
  } else {
    showToast(`导入失败: ${errors.join('; ')}`, 'error');
  }

  // Reset input to allow importing the same files again
  event.target.value = '';
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
}

function formatDate() {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
}

// ===== Utilities =====
function escapeHtml(text) { const div = document.createElement('div'); div.textContent = text; return div.innerHTML; }

function showToast(message, type = '') {
  document.querySelectorAll('.toast').forEach(t => t.remove());
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 300); }, 2500);
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'elementMarked') {
    loadProjects().then(() => {
      if (currentProject) {
        currentProject = projects.find(p => p.id === currentProject.id);
        if (currentProject) renderElementList();
      }
    });
  }
});
