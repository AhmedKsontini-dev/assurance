# Modern Alert System

A modern, beautiful alert system for your React dashboard with animations, auto-dismiss, and dark mode support.

## Features

- ✨ Modern SaaS-style design with soft shadows and rounded corners
- 🎨 Color-coded alerts (success, error, warning, info)
- 📱 Responsive design for mobile devices
- 🌙 Dark mode support
- ⏱️ Auto-dismiss with progress bar
- 🎯 Smooth slide-in/slide-out animations
- 📦 Stacking behavior for multiple alerts
- 🚫 Manual close button
- ⏸️ Pause on hover

## Usage

### Basic Usage

```jsx
import { useAlert } from '../context/AlertContext';

function MyComponent() {
  const { success, error, warning, info } = useAlert();

  const handleSuccess = () => {
    success('Operation completed successfully!');
  };

  const handleError = () => {
    error('Something went wrong!');
  };

  const handleWarning = () => {
    warning('Please check your input');
  };

  const handleInfo = () => {
    info('New message received');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Show Success</button>
      <button onClick={handleError}>Show Error</button>
      <button onClick={handleWarning}>Show Warning</button>
      <button onClick={handleInfo}>Show Info</button>
    </div>
  );
}
```

### Advanced Usage with Options

```jsx
const { success } = useAlert();

const handleCustomAlert = () => {
  success('Custom alert!', {
    duration: 10000, // 10 seconds
    description: 'This is a detailed description of the alert.',
  });
};
```

### Alert Types

- `success(message, options)` - Green success alert
- `error(message, options)` - Red error alert
- `warning(message, options)` - Orange warning alert
- `info(message, options)` - Blue info alert

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `duration` | number | `5000` | Auto-dismiss time in milliseconds (0 to disable) |
| `description` | string | `undefined` | Additional description text |

### Examples

#### Success Alert with Description

```jsx
const { success } = useAlert();

success('Client created successfully!', {
  duration: 8000,
  description: 'The client has been added to your portfolio.',
});
```

#### Error Alert

```jsx
const { error } = useAlert();

error('Failed to save changes', {
  description: 'Please check your connection and try again.',
});
```

#### Persistent Alert (No Auto-dismiss)

```jsx
const { warning } = useAlert();

warning('Unsaved changes', {
  duration: 0, // Won't auto-dismiss
  description: 'Please save your work before leaving.',
});
```

## Integration

The alert system is already integrated into your app:

1. **AlertProvider** is wrapped around your app in `App.jsx`
2. **AlertContainer** is rendered to display alerts
3. Just import and use `useAlert` hook in any component

## Customization

### Colors

You can customize the alert colors by modifying the CSS variables in `Alert.css`:

```css
.alert-success {
  --alert-bg: #f0fdf4;
  --alert-border: #22c55e;
  --alert-icon: #16a34a;
  --alert-text: #15803d;
}
```

### Position

To change the alert container position, modify `.alert-container` in `Alert.css`:

```css
.alert-container {
  position: fixed;
  top: 20px;
  right: 20px;
  /* Change to left: 20px for left-aligned */
  /* Change to top: 50%; left: 50%; transform: translate(-50%, -50%); for center */
}
```

## Migration from Old Alerts

Replace old alert calls with the new system:

**Old:**
```jsx
alert('Success message');
// or
window.alert('Error message');
```

**New:**
```jsx
const { success, error } = useAlert();
success('Success message');
error('Error message');
```

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS Grid and Flexbox support required
- CSS Custom Properties (variables) support required
