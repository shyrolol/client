import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  icon,
  fullWidth = false,
  children,
  className = '',
  ...props
}) => {
  const sizeClass = size === 'sm' ? 'ds-button-sm' : size === 'lg' ? 'ds-button-lg' : '';
  const variantClass = `ds-button-${variant}`;
  const iconOnly = !children && icon ? 'ds-button-icon' : '';

  return (
    <button
      className={`ds-button ${variantClass} ${sizeClass} ${iconOnly} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  hint,
  error,
  fullWidth = true,
  className = '',
  ...props
}) => {
  return (
    <div className={`ds-form-group ${fullWidth ? 'form-group-full-width' : 'form-group-auto-width'}`}>
      {label && <label className="ds-form-label">{label}</label>}
      <input
        className={`ds-input ${error ? 'ds-input-error' : ''} ${className}`}
        {...props}
      />
      {error && <div className="ds-form-error">{error}</div>}
      {hint && !error && <div className="ds-form-hint">{hint}</div>}
    </div>
  );
};

interface SelectOption {
  value: string | number;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  fullWidth?: boolean;
}

export const Select: React.FC<SelectProps> = ({
  label,
  hint,
  error,
  options,
  fullWidth = true,
  className = '',
  ...props
}) => {
  return (
    <div className={`ds-form-group ${fullWidth ? 'form-group-full-width' : 'form-group-auto-width'}`}>
      {label && <label className="ds-form-label">{label}</label>}
      <select
        className={`ds-select ${error ? 'ds-input-error' : ''} ${className}`}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <div className="ds-form-error">{error}</div>}
      {hint && !error && <div className="ds-form-hint">{hint}</div>}
    </div>
  );
};

interface ToggleProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  fullWidth?: boolean;
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  description,
  fullWidth = true,
  className = '',
  id,
  ...props
}) => {
  const toggleId = id || `toggle-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={`ds-form-group toggle-container ${fullWidth ? 'form-group-full-width' : 'form-group-auto-width'}`}>
      <div className="toggle-label-container">
        {label && (
          <label
            htmlFor={toggleId}
            className={`ds-form-label ${description ? 'toggle-label-with-desc' : ''}`}
          >
            {label}
          </label>
        )}
        {description && (
          <div className="ds-form-hint toggle-hint-no-margin">
            {description}
          </div>
        )}
      </div>
      <label className="ds-toggle" htmlFor={toggleId}>
        <input type="checkbox" id={toggleId} {...props} />
        <span className="ds-toggle-slider"></span>
      </label>
    </div>
  );
};

interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  showValue?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  hint,
  value,
  min = 0,
  max = 100,
  step = 1,
  showValue = true,
  icon,
  fullWidth = true,
  className = '',
  ...props
}) => {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={`ds-form-group slider-group ${fullWidth ? 'form-group-full-width' : 'form-group-auto-width'}`}>
      {label && <label className="ds-form-label">{label}</label>}
      <div className="slider-container">
        {icon && (
          <div className="slider-icon" aria-hidden="true">
            {icon}
          </div>
        )}
        <div className="slider-wrapper">
          <input
            type="range"
            className={`modern-slider ${className}`}
            value={value}
            min={min}
            max={max}
            step={step}
            data-percentage={percentage}
            style={{
              background: `linear-gradient(to right, var(--accent-primary) 0%, var(--accent-primary) ${percentage}%, var(--bg-tertiary) ${percentage}%, var(--bg-tertiary) 100%)`,
            }}
            {...props}
          />
        </div>
        {showValue && (
          <div className="slider-value" aria-label={`${value} percent`}>
            {value}%
          </div>
        )}
      </div>
      {hint && <div className="ds-form-hint">{hint}</div>}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  hint,
  error,
  fullWidth = true,
  className = '',
  ...props
}) => {
  return (
    <div className={`ds-form-group ${fullWidth ? 'form-group-full-width' : 'form-group-auto-width'}`}>
      {label && <label className="ds-form-label">{label}</label>}
      <textarea
        className={`ds-input ds-textarea ${error ? 'ds-input-error' : ''} ${className}`}
        {...props}
      />
      {error && <div className="ds-form-error">{error}</div>}
      {hint && !error && <div className="ds-form-hint">{hint}</div>}
    </div>
  );
};

