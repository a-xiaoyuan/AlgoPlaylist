import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary'

export function buttonClass(variant: Variant = 'secondary') {
  const classes = {
    primary: 'button button-primary',
    secondary: 'button button-secondary',
  }
  return classes[variant]
}

export function Button({ variant = 'secondary', className = '', ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={`${buttonClass(variant)} ${className}`} {...props} />
}
