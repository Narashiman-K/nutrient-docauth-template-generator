// src/components/document-editor.jsx
import { useEffect, useRef, useState } from "react";
import Header from "./header.jsx";

/**
 * DocumentEditor Component
 *
 * Main component for the Nutrient Document Authoring application.
 * Provides functionality for:
 * - Creating and editing documents
 * - Loading DOCX and DocJSON files
 * - Exporting to PDF, DOCX, and JSON formats
 * - Template-based document generation with dynamic data
 * - Text extraction from documents
 */
export default function DocumentEditor() {
  // Refs for DOM elements and editor instances
  const containerRef = useRef(null);
  const fileInputRef = useRef(null);
  const jsonFileInputRef = useRef(null);
  const editorRef = useRef(null);
  const docAuthSystemRef = useRef(null);

  // Editor state
  const [editor, setEditor] = useState(null);
  const [_docAuthSystem, setDocAuthSystem] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Template designer state
  const [templateFields, setTemplateFields] = useState([]);
  const [dataSource, setDataSource] = useState({
    type: "none",
    data: null,
    config: {},
  });
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [draggedField, setDraggedField] = useState(null);

  /**
   * Extract field names from JSON data following Nutrient template syntax
   * Supports nested objects, arrays, and loops
   *
   * @param {Object|Array} data - JSON data to extract fields from
   * @returns {Array} Array of field objects with name, label, and placeholder
   */
  const extractFieldsFromJson = (data) => {
    const fields = [];

    const processValue = (value, key, parentPath = "", indentLevel = 0) => {
      const currentPath = parentPath ? `${parentPath}.${key}` : key;
      const indent = "  ".repeat(indentLevel);

      if (value === null || value === undefined) {
        fields.push({
          name: currentPath,
          label: `${indent}${key}`,
          placeholder: `{{${key}}}`,
          indentLevel,
          type: "simple",
        });
      } else if (Array.isArray(value)) {
        if (value.length > 0 && typeof value[0] === "object") {
          // Array of objects - create loop markers
          fields.push({
            name: `#${currentPath}`,
            label: `${indent}${key} (Loop Start)`,
            placeholder: `{{#${key}}}`,
            isLoopStart: true,
            indentLevel,
            type: "loop-start",
          });

          const firstItem = value[0];
          Object.keys(firstItem).forEach((childKey) => {
            processValue(firstItem[childKey], childKey, key, indentLevel + 1);
          });

          fields.push({
            name: `/${currentPath}`,
            label: `${indent}${key} (Loop End)`,
            placeholder: `{{/${key}}}`,
            isLoopEnd: true,
            indentLevel,
            type: "loop-end",
          });
        } else {
          // Simple array
          fields.push({
            name: currentPath,
            label: `${indent}${key}`,
            placeholder: `{{${key}}}`,
            indentLevel,
            type: "array-simple",
          });
        }
      } else if (typeof value === "object") {
        // Nested object - create object markers
        fields.push({
          name: `#${currentPath}`,
          label: `${indent}${key} (Object Start)`,
          placeholder: `{{#${key}}}`,
          isObjectStart: true,
          indentLevel,
          type: "object-start",
        });

        Object.keys(value).forEach((childKey) => {
          processValue(value[childKey], childKey, currentPath, indentLevel + 1);
        });

        fields.push({
          name: `/${currentPath}`,
          label: `${indent}${key} (Object End)`,
          placeholder: `{{/${key}}}`,
          isObjectEnd: true,
          indentLevel,
          type: "object-end",
        });
      } else {
        // Simple value
        fields.push({
          name: currentPath,
          label: `${indent}${key}`,
          placeholder: `{{${key}}}`,
          indentLevel,
          type: "simple",
        });
      }
    };

    const processModel = (obj) => {
      Object.keys(obj).forEach((key) => {
        processValue(obj[key], key, "", 0);
      });
    };

    if (Array.isArray(data)) {
      if (data.length > 0 && typeof data[0] === "object") {
        processModel(data[0]);
      }
    } else if (typeof data === "object" && data !== null) {
      if (data.model && typeof data.model === "object") {
        processModel(data.model);
      } else {
        processModel(data);
      }
    }

    return fields;
  };

  /**
   * Initialize the Document Authoring system
   * Sets up the editor with custom fonts and creates an initial document
   */
  useEffect(() => {
    const target = document.createElement("div");
    target.className = "editor-target";
    let cleanupPerformed = false;
    let editorInstance = null;
    let docAuthInstance = null;

    const initializeEditor = async () => {
      try {
        if (!window.DocAuth) {
          console.error("DocAuth not found on window object");
          setIsLoading(false);
          return;
        }

        // Check if Nutrient SDK is available for template population
        console.log("Checking for Nutrient Viewer SDK...");
        console.log("Available global objects:", {
          DocAuth: !!window.DocAuth,
          NutrientViewer: !!window.NutrientViewer,
        });

        if (window.NutrientViewer) {
          console.log(
            "✓ Nutrient Viewer SDK (NutrientViewer) loaded successfully",
          );
          console.log(
            "✓ Template population feature is available:",
            typeof window.NutrientViewer.populateDocumentTemplate ===
              "function",
          );
        } else {
          console.warn(
            "⚠ Nutrient Viewer SDK not loaded yet. Template population may not work.",
          );
          console.warn("Please ensure this script is in your index.html");
        }

        // Configure custom fonts
        const fontConfig = {
          fonts: [window.DocAuth.defaultFontIndex],
        };

        try {
          const customFonts = [
            {
              type: "file",
              blob: fetch("/fonts/LarsseitBold.otf").catch(() => null),
            },
            {
              type: "file",
              blob: fetch("/fonts/LarsseitBoldItalic.otf").catch(() => null),
            },
            {
              type: "file",
              blob: fetch("/fonts/LarsseitExtraBold.otf").catch(() => null),
            },
            {
              type: "file",
              blob: fetch("/fonts/LarsseitExtraBoldItalic.otf").catch(
                () => null,
              ),
            },
            {
              type: "file",
              blob: fetch("/fonts/LarsseitItalic.otf").catch(() => null),
            },
            {
              type: "file",
              blob: fetch("/fonts/LarsseitLight.otf").catch(() => null),
            },
            {
              type: "file",
              blob: fetch("/fonts/LarsseitLightItalic.otf").catch(() => null),
            },
            {
              type: "file",
              blob: fetch("/fonts/LarsseitMedium.otf").catch(() => null),
            },
          ];

          const validFonts = customFonts.filter((font) => font.blob !== null);
          fontConfig.fonts.push(...validFonts);
        } catch (fontError) {
          console.error(
            "Error loading custom fonts, continuing with default fonts:",
            fontError,
          );
        }

        // Create DocAuth system instance
        docAuthInstance = await window.DocAuth.createDocAuthSystem({
          fontConfig,
          licenseKey:
            "1It_gYdwgYKdzPMuiaro23bUHU947Rp-bUHnDA66HwF_sxJTxoIopmSI3FhdiaWW_Avw4uAF1A3zPQJDnChPCYR9tsLQcBXI1xf84t-EhyS_oBbqXCe2LuSBzYRZc7xjYSKR8eZSSxHEGGE0rQTWf5J9FBiTxKFekPy84sksK2xSZKZiOKWkiORJZisXWFIMgfArLapre2aBMqBArueghbz39h_bYm_l-KhPBo4",
        });

        docAuthSystemRef.current = docAuthInstance;
        setDocAuthSystem(docAuthInstance);

        // Load default invoice document from public folder
        let initialDocument;
        try {
          console.log("Loading default document: invoice.docjson");
          const docResponse = await fetch("/invoice.docjson");

          if (docResponse.ok) {
            const docText = await docResponse.text();
            const docJson = JSON.parse(docText);
            initialDocument = await docAuthInstance.loadDocument(docJson);
            console.log("Default document loaded successfully:", initialDocument);
          } else {
            throw new Error("Failed to fetch invoice.docjson");
          }
        } catch (error) {
          console.warn("Could not load invoice.docjson, creating default template:", error);
          // Fallback to creating a simple document if file loading fails
          initialDocument =
            await docAuthInstance.createDocumentFromPlaintext(
              "Invoice \n\nDate: {{date}}\nInvoice #: {{invoiceNumber}}\n\n Customer: {{firstName}} {{lastName}}\n Email: {{email}}\n Address:{{#address}}{{street}}\n{{city}}, {{state}}{{/address}}\n\nItems:{{#items}}- {{name}}: {{quantity}} × ${{price}}{{/items}} \n\nTotal: ${{total}}\n\n Thank you for your business!",
            );
        }

        // Create editor instance
        editorInstance = await docAuthInstance.createEditor(target, {
          document: initialDocument,
        });
        console.log("Editor instance created:", editorInstance);

        // Load default JSON data from public folder
        try {
          console.log("Loading default data: invoice.json");
          const jsonResponse = await fetch("/invoice.json");

          if (jsonResponse.ok) {
            const jsonData = await jsonResponse.json();
            console.log("Default JSON data loaded successfully:", jsonData);

            // Extract fields and set data source
            const fields = extractFieldsFromJson(jsonData);
            setTemplateFields(fields);
            setDataSource({
              type: "json-static",
              data: jsonData,
              config: { filename: "invoice.json" },
            });
            console.log("Template fields extracted and data source set");
          } else {
            console.warn("Could not load invoice.json from public folder");
          }
        } catch (error) {
          console.warn("Error loading default JSON data:", error);
        }

        if (!cleanupPerformed && containerRef.current) {
          containerRef.current.appendChild(target);
          editorRef.current = editorInstance;
          setEditor(editorInstance);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error during editor initialization:", error);
        setIsLoading(false);
      }
    };

    initializeEditor();

    // Cleanup function
    return () => {
      cleanupPerformed = true;

      if (target?.parentNode) {
        target.remove();
      }

      if (editorInstance) {
        try {
          editorInstance.destroy();
        } catch (error) {
          console.error("Error destroying editor:", error);
        }
      }

      if (docAuthInstance) {
        try {
          docAuthInstance.destroy();
        } catch (error) {
          console.error("Error destroying DocAuth system:", error);
        }
      }
    };
  }, []);

  /**
   * Extract text from document sections
   * Parses the document structure and extracts all text content
   *
   * @param {Array} sections - Document sections to process
   * @returns {string} Extracted text
   */
  const extractTextFromSections = (sections) => {
    let extractedText = "";

    if (!Array.isArray(sections)) {
      console.error("Sections is not an array:", sections);
      return "";
    }

    sections.forEach((section) => {
      if (Array.isArray(section.elements)) {
        section.elements.forEach((element) => {
          if (element.type === "p") {
            let paragraphText = "";

            if (Array.isArray(element.elements)) {
              element.elements.forEach((inline) => {
                if (inline.type === "r" && inline.text) {
                  paragraphText += inline.text;
                } else if (inline.type === "break/line") {
                  paragraphText += "\n";
                } else if (inline.type === "break/page") {
                  paragraphText += "\n\n--- PAGE BREAK ---\n\n";
                }
              });
            }

            extractedText += paragraphText;
            extractedText += "\n";
          }
        });
      }
    });

    return extractedText;
  };

  /**
   * Extract and return document text
   *
   * @param {Object} document - Document instance
   * @returns {Promise<string>} Extracted text
   */
  const extractAndLogText = async (document) => {
    try {
      const docObj = await document.saveDocument();

      if (docObj?.container?.document?.body?.sections) {
        const sections = docObj.container.document.body.sections;
        const extractedText = extractTextFromSections(sections);
        return extractedText;
      }
    } catch (error) {
      console.error("Error during document text extraction:", error);
      return "";
    }
  };

  /**
   * Trigger file upload dialog
   */
  const handleDocxUpload = () => {
    if (!fileInputRef.current) {
      console.error("File input ref not available");
      return;
    }

    fileInputRef.current.click();
  };

  /**
   * Process selected document file (DOCX or JSON)
   * Loads the file into the editor
   *
   * @param {Event} event - File input change event
   */
  const handleFileChange = async (event) => {
    const file = event.target.files[0];

    if (!file) {
      return;
    }

    const currentEditor = editorRef.current;
    const currentDocAuthSystem = docAuthSystemRef.current;

    if (!currentEditor || !currentDocAuthSystem) {
      console.error("Editor or DocAuth system not available");
      return;
    }

    const fileExtension = file.name.split(".").pop().toLowerCase();

    try {
      setIsLoading(true);

      let document = null;

      if (fileExtension === "docx") {
        const fileResponse = new Response(file);
        document = await currentDocAuthSystem.importDOCX(
          Promise.resolve(fileResponse),
        );
      } else if (fileExtension === "json" || fileExtension === "docjson") {
        const fileText = await file.text();

        if (!fileText || fileText.trim().length === 0) {
          throw new Error("File is empty");
        }

        try {
          const docJson = JSON.parse(fileText);
          document = await currentDocAuthSystem.loadDocument(docJson);
        } catch (parseError) {
          console.error("Error parsing or loading JSON file:", parseError);
          throw new Error(`Failed to load JSON file: ${parseError.message}`);
        }
      } else {
        alert("Please select a .docx, .json, or .docjson file");
        return;
      }

      if (document) {
        await currentEditor.setCurrentDocument(document);

        const extractedText = await extractAndLogText(document);

        if (extractedText && extractedText.trim().length > 0) {
          alert(
            `Document loaded successfully!\nExtracted ${extractedText.trim().length} characters.`,
          );
        } else {
          alert(
            "Document loaded but no text could be extracted. Check console for details.",
          );
        }
      } else {
        throw new Error(
          "Document loading failed - no document object returned",
        );
      }
    } catch (error) {
      console.error("Error processing file:", error);
      alert(
        `Error loading file: ${error.message}\n\nPlease check the console for more details.`,
      );
    } finally {
      setIsLoading(false);
      event.target.value = "";
    }
  };

  /**
   * Create new blank document
   */
  const handleNewDocument = async () => {
    const currentEditor = editorRef.current;
    const currentDocAuthSystem = docAuthSystemRef.current;

    if (!currentEditor || !currentDocAuthSystem) {
      console.error("Editor or DocAuth system not available");
      return;
    }

    try {
      setIsLoading(true);

      const newDocument =
        await currentDocAuthSystem.createDocumentFromPlaintext(
          "New Document\n\nStart typing here to create your content...",
        );

      await currentEditor.setCurrentDocument(newDocument);
      await extractAndLogText(newDocument);
    } catch (error) {
      console.error("Error creating new document:", error);
      alert(`Error creating new document: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export current document as DocJSON format
   * Downloads a .docjson file that can be imported later
   */
  const handleExportJson = async () => {
    const currentEditor = editorRef.current;
    if (!currentEditor) {
      alert("Editor not available for export");
      return;
    }

    try {
      setIsLoading(true);

      const currentDoc = currentEditor.currentDocument();

      if (!currentDoc) {
        alert("No document available to export");
        return;
      }

      const docObj = await currentDoc.saveDocument();

      if (!docObj || Object.keys(docObj).length === 0) {
        throw new Error("saveDocument returned empty or null object");
      }

      const jsonString = JSON.stringify(docObj, null, 2);

      if (
        !jsonString ||
        jsonString.trim().length === 0 ||
        jsonString === "{}" ||
        jsonString === "null"
      ) {
        throw new Error("Generated JSON string is empty or invalid");
      }

      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const filename = `nutrient-document-${timestamp}.docjson`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      alert(
        `Document exported successfully!\nFile: ${filename}\nSize: ${Math.round(jsonString.length / 1024)} KB\n\nThis file can be imported back into the application.`,
      );
    } catch (error) {
      console.error("Error exporting JSON:", error);
      alert(
        `Error exporting document: ${error.message}\n\nCheck console for detailed error information.`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export current document as PDF
   * Downloads a .pdf file
   */
  const handleExportPdf = async () => {
    const currentEditor = editorRef.current;
    if (!currentEditor) {
      alert("Editor not available for PDF export");
      return;
    }

    try {
      setIsLoading(true);

      const currentDoc = currentEditor.currentDocument();

      if (!currentDoc) {
        alert("No document available to export to PDF");
        return;
      }

      const pdfArrayBuffer = await currentDoc.exportPDF();

      if (!pdfArrayBuffer || pdfArrayBuffer.byteLength === 0) {
        throw new Error("PDF export returned empty ArrayBuffer");
      }

      const pdfBlob = new Blob([pdfArrayBuffer], { type: "application/pdf" });

      const url = URL.createObjectURL(pdfBlob);
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const filename = `nutrient-document-${timestamp}.pdf`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      alert(
        `PDF exported successfully!\nFile: ${filename}\nSize: ${Math.round(pdfBlob.size / 1024)} KB`,
      );
    } catch (error) {
      console.error("Error exporting PDF:", error);
      alert(`Error exporting PDF: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Export current document as DOCX
   * Downloads a .docx file
   */
  const handleExportDocx = async () => {
    const currentEditor = editorRef.current;
    if (!currentEditor) {
      alert("Editor not available for DOCX export");
      return;
    }

    try {
      setIsLoading(true);

      const currentDoc = currentEditor.currentDocument();

      if (!currentDoc) {
        alert("No document available to export to DOCX");
        return;
      }

      const docxArrayBuffer = await currentDoc.exportDOCX();

      if (!docxArrayBuffer || docxArrayBuffer.byteLength === 0) {
        throw new Error("DOCX export returned empty ArrayBuffer");
      }

      const docxBlob = new Blob([docxArrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      const url = URL.createObjectURL(docxBlob);
      const timestamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/:/g, "-");
      const filename = `nutrient-document-${timestamp}.docx`;

      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      alert(
        `DOCX exported successfully!\nFile: ${filename}\nSize: ${Math.round(docxBlob.size / 1024)} KB`,
      );
    } catch (error) {
      console.error("Error exporting DOCX:", error);
      alert(`Error exporting DOCX: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Extract and display text from current document
   * Shows a preview of the extracted text in an alert
   */
  const handleExtractText = async () => {
    if (!editor) {
      alert("Editor not available for text extraction");
      return;
    }

    try {
      const currentDoc = editor.currentDocument();

      if (!currentDoc) {
        alert("No document available for text extraction");
        return;
      }

      const docObj = await currentDoc.saveDocument();

      if (docObj?.container?.document?.body?.sections) {
        const sections = docObj.container.document.body.sections;
        const extractedText = extractTextFromSections(sections);

        if (extractedText && extractedText.trim().length > 0) {
          const preview =
            extractedText.length > 300
              ? `${extractedText.substring(0, 300)}...`
              : extractedText;

          alert(
            `Text extraction successful!\n\nExtracted ${extractedText.trim().length} characters.\n\nPreview:\n${preview}\n\nCheck console for full text and detailed extraction log.`,
          );
        } else {
          alert(
            "No text could be extracted from the document. The document may be empty or contain no text elements.",
          );
        }
      } else {
        console.error("Document structure is unexpected:", docObj);
        alert(
          "Document structure is not as expected. Check console for details.",
        );
      }
    } catch (error) {
      console.error("Error during manual text extraction:", error);
      alert(`Error extracting text: ${error.message}`);
    }
  };

  // ==================== Template Designer Functions ====================

  /**
   * Trigger JSON file upload for template data
   */
  const handleJsonFileUpload = () => {
    if (jsonFileInputRef.current) {
      jsonFileInputRef.current.click();
    }
  };

  /**
   * Process uploaded JSON file for template fields
   * Extracts field definitions from the JSON structure
   *
   * @param {Event} event - File input change event
   */
  const handleJsonFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);

      const fields = extractFieldsFromJson(jsonData);
      setTemplateFields(fields);
      setDataSource({
        type: "json-file",
        data: jsonData,
        config: { filename: file.name },
      });
    } catch (error) {
      console.error("Error loading JSON file:", error);
      alert(`Error loading JSON file: ${error.message}`);
    }
    event.target.value = "";
  };

  /**
   * Load static JSON file from public folder
   *
   * @param {string} filename - Name of the JSON file in public folder
   */
  const loadStaticJson = async (filename) => {
    try {
      const response = await fetch(`/${filename}`);
      const jsonData = await response.json();

      const fields = extractFieldsFromJson(jsonData);
      setTemplateFields(fields);
      setDataSource({
        type: "json-static",
        data: jsonData,
        config: { filename },
      });
    } catch (error) {
      console.error("Error loading static JSON:", error);
      alert(`Error loading static JSON: ${error.message}`);
    }
  };

  /**
   * Handle data source selection change
   *
   * @param {Event} event - Select change event
   */
  const handleDataSourceChange = (event) => {
    const type = event.target.value;

    if (type === "json-file") {
      handleJsonFileUpload();
    } else if (type === "json-static") {
      const filename = prompt(
        "Enter JSON filename from public folder:\n\nAvailable files:\n- invoice.json\n- menu.json",
        "menu.json",
      );
      if (filename) {
        loadStaticJson(filename);
      }
    } else if (type === "api" || type === "database") {
      setShowConfigModal(true);
    } else {
      setTemplateFields([]);
      setDataSource({ type: "none", data: null, config: {} });
    }
  };

  /**
   * Insert template field at cursor position
   * Note: Uses onMouseDown with preventDefault to keep focus on the editor
   *
   * @param {Object} field - Field object with placeholder property
   */
  const insertFieldAtCursor = (field) => {
    const currentEditor = editorRef.current;
    if (!currentEditor) {
      alert("Editor not initialized");
      return;
    }

    try {
      const placeholder = field.placeholder || `{{${field.name}}}`;
      currentEditor.insertTextAtCursor(placeholder);
    } catch (error) {
      console.error("Error inserting text at cursor:", error);
      alert(`Error inserting field: ${error.message}`);
    }
  };

  /**
   * Handle drag start for template fields
   *
   * @param {Object} field - Field being dragged
   */
  const handleDragStart = (field) => {
    setDraggedField(field);
  };

  /**
   * Handle drag over editor
   *
   * @param {Event} event - Drag event
   */
  const handleDragOver = (event) => {
    event.preventDefault();
    event.currentTarget.classList.add("drag-over");
  };

  /**
   * Handle drag leave editor
   *
   * @param {Event} event - Drag event
   */
  const handleDragLeave = (event) => {
    event.currentTarget.classList.remove("drag-over");
  };

  /**
   * Handle drop field on editor
   *
   * @param {Event} event - Drop event
   */
  const handleDrop = (event) => {
    event.preventDefault();
    event.currentTarget.classList.remove("drag-over");

    if (draggedField) {
      insertFieldAtCursor(draggedField);
      setDraggedField(null);
    }
  };

  /**
   * Get nested value from object using dot notation
   * Example: getNestedValue({a: {b: 'value'}}, 'a.b') returns 'value'
   */
  const getNestedValue = (obj, path) => {
    // Handle model wrapper (e.g., menu.json has data.model structure)
    let data = obj;
    if (obj.model && typeof obj.model === "object") {
      data = obj.model;
    }

    const keys = path.split(".");
    let current = data;

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[key];
    }

    return current;
  };

  /**
   * Validate template placeholders against data source
   * Returns validation results with details about issues
   * Handles nested loops and object contexts
   */
  const validateTemplate = async (documentText, data) => {
    const issues = [];
    const warnings = [];

    // Extract all placeholders from the document
    const placeholderRegex = /\{\{([^}]+)\}\}/g;
    const placeholders = [];
    let match;

    while ((match = placeholderRegex.exec(documentText)) !== null) {
      placeholders.push({
        full: match[0],
        field: match[1].trim(),
        position: match.index,
      });
    }

    if (placeholders.length === 0) {
      warnings.push(
        "No template placeholders found in the document. The document will be generated as-is without any data population.",
      );
      return { issues, warnings, placeholderCount: 0 };
    }

    // Build context stack to track nested loops
    const contextStack = [data];
    const loopStack = [];

    placeholders.forEach((placeholder) => {
      const field = placeholder.field;

      // Handle loop/section start markers
      if (field.startsWith("#")) {
        const fieldName = field.substring(1);
        const currentContext = contextStack[contextStack.length - 1];
        const value = getNestedValue(currentContext, fieldName);

        if (value === undefined) {
          issues.push(
            `Loop/Section marker "{{${field}}}" references missing data: "${fieldName}"`,
          );
          // Push undefined to maintain stack consistency
          contextStack.push(undefined);
          loopStack.push(fieldName);
        } else if (Array.isArray(value)) {
          // Array loop - push first item as context (or empty object if array is empty)
          const itemContext = value.length > 0 ? value[0] : {};
          contextStack.push(itemContext);
          loopStack.push(fieldName);
        } else if (typeof value === "object" && value !== null) {
          // Object section - push object as context
          contextStack.push(value);
          loopStack.push(fieldName);
        } else {
          warnings.push(
            `Loop marker "{{${field}}}" points to "${fieldName}" which is not an array or object (it's a ${typeof value}). This may cause unexpected behavior.`,
          );
          contextStack.push(value);
          loopStack.push(fieldName);
        }
      }
      // Handle loop/section end markers
      else if (field.startsWith("/")) {
        const fieldName = field.substring(1);
        const expectedLoop = loopStack[loopStack.length - 1];

        if (loopStack.length === 0) {
          warnings.push(
            `Loop end marker "{{${field}}}" found without a matching start marker.`,
          );
        } else if (expectedLoop !== fieldName) {
          warnings.push(
            `Loop end marker "{{${field}}}" doesn't match the most recent loop start "{{#${expectedLoop}}}". Loops may be improperly nested.`,
          );
        } else {
          // Pop context when exiting loop
          contextStack.pop();
          loopStack.pop();
        }
      }
      // Handle regular field placeholders
      else {
        // Check in current context (innermost loop/section)
        const currentContext = contextStack[contextStack.length - 1];

        if (currentContext === undefined) {
          // Skip validation if we're in an undefined context (already reported as error)
          return;
        }

        // For fields in a loop context, check against the item schema
        let value;

        // Try to resolve field in current context first
        if (field.includes(".")) {
          // Nested field like "address.city"
          value = getNestedValue(currentContext, field);
        } else {
          // Simple field - check current context directly
          if (
            typeof currentContext === "object" &&
            currentContext !== null &&
            field in currentContext
          ) {
            value = currentContext[field];
          } else {
            // Fallback to root data if not in current context
            value = getNestedValue(data, field);
          }
        }

        // Only report as issue if truly not found anywhere
        if (value === undefined) {
          // Check if we're in a loop context
          if (loopStack.length > 0) {
            // In a loop, field should exist in the item context
            if (typeof currentContext === "object" && currentContext !== null) {
              if (!(field in currentContext)) {
                issues.push(
                  `Placeholder "{{${field}}}" in loop "{{#${loopStack[loopStack.length - 1]}}}" has no corresponding field in the loop items.`,
                );
              }
            }
          } else {
            // Not in a loop, check root data
            const rootValue = getNestedValue(data, field);
            if (rootValue === undefined) {
              issues.push(
                `Placeholder "{{${field}}}" has no corresponding data. Please ensure your data source includes a "${field}" field.`,
              );
            }
          }
        } else if (value === null) {
          warnings.push(
            `Placeholder "{{${field}}}" has a null value in the data source.`,
          );
        }
      }
    });

    // Check for unclosed loops
    if (loopStack.length > 0) {
      loopStack.forEach((loopName) => {
        warnings.push(
          `Loop "{{#${loopName}}}" was started but never closed with "{{/${loopName}}}".`,
        );
      });
    }

    return { issues, warnings, placeholderCount: placeholders.length };
  };

  /**
   * Wait for Nutrient Viewer SDK to be available on window
   * NutrientViewer global objects
   * @param {number} timeout - Maximum wait time in milliseconds
   * @returns {Promise<object|null>} - SDK object if loaded, null if timeout
   */
  const waitForSDK = (timeout = 5000) => {
    return new Promise((resolve) => {
      if (window.NutrientViewer) {
        resolve(window.NutrientViewer);
        return;
      }

      const startTime = Date.now();
      const checkInterval = setInterval(() => {
        if (window.NutrientViewer) {
          clearInterval(checkInterval);
          resolve(window.NutrientViewer);
        } else if (Date.now() - startTime > timeout) {
          clearInterval(checkInterval);
          resolve(null);
        }
      }, 100);
    });
  };

  /**
   * Generate document from template with data
   * Replaces template placeholders with actual data values
   * Includes comprehensive validation and error handling
   */
  const handleGenerateDocument = async () => {
    const currentEditor = editorRef.current;
    const currentDocAuthSystem = docAuthSystemRef.current;

    if (!currentEditor) {
      alert("Editor not initialized. Please load or create a document first.");
      return;
    }

    if (!currentDocAuthSystem) {
      alert(
        "Document Authoring system not initialized. Please refresh the page.",
      );
      return;
    }

    if (!dataSource.data) {
      alert("No data source loaded. Please select a data source first.");
      return;
    }

    try {
      setIsLoading(true);

      const currentDoc = currentEditor.currentDocument();
      if (!currentDoc) {
        throw new Error("No document available");
      }

      // Extract document text for validation
      const docObj = await currentDoc.saveDocument();
      let documentText = "";

      if (docObj?.container?.document?.body?.sections) {
        documentText = extractTextFromSections(
          docObj.container.document.body.sections,
        );
      }

      // Validate template before attempting to generate
      console.log("Validating template...");
      console.log("Document text:", documentText);
      console.log("Data source:", dataSource.data);
      const validation = await validateTemplate(documentText, dataSource.data);
      console.log("Validation results:", validation);

      // Show validation results only if there are critical issues
      if (validation.issues.length > 0) {
        const issueList = validation.issues
          .map((issue, i) => `${i + 1}. ${issue}`)
          .join("\n\n");

        const proceed = confirm(
          "⚠️ Template Validation Issues Found\n\n" +
            `${validation.issues.length} issue(s) detected:\n\n${issueList}\n\n` +
            "Note: These issues may be false positives if your template uses advanced nested structures.\n\n" +
            "Recommendations:\n" +
            "• Review the console log for detailed validation results\n" +
            "• Verify that loop contexts are correctly structured\n" +
            "• Check that nested fields exist in their respective loop items\n\n" +
            "Do you want to proceed? (Click OK to continue, Cancel to review your template)",
        );

        if (!proceed) {
          console.log("Template validation details:", validation);
          return;
        }
      } else if (validation.warnings.length > 0) {
        console.warn("Template validation warnings:", validation);
        // Don't block generation for warnings, just log them
      }

      // Export current document as DOCX template
      console.log("Exporting template as DOCX...");
      const templateBuffer = await currentDoc.exportDOCX();

      if (!templateBuffer || templateBuffer.byteLength === 0) {
        throw new Error(
          "Failed to export template. The exported document is empty.",
        );
      }

      // Get Nutrient Viewer SDK for template population
      // Wait for the SDK to be available (it loads asynchronously)
      console.log("Waiting for Nutrient Viewer SDK to load...");
      const SDK = await waitForSDK(10000); // Increased timeout to 10 seconds

      if (!SDK) {
        throw new Error(
          "Nutrient Viewer SDK not found after waiting 10 seconds.\n\n" +
            "The template population feature requires the Nutrient Viewer SDK.\n\n" +
            "Please ensure this script is loaded in your index.html:\n" +
            "https://cdn.nutrient.io/v2024.8.2/nutrient-lib.js\n\n" +
            "Check the browser console and Network tab for script loading errors.",
        );
      }

      console.log("SDK loaded successfully!", SDK);

      if (!SDK.populateDocumentTemplate) {
        throw new Error(
          "populateDocumentTemplate function not available. This function requires Nutrient Viewer Web SDK.\n\n" +
            "Please verify:\n" +
            "• The correct SDK version is loaded in index.html\n" +
            "• Your license key supports document template population",
        );
      }

      // Prepare data for template population
      console.log("Populating template with data...");
      console.log("Data source:", dataSource.data);

      // Populate template with data
      const populatedBuffer = await SDK.populateDocumentTemplate(
        { document: templateBuffer },
        dataSource.data,
      );

      if (!populatedBuffer || populatedBuffer.byteLength === 0) {
        throw new Error(
          "Template population returned an empty document. This may indicate:\n\n" +
            "• Invalid template syntax\n" +
            "• Data format mismatch\n" +
            "• Empty template document\n\n" +
            "Please check the console for detailed error messages.",
        );
      }

      // Import populated DOCX back into Document Authoring
      console.log("Importing generated document...");
      const generatedDocument =
        await currentDocAuthSystem.importDOCX(populatedBuffer);

      if (!generatedDocument) {
        throw new Error("Failed to import the generated document.");
      }

      // Set generated document in editor
      await currentEditor.setCurrentDocument(generatedDocument);

      const successMessage =
        validation.placeholderCount > 0
          ? "✅ Document generated successfully!\n\n" +
            `• ${validation.placeholderCount} placeholder(s) populated\n` +
            `• ${validation.warnings.length} warning(s)\n\n` +
            "The populated template is now displayed in the editor."
          : "✅ Document generated!\n\n" +
            "No placeholders were found, so the document was copied as-is.";

      alert(successMessage);
    } catch (error) {
      console.error("Error generating document:", error);
      console.error("Error stack:", error.stack);

      // Enhanced error message based on error type
      let userMessage = "❌ Document Generation Failed\n\n";

      if (error.message.includes("Object reference not set")) {
        userMessage +=
          "Issue: Template processing error\n\n" +
          "This usually means:\n" +
          "• A placeholder references missing or null data\n" +
          "• Loop markers ({{#field}}/{{/field}}) are mismatched or incomplete\n" +
          "• Data structure doesn't match template expectations\n\n" +
          "Troubleshooting steps:\n" +
          "1. Review the validation messages above\n" +
          "2. Ensure all placeholders have corresponding data\n" +
          "3. Check that loop markers are properly paired:\n" +
          "   {{#items}} ... {{/items}}\n" +
          "4. Verify your data source structure matches the template\n\n" +
          `Technical details: ${error.message}`;
      } else if (error.message.includes("unknown_error")) {
        userMessage +=
          "Issue: Unknown error during template population\n\n" +
          "Common causes:\n" +
          "• Invalid template syntax\n" +
          "• Data type mismatch (e.g., trying to loop over a string)\n" +
          "• Nested structure issues\n" +
          "• Special characters in placeholders\n\n" +
          "Suggestions:\n" +
          "1. Simplify your template and test with basic placeholders\n" +
          "2. Verify your JSON data is valid\n" +
          "3. Check for typos in placeholder names\n" +
          "4. Review the browser console for detailed errors\n\n" +
          `Technical details: ${error.message}`;
      } else if (error.message.includes("not available")) {
        userMessage +=
          "Issue: Required SDK functionality missing\n\n" + error.message;
      } else {
        userMessage +=
          "Issue: Unexpected error\n\n" +
          `Details: ${error.message}\n\n` +
          "Please check the browser console for more information.";
      }

      alert(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="document-editor">
      {/* Unified Professional Header with all controls */}
      <Header
        onNewDocument={handleNewDocument}
        onLoadDocument={handleDocxUpload}
        onGenerateDocument={handleGenerateDocument}
        onExtractText={handleExtractText}
        onExportJson={handleExportJson}
        onExportPdf={handleExportPdf}
        onExportDocx={handleExportDocx}
        isLoading={isLoading}
        dataSource={dataSource}
        onDataSourceChange={handleDataSourceChange}
      />

      {/* Main Editor Container */}
      <div className="editor-main-container">
        {/* Left Sidebar with Template Fields */}
        {templateFields.length > 0 && (
          <div className="template-fields-sidebar">
            <div className="sidebar-header">
              <h3>Template Fields</h3>
              <p className="sidebar-hint">Drag or click to insert</p>
            </div>
            <div className="fields-container">
              {templateFields.map((field) => (
                <button
                  key={field.name}
                  type="button"
                  className="field-button"
                  draggable
                  onDragStart={() => handleDragStart(field)}
                  onMouseDown={(e) => {
                    // Prevent button from receiving focus to keep cursor in editor
                    e.preventDefault();
                    insertFieldAtCursor(field);
                  }}
                  title={`Insert ${field.placeholder}`}
                  tabIndex={-1}
                >
                  <span className="field-icon">📋</span>
                  <span className="field-label">{field.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Editor Container */}
        <section
          className="editor-container"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          aria-label="Document editor drop zone"
        >
          {isLoading && (
            <div className="loading-overlay">
              <div className="loading-spinner" />
              <p>Processing...</p>
            </div>
          )}

          <div ref={containerRef} className="editor-wrapper" />
        </section>
      </div>

      {/* Configuration Modal */}
      {showConfigModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => setShowConfigModal(false)}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setShowConfigModal(false);
            }
          }}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="document"
          >
            <h2 id="modal-title">Configure Data Source</h2>
            <p>API and Database configuration coming soon...</p>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="toolbar-button secondary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".docx,.json,.docjson"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />
      <input
        ref={jsonFileInputRef}
        type="file"
        accept=".json"
        onChange={handleJsonFileChange}
        style={{ display: "none" }}
      />
    </div>
  );
}
