import React from 'react';
import { Search } from 'lucide-react';

type InputTone = 'white' | 'surface';
type InputRadius = 'input' | 'pill';
type InputBorder = 'none' | 'muted' | 'strong';

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tone?: InputTone;
  radius?: InputRadius;
  border?: InputBorder;
}

const toneClasses: Record<InputTone, string> = {
  white: 'bg-white',
  surface: 'bg-q-surface',
};

const radiusClasses: Record<InputRadius, string> = {
  input: 'rounded-q-input',
  pill: 'rounded-q-pill',
};

const borderClasses: Record<InputBorder, string> = {
  none: 'border border-transparent',
  muted: 'border border-q-border',
  strong: 'border border-q-dark/30',
};

const inputBase =
  'w-full px-4 py-3 text-base font-medium text-q-dark placeholder:text-q-muted outline-none transition-all duration-150 focus:border-q-dark focus-visible:outline-none';

export function InputField({
  className = '',
  tone = 'surface',
  radius = 'input',
  border = 'none',
  ...props
}: InputFieldProps) {
  return (
    <input
      className={[inputBase, toneClasses[tone], radiusClasses[radius], borderClasses[border], className]
        .filter(Boolean)
        .join(' ')}
      {...props}
    />
  );
}

interface InputGrayProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function InputGray({ className = '', ...props }: InputGrayProps) {
  return <InputField tone="surface" border="none" className={className} {...props} />;
}

interface InputWhiteProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export function InputWhite({ className = '', ...props }: InputWhiteProps) {
  return <InputField tone="white" border="muted" className={className} {...props} />;
}

interface InputSearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  tone?: InputTone;
  radius?: InputRadius;
  border?: InputBorder;
}

export function InputSearch({
  className = '',
  tone = 'white',
  radius = 'pill',
  border = 'none',
  ...props
}: InputSearchProps) {
  return (
    <div className="relative flex-1 min-w-0">
      <Search
        size={18}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-q-muted pointer-events-none"
      />
      <input
        className={[
          'w-full pl-10 pr-4 py-3 text-base font-medium text-q-dark placeholder:text-q-muted outline-none transition-all duration-150 focus:border-q-dark focus-visible:outline-none',
          toneClasses[tone],
          radiusClasses[radius],
          borderClasses[border],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      />
    </div>
  );
}
