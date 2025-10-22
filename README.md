# Nutrient Document Authoring - Template Generator

A React-based web application for creating, editing, and generating documents using **Nutrient Document Authoring SDK** and **Nutrient Web SDK (PSPDFKit)**. This application provides a powerful template designer that enables dynamic document generation from data sources.

---

## Quick Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation & Running

1. **Clone or navigate to the project directory**
   ```bash
   clone "https://github.com/Narashiman-K/nutrient-docauth-template-generator.git"
   cd "nutrient-docauth-template-generator"
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure license key**
   - Open [.env](./.env) file
   - Add your Nutrient license key to `VITE_lkey` variable (already configured)

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   - Navigate to `http://localhost:5173` (or the port shown in terminal)

6. **Build for production** (optional)
   ```bash
   npm run build
   npm run preview
   ```

---

## Project Description

This application demonstrates the integration of **Nutrient Document Authoring SDK** with **Nutrient Web SDK** to create a complete document template system. It enables users to:

- **Create and edit documents** with a rich text editor
- **Design document templates** with dynamic placeholders
- **Load data from multiple sources** (JSON files, static files)
- **Generate documents** by populating templates with data
- **Export documents** in multiple formats (PDF, DOCX, DocJSON)
- **Extract text** from documents for analysis

### Key Features

1. **Document Editing**
   - Full-featured WYSIWYG editor powered by Nutrient Document Authoring
   - Support for custom fonts (bring your own fonts)
   - Load existing DOCX and DocJSON documents
   - Create new documents from scratch

2. **Template Designer**
   - Visual field selector with drag-and-drop support
   - Automatic field extraction from JSON data
   - Support for nested objects and arrays
   - Loop and conditional template syntax

3. **Document Generation**
   - Populate templates with dynamic data
   - Uses Nutrient Web SDK's `populateDocumentTemplate` API
   - Seamless integration between Document Authoring and Web SDK

4. **Multiple Export Formats**
   - PDF export for final documents
   - DOCX export for Microsoft Word compatibility
   - DocJSON export for template reuse

---

## Folder Structure

```
da-1.8.2/
├── public/                         # Static assets
│   ├── fonts/                      # Custom font files
│   │   ├── Larsseit*.otf           # Larsseit font family
│   │   └── Lato-*.ttf              # Lato font family
│   ├── invoice.docjson             # Sample template file
│   ├── invoice.json                # Sample template data
│   ├── menu.json                   # Sample template data
│   ├── nutrient-icon.svg           # App icon
│   └── logo.svg                    # Logo
│
├── src/                            # Source code
│   ├── components/                 # React components
│   │   ├── header.jsx              # heading menu
│   │   └── document-editor.jsx     # Main editor component
│   ├── app.jsx                     # Root application component
│   ├── app.css                     # Application styles
│   ├── main.jsx                    # Application entry point
│   └── index.css                   # Global styles
│
├── index.html                      # HTML entry point (loads SDKs)
├── package.json                    # Project dependencies
├── vite.config.js                  # Vite configuration
├── .env                            # Environment variables (license keys)
├── .gitignore                      # Git ignore rules
└── README.md                        # This file
```

---

## Demo

> **[Video demonstration will be added here]**

### Screenshots and Usage Flow

1. **Load or Create Document**: Start with a blank document or load an existing DOCX/DocJSON file
2. **Select Data Source**: Choose a JSON file or static data source for template fields
3. **Design Template**: Drag and drop fields into the document to create template placeholders
4. **Generate Document**: Click "Generate Document" to populate the template with actual data
5. **Export**: Save the final document as PDF, DOCX, or DocJSON

---

## Creating a Document Template

### Step 1: Prepare Your Data Source

Create a JSON file with the data structure you want to use. For example:

```json
{
  "firstName": "Narashiman",
  "lastName": "K",
  "email": "narashiman@nutrient.io",
  "LinkedIn": "https://www.linkedin.com/in/narashimank/",
  "address": {
    "street": "Three Bridges",
    "city": "Crawley",
    "state": "UK"
  },
  "items": [
    {
      "name": "Nutrient Document Authoring",
      "quantity": 1,
      "price": 9999.99
    },
    {
      "name": "Web SDK",
      "quantity": 1,
      "price": 8999.99
    }
  ]
}
```

### Step 2: Load Data Source

1. Click the **"Template Data Source"** dropdown in the toolbar
2. Select **"Upload JSON File"** or **"Load from Public Folder"**
3. Choose your JSON file

The application will automatically extract fields and display them in the left sidebar.

### Step 3: Design Your Template

1. Click **"New Document"** or **"Load Document"** to start with a base document
2. Type your document content and structure
3. Insert template placeholders by:
   - **Dragging** fields from the left sidebar into the document at cursor position.
   - **Clicking** on field buttons to insert at cursor position.

### Step 4: Use Template Syntax

The application supports Nutrient's template syntax:

- **Simple fields**: `{{firstName}}` - Inserts a single value
- **Nested fields**: `{{address.city}}` - Access nested object properties
- **Loop start**: `{{#items}}` - Begin iterating over an array
- **Loop end**: `{{/items}}` - End the iteration
- **Within loops**: `{{name}}`, `{{quantity}}` - Access array item properties

