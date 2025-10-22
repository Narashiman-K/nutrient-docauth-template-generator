// src/components/header.jsx
import React from "react";

/**
 * Unified Professional Header Component with Nutrient branding and all controls
 */
export default function Header({
  onNewDocument,
  onLoadDocument,
  onGenerateDocument,
  onExtractText,
  onExportJson,
  onExportPdf,
  onExportDocx,
  isLoading,
  dataSource,
  onDataSourceChange,
}) {
  return (
    <header className="nutrient-header">
      <div className="header-container">
        {/* Left Section: Logo */}
        <div className="header-left">
          <a
            href="https://nutrient.io"
            target="_blank"
            rel="noopener noreferrer"
            className="logo-link"
          >
            <img
              src="/logo.svg"
              width="148"
              height="44"
              alt="Nutrient Logo"
              className="logo-image"
            />
          </a>
        </div>

        {/* Center Section: Application Controls */}
        <nav className="header-nav">
          <button
            type="button"
            onClick={onNewDocument}
            disabled={isLoading}
            className="nav-link nav-button"
          >
            <span>Blank Page</span>
          </button>

          <button
            type="button"
            onClick={onLoadDocument}
            disabled={isLoading}
            className="nav-link nav-button"
          >
            <span>Upload Document</span>
          </button>

          {/* Data Source Dropdown with Filename */}
          <div className="data-source-control">
            <select
              id="data-source-select"
              value={dataSource?.type || "none"}
              onChange={onDataSourceChange}
              className="nav-link nav-select"
              disabled={isLoading}
              title="Select template data source"
            >
              <option value="none">Data Source</option>
              <option value="json-file">Upload JSON</option>
              <option value="json-static">Load JSON</option>
              <option value="api">API</option>
              <option value="database">Database</option>
            </select>
            {dataSource?.type !== "none" && dataSource?.config?.filename && (
              <span
                className="data-source-filename"
                title={dataSource.config.filename}
              >
                {dataSource.config.filename}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onGenerateDocument}
            disabled={isLoading || dataSource?.type === "none"}
            className="nav-link nav-button"
          >
            <span>Generate</span>
          </button>

          <button
            type="button"
            onClick={onExtractText}
            disabled={isLoading}
            className="nav-link nav-button"
          >
            <span>Extract Text</span>
          </button>

          <button
            type="button"
            onClick={onExportJson}
            disabled={isLoading}
            className="nav-link nav-button"
          >
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            disabled={isLoading}
            className="nav-link nav-button"
          >
            <span>Export PDF</span>
          </button>

          <button
            type="button"
            onClick={onExportDocx}
            disabled={isLoading}
            className="nav-link nav-button"
          >
            <span>Export DOCX</span>
          </button>
        </nav>

        {/* Right Section: CTA Buttons */}
        <div className="header-right">
          <a
            href="https://nutrient.io/sdk/document-authoring/"
            target="_blank"
            rel="noreferrer"
            className="btn-learn-more"
          >
            <span>Learn More</span>
          </a>
          <a
            href="https://nutrient.io/contact-sales/"
            target="_blank"
            rel="noreferrer"
            className="btn-contact-sales"
          >
            <span>Contact Sales</span>
          </a>
        </div>
      </div>
    </header>
  );
}
