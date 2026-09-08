import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseClasses =
      'relative inline-flex items-center justify-center font-bold tracking-tight select-none transition-all duration-200 outline-none rounded-2xl cursor-pointer disabled:cursor-not-allowed active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 dark:focus-visible:ring-brass-400 dark:focus-visible:ring-offset-stone-950';

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-stone-900 text-sand-50 hover:bg-stone-800 shadow-sm dark:bg-brass-500 dark:text-stone-950 dark:hover:bg-brass-400 disabled:bg-stone-300 dark:disabled:bg-stone-800 disabled:text-stone-500',
      secondary:
        'bg-sand-200/80 text-stone-900 hover:bg-sand-300/80 border border-sand-300/60 dark:bg-stone-800 dark:text-sand-100 dark:hover:bg-stone-700 dark:border-stone-700 disabled:opacity-50',
      outline:
        'bg-transparent border border-stone-300 text-stone-800 hover:bg-stone-100 hover:border-stone-400 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800/80 dark:hover:border-stone-600 disabled:opacity-40',
      ghost:
        'bg-transparent text-stone-600 hover:bg-stone-100/80 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800/60 dark:hover:text-stone-100 disabled:opacity-40',
      danger:
        'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/60 dark:hover:bg-rose-950/70 disabled:opacity-50',
    };

    const sizeClasses: Record<ButtonSize, string> = {
      sm: 'text-xs py-2 px-3.5 gap-1.5 min-h-[36px]',
      md: 'text-xs sm:text-sm py-2.5 sm:py-3 px-4 sm:px-5 gap-2 min-h-[44px]',
      lg: 'text-sm sm:text-base py-3.5 sm:py-4 px-6 sm:px-8 gap-2.5 min-h-[48px]',
      icon: 'p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      >
        {isLoading ? (
          <span className="inline-flex items-center gap-2">
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
            <span>{children}</span>
          </span>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            <span>{children}</span>
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
