# Contrast Patterns & Accessibility Guidelines

**Last Updated:** August 15, 2024

## Overview

This document outlines the contrast patterns and accessibility improvements implemented in our application to ensure WCAG AA compliance and a better user experience for people with disabilities.

## Color System

We've implemented a comprehensive CSS variable system to manage colors consistently across the application while ensuring proper contrast in both light and dark modes.

### Base Variables

```css
/* Base light theme variables */
:root {
  --color-primary: #0056b3;
  --color-primary-hover: #004494;
  --text-primary: #212529;
  --text-secondary: #495057;
  --background-primary: #ffffff;
  --background-secondary: #f8f9fa;
  --input-border: #ced4da;
  --input-bg: #ffffff;
  --error: #dc3545;
  --success: #28a745;
  --warning: #ffc107;
  --info: #17a2b8;
}

/* Dark theme overrides */
[data-theme="dark"] {
  --color-primary: #4d94ff;
  --color-primary-hover: #75aeff;
  --text-primary: #f8f9fa;
  --text-secondary: #e9ecef;
  --background-primary: #121212;
  --background-secondary: #1e1e1e;
  --input-border: #495057;
  --input-bg: #2c2c2c;
  --error: #f55a6a;
  --success: #5dd879;
  --warning: #ffd25a;
  --info: #5ccedc;
}
```

## Contrast Requirements

We adhere to the following contrast requirements:

- **Normal text (< 18pt)**: 4.5:1 minimum contrast ratio
- **Large text (≥ 18pt or 14pt bold)**: 3:1 minimum contrast ratio
- **UI components and graphical objects**: 3:1 minimum contrast ratio
- **Focus indicators**: 3:1 minimum contrast against adjacent colors

## Modal Dialog Pattern

Our application uses a consistent modal dialog pattern across all popups to ensure usability, accessibility, and visual consistency.

### Modal Dialog Structure

