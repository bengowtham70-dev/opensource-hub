---
name: frontend-generator
description: Help generate frontend components and UI code. Use when you need to create React components, style with Tailwind, build layouts, or implement UI patterns. USE FOR: React components, Tailwind CSS, UI generation, layouts, forms, modals, dashboards.
---

# Frontend Component Generator

Generate frontend components following best practices and your project's patterns.

## When to Use

- Creating new React components
- Styling with Tailwind CSS
- Building layouts and pages
- Implementing UI patterns (modals, forms, tables)
- Generating dashboard views

## How to Use

### Step 1: Check Existing Patterns
Before generating, read neighboring files to understand:
- Component structure (functional vs class)
- Styling approach (Tailwind, CSS modules, styled-components)
- State management (props, context, hooks)
- Import patterns

### Step 2: Generate Component
Create component following project conventions:

```tsx
// Example: Button component
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-blue-600 text-white hover:bg-blue-700': variant === 'primary',
            'bg-gray-200 text-gray-900 hover:bg-gray-300': variant === 'secondary',
            'hover:bg-gray-100': variant === 'ghost',
          },
          {
            'h-8 px-3 text-sm': size === 'sm',
            'h-10 px-4 text-sm': size === 'md',
            'h-12 px-6 text-base': size === 'lg',
          },
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Spinner className="mr-2 h-4 w-4" />}
        {children}
      </button>
    );
  }
);
```

### Step 3: Add Props Interface
Define TypeScript interface for type safety:

```typescript
interface ComponentProps {
  // Required props
  title: string;
  onSubmit: (data: FormData) => void;
  
  // Optional props
  variant?: 'default' | 'compact';
  className?: string;
  children?: React.ReactNode;
}
```

### Step 4: Handle State
Use appropriate state management:
- **Local state**: useState for simple state
- **Context**: For shared state across components
- **Props**: For parent-child communication

## Component Patterns

### Form Component
```tsx
export function ContactForm({ onSubmit }: ContactFormProps) {
  const [formData, setFormData] = useState({ name: '', email: '' });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Name"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
      />
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

### Modal Component
```tsx
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
```

### Table Component
```tsx
export function DataTable<T>({ data, columns }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col.key} className="px-6 py-4 whitespace-nowrap">
                  {col.render ? col.render(row[col.key]) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Best Practices

1. **Keep components small** and focused on one task
2. **Use composition** over configuration
3. **Extract reusable logic** into custom hooks
4. **Type everything** with TypeScript
5. **Follow naming conventions** (PascalCase for components)
6. **Add proper accessibility** (aria labels, keyboard nav)
