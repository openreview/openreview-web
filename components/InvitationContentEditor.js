import React, { useState, useEffect } from 'react';

const FIELD_TEMPLATES = {
  "Short Text": { type: "string", param: { regex: ".*" }, description: "Short text field" },
  "Long Text": { type: "string", param: { regex: ".*" }, description: "Long text field" },
  "Single Choice": { type: "string", param: { enum: [], input: "radio" }, description: "Single choice field" },
  "Multiple Choice": { type: "string", param: { enum: [], input: "checkbox" }, description: "Multiple choice field" },
  "Integer": { type: "integer", description: "Integer field" },
  "Number": { type: "float", description: "Number field" },
  "Yes/No": { type: "boolean", description: "Yes/No field" },
  "File": { type: "file", description: "File upload field" }
};

const InvitationContentEditor = ({ contentFields, isNested = false, onContentChange }) => {
  const [fields, setFields] = useState(Object.entries(contentFields).map(([name, config]) => ({
    name,
    ...config.value.param,
    description: config.description,
    order: config.order
  })));

  const [formData, setFormData] = useState(() => {
    const initialData = {};
    fields.forEach(field => {
      initialData[field.name] = '';
    });
    return initialData;
  });

  const [errors, setErrors] = useState({});

  const [selectedIndex, setSelectedIndex] = useState(null);

  const handleInputChange = (field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
    validateField(field, value);
  };

  const validateField = (field, value) => {
    const fieldConfig = fields.find(f => f.name === field);
    let error = '';
    if (fieldConfig.regex && !new RegExp(fieldConfig.regex).test(value)) {
      error = 'Invalid format';
    }
    setErrors(prevErrors => ({
      ...prevErrors,
      [field]: error
    }));
  };

  const handleAddField = (fieldType) => {
    const newField = {
      name: `newField${fields.length + 1}`,
      ...FIELD_TEMPLATES[fieldType],
      order: fields.length + 1
    };
    setFields(prevFields => {
      const updatedFields = [...prevFields, newField];
      setSelectedIndex(updatedFields.length - 1); // Select the new field
      return updatedFields;
    });
    setFormData(prevData => ({
      ...prevData,
      [newField.name]: ''
    }));
  };

  const moveFieldUp = (index) => {
    if (index === 0) return;
    setFields(prevFields => {
      const newFields = [...prevFields];
      [newFields[index - 1], newFields[index]] = [newFields[index], newFields[index - 1]];
      return newFields.map((f, idx) => ({ ...f, order: idx + 1 }));
    });
    if (selectedIndex === index) setSelectedIndex(index - 1);
    else if (selectedIndex === index - 1) setSelectedIndex(index);
  };

  const moveFieldDown = (index) => {
    if (index === fields.length - 1) return;
    setFields(prevFields => {
      const newFields = [...prevFields];
      [newFields[index], newFields[index + 1]] = [newFields[index + 1], newFields[index]];
      return newFields.map((f, idx) => ({ ...f, order: idx + 1 }));
    });
    if (selectedIndex === index) setSelectedIndex(index + 1);
    else if (selectedIndex === index + 1) setSelectedIndex(index);
  };

  const deleteField = (index) => {
    if (window.confirm("Are you sure you want to delete this field?")) {
      setFields(prevFields => {
        const newFields = prevFields.filter((_, i) => i !== index).map((field, idx) => ({ ...field, order: idx + 1 }));
        return newFields;
      });
      if (selectedIndex === index) {
        setSelectedIndex(null);
      } else if (selectedIndex > index) {
        setSelectedIndex(selectedIndex - 1);
      }
    }
  };
  const generateContentJson = () => {
    let content = {};
    fields.forEach(field => {
      const fieldName = field.name;
      content[fieldName] = {};
      if (field.description && field.description.trim() !== "") {
        content[fieldName].description = field.description.trim();
      }
      content[fieldName].order = field.order;
      content[fieldName].value = { param: {} };
      content[fieldName].value.param.type = field.type;

      if (field.options && field.options.length > 0) {
        content[fieldName].value.param.enum = field.options.slice();
        content[fieldName].value.param.input = field.allowMultiple ? "checkbox" : "radio";
        if (!field.required) {
          content[fieldName].value.param.optional = true;
        }
      } else {
        if (field.type === "string" && field.regex && field.regex.trim() !== "") {
          content[fieldName].value.param.regex = field.regex;
        }
        if ((field.type === "integer" || field.type === "float")) {
          if (field.min !== undefined && field.min !== null) {
            content[fieldName].value.param.minimum = Number(field.min);
          }
          if (field.max !== undefined && field.max !== null) {
            content[fieldName].value.param.maximum = Number(field.max);
          }
        }
        if (field.type === "file") {
          if (field.extensions && field.extensions.length > 0) {
            content[fieldName].value.param.extensions = field.extensions.slice();
          }
          if (field.maxSize) {
            content[fieldName].value.param.maxSize = Number(field.maxSize);
          }
        }
        if (!field.required) {
          content[fieldName].value.param.optional = true;
        }
      }
    });
    return content;
  };

  useEffect(() => {
    if (onContentChange) {
      const contentJson = generateContentJson();
      onContentChange(contentJson);
    }
  }, [fields, onContentChange]);



  const renderField = (field, index) => {
    const inputType = field.type === 'string' ? 'text' : 'textarea';
    const isSelected = selectedIndex === index;

    return (
      <div
        key={field.name}
        className={`form-group ${isSelected ? 'selected-field' : ''}`}
        onClick={() => setSelectedIndex(index)}
        style={{ cursor: 'pointer', backgroundColor: isSelected ? '#eef' : 'transparent' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>{field.name} ({field.type})</span>
          <div>
            <button onClick={() => moveFieldUp(index)} disabled={index === 0}>▲</button>
            <button onClick={() => moveFieldDown(index)} disabled={index === fields.length - 1}>▼</button>
            <button onClick={() => deleteField(index)}>✕</button>
          </div>
        </div>
        <label>{field.description}</label>
        <input
          type={inputType}
          value={formData[field.name]}
          onChange={(e) => handleInputChange(field.name, e.target.value)}
          maxLength={field.maxLength}
          pattern={field.regex}
          className="form-control"
          aria-describedby={`${field.name}-error`}
        />
        {errors[field.name] && (
          <small id={`${field.name}-error`} className="form-text text-danger">
            {errors[field.name]}
          </small>
        )}
      </div>
    );
  };

  return (
    <div className="invitation-editor">
      <div className="invitation-path-info" style={{ padding: '10px', fontStyle: 'italic', fontSize: '0.9em' }}>
        {isNested
          ? "Note: Editing a child invitation's form fields (invitation.edit.invitation.edit.note.content)"
          : "Note: Editing a standalone invitation's form fields (invitation.edit.note.content)"}
      </div>
      <div style={{ display: 'flex' }}>

      <div className="field-types" style={{ flex: 1, padding: '10px', borderRight: '1px solid #ccc' }}>
        <ul style={{ listStyleType: 'none', padding: 0 }}>
          {Object.keys(FIELD_TEMPLATES).map(type => (
            <li key={type}>
              <button onClick={() => handleAddField(type)} className="btn btn-secondary" style={{ marginBottom: '5px' }}>
                Add {type}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="field-list" style={{ flex: 2, padding: '10px' }}>
        <form onSubmit={(e) => e.preventDefault()}>
          {fields.map(renderField)}
          <button type="submit" className="btn btn-primary">Save Changes</button>
        </form>
      </div>
      <div className="field-editor" style={{ flex: 1, padding: '10px', borderLeft: '1px solid #ccc' }}>
        {selectedIndex !== null ? (
          <div>
            <h3>Edit Field: {fields[selectedIndex].name}</h3>
            <div className="form-group">
              <label>Field Name</label>
              <input
                type="text"
                value={fields[selectedIndex].name}
                onChange={(e) => handleFieldPropertyChange('name', e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={fields[selectedIndex].description}
                onChange={(e) => handleFieldPropertyChange('description', e.target.value)}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={fields[selectedIndex].required}
                  onChange={(e) => handleFieldPropertyChange('required', e.target.checked)}
                />
                Required
              </label>
            </div>
            {fields[selectedIndex].type === 'string' && (
              <div className="form-group">
                <label>Regex Validation</label>
                <input
                  type="text"
                  value={fields[selectedIndex].regex || ''}
                  onChange={(e) => handleFieldPropertyChange('regex', e.target.value)}
                  className="form-control"
                />
              </div>
            )}
            {fields[selectedIndex].type === 'integer' || fields[selectedIndex].type === 'float' ? (
              <>
                <div className="form-group">
                  <label>Minimum</label>
                  <input
                    type="number"
                    value={fields[selectedIndex].min || ''}
                    onChange={(e) => handleFieldPropertyChange('min', e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Maximum</label>
                  <input
                    type="number"
                    value={fields[selectedIndex].max || ''}
                    onChange={(e) => handleFieldPropertyChange('max', e.target.value)}
                    className="form-control"
                  />
                </div>
              </>
            ) : null}
            {fields[selectedIndex].type === 'file' && (
              <>
                <div className="form-group">
                  <label>Allowed Extensions</label>
                  <input
                    type="text"
                    value={fields[selectedIndex].extensions || ''}
                    onChange={(e) => handleFieldPropertyChange('extensions', e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label>Max Size (MB)</label>
                  <input
                    type="number"
                    value={fields[selectedIndex].maxSize || ''}
                    onChange={(e) => handleFieldPropertyChange('maxSize', e.target.value)}
                    className="form-control"
                  />
                </div>
              </>
            )}
          </div>
        ) : (
          <p>Select a field to edit its properties</p>
        )}
      </div>
      </div>
    </div>
  );
};

export default InvitationContentEditor