```jsx
<Dialog
  open={isOpen}
  onOpenChange={onOpenChange}
>
  <DialogContent
    className="max-w-2xl dark:bg-slate-900 dark:border-slate-800"
    aria-labelledby="dialog-title"
    aria-describedby="dialog-description"
    role="dialog"
    aria-modal="true"
  >
    <DialogHeader>
      <DialogTitle id="dialog-title" className="text-foreground">
        {title}
      </DialogTitle>
      <DialogDescription id="dialog-description" className="text-muted-foreground">
        {description}
      </DialogDescription>
      <DialogClose asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 h-8 w-8"
          aria-label="Fermer la boîte de dialogue"
        >
          <X className="h-4 w-4" />
        </Button>
      </DialogClose>
    </DialogHeader>
    
    {/* Dialog Content */}
    <div className="py-4">
      {/* Content goes here */}
    </div>
    
    {/* Dialog Footer */}
    <div className="flex justify-end gap-3">
      <Button 
        onClick={onCancel}
        variant="outline"
        className="bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
      >
        Annuler
      </Button>
      <Button 
        onClick={onConfirm}
        type="submit"
        className="bg-primary text-primary-foreground hover:bg-primary/90"
      >
        Confirmer
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### Modal Dialog Styling

Our modals follow these key design principles:

#### Dark Theme Modal

For consistent visibility across themes, modals in dark mode have:

```css
.dialog-content {
  /* Dark background with sufficient contrast against text */
  background-color: #121212; /* --background-primary in dark mode */
  color: #f8f9fa; /* --text-primary in dark mode */
  
  /* Subtle border to define edges against dark backgrounds */
  border: 1px solid #1e1e1e; /* --background-secondary in dark mode */
  
  /* Soft shadow for depth */
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2);
  
  /* Rounded corners for all dialog elements */
  border-radius: 8px;
  
  /* Content padding */
  padding: 24px;
}
```

#### Error Alerts

Error messages use a consistent pattern:

```css
.error-alert {
  /* High contrast red background with white text */
  background-color: #dc3545; /* --error */
  color: white;
  
  /* Clear visual boundary */
  border-radius: 4px;
  
  /* Proper spacing */
  padding: 12px 16px;
  margin-bottom: 16px;
  
  /* Flexbox layout with icon */
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-alert-icon {
  flex-shrink: 0;
  color: white;
}

.error-alert-title {
  font-weight: 600;
  margin-bottom: 4px;
}
```

#### Form Elements

Form inputs maintain consistent styling:

```css
.form-group {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: var(--text-primary);
}

.required-marker {
  color: var(--error);
  margin-left: 4px;
}

.form-input {
  width: 100%;
  padding: 10px 12px;
  background-color: #2c2c2c; /* --input-bg in dark mode */
  color: var(--text-primary);
  border: 1px solid #495057; /* --input-border in dark mode */
  border-radius: 4px;
  transition: border-color 0.2s;
}

.form-input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 2px rgba(77, 148, 255, 0.25); /* --color-primary in dark mode with opacity */
}
```

#### Radio and Checkbox Elements

Selection controls have distinct styling:

```css
.radio-group {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.radio-item {
  display: flex;
  align-items: center;
  position: relative;
}

.radio-input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.radio-control {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #495057; /* --input-border in dark mode */
  margin-right: 8px;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.radio-input:checked + .radio-control {
  border-color: #ff9500; /* Orange accent */
}

.radio-input:checked + .radio-control::after {
  content: '';
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: #ff9500; /* Orange accent */
}

.radio-input:focus-visible + .radio-control {
  box-shadow: 0 0 0 2px rgba(255, 149, 0, 0.5); /* Orange accent with opacity */
}
```

#### Section Headings

Section headers provide clear organization:

```css
.form-section-header {
  font-size: 18px;
  font-weight: 600;
  margin: 24px 0 16px 0;
  color: var(--text-primary);
  padding-bottom: 8px;
  border-bottom: 1px solid #495057; /* --input-border in dark mode */
}
```

### Modal Dialog Layout Patterns

For consistency, we follow these patterns:

1. **Single Column Forms**: Form elements stack vertically for simple data entry
   ```jsx
   <div className="space-y-4">
     <FormField label="Plaque d'immatriculation" required />
     <FormField label="Marque" required />
     <FormField label="Modèle" required />
     <FormField label="Année" />
   </div>
   ```

2. **Two Column Layout**: For related input pairs or efficient space usage
   ```jsx
   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     <FormField label="Marque" required />
     <FormField label="Modèle" required />
     <FormField label="Année" />
     <FormField label="Kilométrage" required />
   </div>
   ```

3. **Action Button Placement**: Consistently right-aligned, primary button on the right
   ```jsx
   <div className="flex justify-end gap-3 mt-6">
     <Button variant="outline">Annuler</Button>
     <Button type="submit">Ajouter Véhicule</Button>
   </div>
   ```

### Accessibility Features

Our dialog implementation includes these accessibility features:

1. **Focus Management**:
   - Focus moves to the first focusable element when the dialog opens
   - Focus is trapped within the dialog until it closes
   - Focus returns to the triggering element when dialog closes

2. **Keyboard Navigation**:
   - `Escape` key closes the dialog
   - `Tab` navigates through focusable elements in a logical order
   - `Shift+Tab` navigates backward through focusable elements

3. **Screen Reader Support**:
   - `aria-modal="true"` to indicate modal behavior
   - `aria-labelledby` points to the dialog title
   - `aria-describedby` points to the description
   - Close button has `aria-label` for screen readers

4. **Error Handling**:
   - Error messages have `role="alert"` to be announced by screen readers
   - Form fields with errors have `aria-invalid="true"`
   - Error descriptions use `aria-describedby` to connect with their field

### Implementation Example

An example implementation with Shadcn UI components:

```jsx
// FormDialog.tsx
import React, { useRef, useEffect } from 'react';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogDescription, DialogClose 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export function FormDialog({ 
  isOpen, 
  onOpenChange, 
  title, 
  description, 
  onSubmit 
}) {
  const firstInputRef = useRef(null);
  const [error, setError] = useState(null);
  
  // Focus on first input when dialog opens
  useEffect(() => {
    if (isOpen && firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, [isOpen]);
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-2xl dark:bg-slate-900 dark:border-slate-800"
        aria-labelledby="form-dialog-title"
        aria-describedby="form-dialog-description"
      >
        <DialogHeader>
          <DialogTitle id="form-dialog-title">{title}</DialogTitle>
          <DialogDescription id="form-dialog-description">{description}</DialogDescription>
          <DialogClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 h-8 w-8"
              aria-label="Fermer le formulaire"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        
        {error && (
          <Alert variant="destructive" role="alert" aria-live="assertive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target);
          onSubmit(formData);
        }}>
          <div className="py-4 space-y-6">
            {/* Form fields here */}
            <div>
              <Label htmlFor="field1" className="mb-2 block">
                Champ Requis <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="field1" 
                ref={firstInputRef} 
                required 
                className="dark:bg-slate-800 dark:border-slate-700"
              />
            </div>
            
            {/* Radio group example */}
            <RadioGroup defaultValue="option1" className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option1" id="option1" />
                <Label htmlFor="option1">Option 1</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option2" id="option2" />
                <Label htmlFor="option2">Option 2</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Annuler
            </Button>
            <Button 
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Confirmer
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
```

## Implementation Examples

### Button Components

Buttons maintain proper contrast ratios with distinct focus and hover states:

```jsx
// Button component
const Button = ({ children, variant = "primary", disabled, onClick, ariaLabel }) => {
  return (
    <button
      className={`btn btn-${variant}`}
      aria-label={ariaLabel || null}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// CSS for Button
.btn {
  font-weight: 500;
  border-radius: 4px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  transition: background-color 0.2s, box-shadow 0.2s;
}

.btn:focus-visible {
  outline: 3px solid var(--color-focus);
  outline-offset: 2px;
}

.btn-primary {
  background-color: var(--color-primary);
  color: white;
  border: none;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-primary-hover);
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
```

### Form Elements

Form elements use consistent contrast patterns with clear focus and error states:

```jsx
// Form input with accessibility features
const FormInput = ({ 
  id, 
  label, 
  value, 
  onChange, 
  error, 
  required, 
  type = "text",
  placeholder
}) => {
  const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <div className="form-group">
      <label htmlFor={inputId} className="form-label">
        {label}{required && <span className="required-marker">*</span>}
      </label>
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={onChange}
        className={`form-input ${error ? 'input-error' : ''}`}
        placeholder={placeholder}
        aria-invalid={error ? "true" : "false"}
        aria-describedby={error ? `${inputId}-error` : undefined}
        required={required}
      />
      {error && (
        <div id={`${inputId}-error`} className="error-message" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

// CSS for form elements
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-primary);
}

.required-marker {
  color: var(--error);
  margin-left: 0.25rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--input-border);
  border-radius: 4px;
  background-color: var(--input-bg);
  color: var(--text-primary);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.25);
  outline: none;
}

.input-error {
  border-color: var(--error);
}

.error-message {
  color: var(--error);
  font-size: 0.875rem;
  margin-top: 0.5rem;
}
```

## AddVehicleModal Accessibility Improvements

The AddVehicleModal component has been enhanced with:

1. Proper focus management when modal opens/closes
2. Keyboard navigation trap within the modal
3. Descriptive ARIA attributes
4. High contrast form elements
5. Clear error messages

```jsx
// Example implementation
<div 
  role="dialog"
  aria-modal="true"
  aria-labelledby="add-vehicle-modal-title"
  aria-describedby="add-vehicle-modal-desc"
  className="modal"
>
  <div className="modal-content">
    <h2 id="add-vehicle-modal-title">Add New Vehicle</h2>
    <p id="add-vehicle-modal-desc" className="sr-only">
      Form to add a new vehicle to your account
    </p>
    
    {/* Form elements go here */}
    
    <div className="modal-actions">
      <button 
        onClick={handleClose} 
        className="btn btn-secondary"
        aria-label="Cancel adding vehicle"
      >
        Cancel
      </button>
      <button 
        onClick={handleSubmit} 
        className="btn btn-primary"
        aria-label="Save new vehicle"
      >
        Save
      </button>
    </div>
  </div>
</div>
```

## Additional Accessibility Features

### Skip Navigation

Added a skip navigation link for keyboard users:

```jsx
<a href="#main-content" className="skip-link">
  Skip to main content
</a>

// CSS
.skip-link {
  position: absolute;
  top: -40px;
  left: 0;
  background: var(--color-primary);
  color: white;
  padding: 8px;
  z-index: 100;
  transition: top 0.2s;
}

.skip-link:focus {
  top: 0;
}
```

### ARIA Landmarks

Added proper ARIA landmarks to help screen reader users navigate:

```jsx
<header role="banner">
  {/* Header content */}
</header>

<nav role="navigation">
  {/* Navigation */}
</nav>

<main id="main-content" role="main">
  {/* Main content */}
</main>

<footer role="contentinfo">
  {/* Footer content */}
</footer>
```

## Testing

Use the following tools to verify contrast compliance:

1. **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
2. **axe DevTools**: Browser extension for accessibility testing
3. **Lighthouse**: Chrome DevTools built-in accessibility audits
4. **NVDA/VoiceOver**: Test with actual screen readers

## Best Practices

1. Always use semantic HTML elements
2. Include `alt` text for all images
3. Ensure interactive elements have accessible names
4. Maintain focus visibility for keyboard navigation
5. Provide sufficient color contrast
6. Use ARIA attributes only when necessary
7. Test with assistive technologies

## Future Improvements

1. Implement high contrast mode
2. Add reduced motion preferences
3. Improve screen reader announcements for dynamic content
4. Enhance keyboard navigation patterns

This document will be updated as we continue to improve accessibility throughout the application. 