**Example Template:**

```
Invoice

Customer: {{firstName}} {{lastName}}
Email: {{email}}

Address:
{{#address}}
{{street}}
{{city}}, {{state}}
{{/address}}

Items:
{{#items}}
- {{name}}: {{quantity}} × ${{price}}
{{/items}}

Thank you for your business!
```

### Step 5: Generate the Document

1. Click **"Generate Document"** button
2. The application will:
   - Export the current document as DOCX (template)
   - Use Nutrient Web SDK to populate the template with data
   - Import the populated document back into the editor
3. Review the generated document
4. Export as PDF, DOCX, or DocJSON

---

## Core Logic: Document Authoring + Nutrient Web SDK Integration

### How It Works

The application uses two Nutrient SDKs in tandem:

#### 1. **Nutrient Document Authoring SDK** (Template Creation)
- Provides the rich text editor interface
- Allows creating and editing document templates
- Exports templates as DOCX format
- Imports generated documents for final editing

**Key APIs used:**
- `DocAuth.createDocAuthSystem()` - Initialize the system
- `docAuthSystem.createEditor()` - Create editor instance
- `editor.insertTextAtCursor()` - Insert template placeholders
- `document.exportDOCX()` - Export template as DOCX
- `docAuthSystem.importDOCX()` - Import generated document

#### 2. **Nutrient Web SDK** (PSPDFKit) (Template Population)
- Processes DOCX templates
- Replaces placeholders with actual data
- Handles loops, conditionals, and nested structures

**Key API used:**
- `PSPDFKit.populateDocumentTemplate()` - Populate template with data

### Implementation Flow

Located in [src/components/document-editor.jsx](src/components/document-editor.jsx#L861-L930):

```javascript
const handleGenerateDocument = async () => {
  // 1. Get current template document
  const currentDoc = currentEditor.currentDocument();

  // 2. Export template as DOCX
  const templateBuffer = await currentDoc.exportDOCX();

  // 3. Get Nutrient Web SDK
  const NutrientViewer = window.NutrientViewer;

  // 4. Populate template with data
  const populatedBuffer = await NutrientViewer.populateDocumentTemplate(
    { document: templateBuffer },
    dataSource.data
  );

  // 5. Import populated DOCX back into Document Authoring
  const generatedDocument = await currentDocAuthSystem.importDOCX(
    populatedBuffer
  );

  // 6. Display generated document in editor
  await currentEditor.setCurrentDocument(generatedDocument);
};
```

### SDK Initialization

Located in [index.html](index.html#L11-L14):

```html
<!-- Nutrient Viewer Web SDK for template population -->
<script src="https://cdn.cloud.pspdfkit.com/pspdfkit-web@1.8.0/nutrient-viewer.js"></script>

<!-- Nutrient Document Authoring SDK -->
<script src="https://document-authoring.cdn.nutrient.io/releases/document-authoring-1.8.2-umd.js"></script>
```

Both SDKs are loaded via CDN and accessed through global window objects:
- `window.DocAuth` - Document Authoring SDK
- `window.PSPDFKit` or `window.NutrientViewer` - Web SDK

### Template Field Extraction

The application automatically extracts fields from JSON data ([src/components/document-editor.jsx](src/components/document-editor.jsx#L637-L741)):

```javascript
const extractFieldsFromJson = (data) => {
  // Recursively process JSON structure
  // Creates field objects with:
  // - Simple fields: {{fieldName}}
  // - Loop markers: {{#arrayName}} ... {{/arrayName}}
  // - Object markers: {{#objectName}} ... {{/objectName}}
  // - Nested fields: {{parent.child}}
};
```

---

## Additional Documentation

For more detailed information, refer to these documents:

- [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md) - **Error handling & validation guide** (NEW!)
- [TEMPLATE_DESIGNER_README.md](./TEMPLATE_DESIGNER_README.md) - Template designer usage guide
- [GENERATE_DOCUMENT_FEATURE.md](./GENERATE_DOCUMENT_FEATURE.md) - Document generation details
- [TEMPLATE_SYNTAX_UPDATE.md](./TEMPLATE_SYNTAX_UPDATE.md) - Template syntax reference
- [CURRENT_LIMITATIONS.md](./CURRENT_LIMITATIONS.md) - Known limitations and workarounds

---

## Technologies Used

- **React 19** - UI framework
- **Vite 7** - Build tool and dev server
- **Nutrient Document Authoring SDK 1.8.2** - Document editing
- **Nutrient Web SDK (PSPDFKit) 1.8.0** - Template population
- **Custom Fonts** - Larsseit and Lato font families

---

## License

This project requires valid Nutrient license keys for both Document Authoring and Web SDK. Configure your license keys in the [.env](./.env) file.

---

## Support & Resources

- [Nutrient Document Authoring Documentation](https://www.nutrient.io/document-authoring/)
- [Nutrient Web SDK Documentation](https://www.nutrient.io/web-sdk/)
- [API Reference](https://www.nutrient.io/api/)
- [Community Forum](https://support.nutrient.io/)

---

## Autor
[Narashiman](https://www.linkedin.com/in/narashimank/)

**Happy Document Creating!**
