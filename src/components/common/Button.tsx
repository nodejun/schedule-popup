/**
 * 공통 버튼 컴포넌트
 *
 * variant로 스타일을 구분하고, size로 크기를 조절한다.
 * 모든 네이티브 button 속성을 그대로 전달할 수 있다.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant
  readonly size?: ButtonSize
  readonly children: ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 hover:scale-[1.02]',
  secondary:
    'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600 hover:scale-[1.02]',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 dark:text-neutral-400 dark:hover:bg-neutral-800',
  danger:
    'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 hover:scale-[1.02]',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-2 py-1 text-xs rounded-lg',
  md: 'px-3 py-1.5 text-sm rounded-xl',
  lg: 'px-4 py-2 text-base rounded-full',
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...rest
}: ButtonProps): ReactNode => {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-all duration-200 cursor-pointer'
  const disabledStyles = disabled
    ? 'opacity-50 cursor-not-allowed pointer-events-none'
    : ''

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyles} ${className}`}
      disabled={disabled}
      {...rest}
    >
      {children}
    </button>
  )
}
