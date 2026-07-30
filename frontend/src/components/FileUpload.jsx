import { useState, useRef } from 'react';

/**
 * Drag-and-drop PDF file upload component.
 */
export default function FileUpload({ file, onFileSelect }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState('');
  const inputRef = useRef(null);

  const selectFile = (selected) => {
    if (!selected) return;
    if (selected.type !== 'application/pdf' && !selected.name.toLowerCase().endsWith('.pdf')) {
      setValidationError('Please choose a PDF file.');
      return;
    }
    if (selected.size > 10 * 1024 * 1024) {
      setValidationError('Please choose a PDF smaller than 10 MB.');
      return;
    }
    setValidationError('');
    onFileSelect(selected);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    selectFile(e.dataTransfer.files[0]);
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (e) => {
    selectFile(e.target.files[0]);
  };

  const className = [
    'file-upload',
    isDragOver && 'file-upload--drag-over',
    file && 'file-upload--has-file',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      id="file-upload-zone"
      className={className}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label="Upload your CV as PDF"
    >
      <input
        ref={inputRef}
        type="file"
        accept=".pdf"
        onChange={handleChange}
      />

      {file ? (
        <>
          <span className="file-upload__icon file-upload__icon--success" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="m7.5 12 3 3 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <p className="file-upload__text">Resume ready</p>
            <p className="file-upload__filename">{file.name}</p>
            <p className="file-upload__action">Click to replace</p>
          </div>
        </>
      ) : (
        <>
          <span className="file-upload__icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14.5v3A2.5 2.5 0 0 0 7.5 20h9a2.5 2.5 0 0 0 2.5-2.5v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <div>
            <p className="file-upload__text">
              <strong>Drop your resume here</strong>
            </p>
            <p className="file-upload__action">or choose a PDF · 10 MB max</p>
          </div>
        </>
      )}
      {validationError && (
        <p className="file-upload__error" role="alert">{validationError}</p>
      )}
    </div>
  );
}
