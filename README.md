# Quick Form Filler

<div align="center">

![Quick Form Filler](icons/icon128.png)

**一个强大的 Chrome 表单快速填写扩展**

[English](#english) | [中文](#中文)

</div>

---

## 中文

### 功能特点

- 🎯 **项目管理** - 创建和管理多个填表项目
- ✨ **元素标记** - 可视化标记网页上的表单元素
- 📝 **批量填写** - 使用制表符分隔的数据一次性填写多个字段
- 💾 **本地存储** - 项目数据保存在本地，安全可靠
- 🎨 **现代UI** - 暗色主题，美观易用

### 使用方法

#### 1. 安装扩展

1. 打开 Chrome 浏览器，进入 `chrome://extensions/`
2. 开启右上角的"开发者模式"
3. 点击"加载已解压的扩展程序"
4. 选择此项目文件夹

#### 2. 创建项目

1. 点击扩展图标打开弹出窗口
2. 点击"新建项目"按钮
3. 输入项目名称和描述（可选）
4. 点击"创建项目"

#### 3. 标记元素

1. 打开要填写的目标网页
2. 在扩展中打开对应项目
3. 点击"标记元素"按钮
4. 页面顶部会显示标记模式提示栏
5. 鼠标悬停在要标记的表单元素上（输入框、下拉菜单等）
6. 点击元素，在弹出的对话框中输入元素名称
7. 继续标记其他元素，完成后按 ESC 退出

#### 4. 运行填写

1. 在扩展中打开项目
2. 点击"运行项目"按钮
3. 准备填写数据：使用制表符（Tab）分隔各列数据
   - 列的顺序需要与标记的元素顺序一致
   - 例如：`张三	zhangsan@email.com	13800138000`
4. 将数据粘贴到输入框中
5. 预览数据确认无误后，点击"开始填写"
6. 扩展会自动逐个填写每个元素

### 支持的元素类型

- ✅ 文本输入框 (`input[type="text"]`)
- ✅ 邮箱输入框 (`input[type="email"]`)
- ✅ 密码输入框 (`input[type="password"]`)
- ✅ 数字输入框 (`input[type="number"]`)
- ✅ 电话输入框 (`input[type="tel"]`)
- ✅ 日期选择器 (`input[type="date"]`)
- ✅ 多行文本框 (`textarea`)
- ✅ 下拉选择框 (`select`)
- ✅ 复选框 (`input[type="checkbox"]`)
- ✅ 单选按钮 (`input[type="radio"]`)
- ✅ 富文本编辑器 (`contenteditable`)

### 数据格式说明

使用制表符分隔数据时：
- 每一列对应一个标记的元素
- 对于下拉菜单，可以使用选项的值或显示文本
- 对于复选框，使用 `true`/`false` 或 `1`/`0`

**示例：**
```
张三	zhangsan@example.com	北京市	true
```

---

## English

### Features

- 🎯 **Project Management** - Create and manage multiple form filling projects
- ✨ **Element Marking** - Visually mark form elements on web pages
- 📝 **Batch Filling** - Fill multiple fields at once using tab-separated data
- 💾 **Local Storage** - Project data is stored locally for security
- 🎨 **Modern UI** - Dark theme with beautiful and intuitive design

### How to Use

#### 1. Install Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select this project folder

#### 2. Create a Project

1. Click the extension icon to open the popup
2. Click "New Project" button
3. Enter project name and description (optional)
4. Click "Create Project"

#### 3. Mark Elements

1. Open the target web page
2. Open the project in the extension
3. Click "Mark Elements" button
4. A marking mode bar will appear at the top of the page
5. Hover over form elements you want to mark (inputs, selects, etc.)
6. Click the element and enter a name in the dialog
7. Continue marking other elements, press ESC to exit

#### 4. Run Fill

1. Open the project in the extension
2. Click "Run Project" button
3. Prepare your data: use Tab to separate columns
   - Column order must match the marked element order
   - Example: `John Doe	john@email.com	1234567890`
4. Paste the data into the input field
5. Preview the data and click "Start Filling"
6. The extension will automatically fill each element

### Supported Element Types

- ✅ Text input (`input[type="text"]`)
- ✅ Email input (`input[type="email"]`)
- ✅ Password input (`input[type="password"]`)
- ✅ Number input (`input[type="number"]`)
- ✅ Phone input (`input[type="tel"]`)
- ✅ Date picker (`input[type="date"]`)
- ✅ Textarea (`textarea`)
- ✅ Select dropdown (`select`)
- ✅ Checkbox (`input[type="checkbox"]`)
- ✅ Radio button (`input[type="radio"]`)
- ✅ Rich text editor (`contenteditable`)

### Data Format

When using tab-separated data:
- Each column corresponds to a marked element
- For dropdowns, use either the option value or display text
- For checkboxes, use `true`/`false` or `1`/`0`

**Example:**
```
John Doe	john@example.com	New York	true
```

---

## License

MIT License

## Contributing

Issues and Pull Requests are welcome!
