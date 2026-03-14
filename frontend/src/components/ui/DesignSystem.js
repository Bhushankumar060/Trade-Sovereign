import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export function Button({
  className,
  variant = 'primary',
  size = 'default',
  isLoading,
  children,
  disabled,
  ...props
}) {
  const variants = {
    primary: 'bg-gradient-to-r from-cyan-400 to-blue-500 text-black shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:-translate-y-0.5 border border-cyan-400/50',
    secondary: 'bg-secondary text-white hover:bg-secondary/80 border border-white/5',
    glass: 'bg-white/5 backdrop-blur-md text-white border border-white/10 hover:bg-white/10 hover:border-white/20',
    ghost: 'bg-transparent text-gray-400 hover:text-white hover:bg-white/5',
    destructive: 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 hover:border-red-500/30'
  };

  const sizes = {
    default: 'h-11 px-5 py-2',
    sm: 'h-9 px-3 text-sm',
    lg: 'h-14 px-8 text-lg',
    icon: 'h-11 w-11 flex items-center justify-center p-0'
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  );
}

export function Card({ className, children, hover3d = false, ...props }) {
  return (
    <div
      className={cn(
        'glass-card rounded-2xl p-6',
        hover3d && 'card-3d hover:shadow-[0_20px_40px_rgba(0,240,255,0.1)]',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        'flex h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2 text-sm text-white shadow-inner transition-colors placeholder:text-gray-500 focus-visible:outline-none focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export function Label({ className, ...props }) {
  return (
    <label
      className={cn(
        'text-sm font-medium leading-none text-gray-400 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 block',
        className
      )}
      {...props}
    />
  );
}

export function Badge({ className, variant = 'default', children }) {
  const variants = {
    default: 'bg-cyan-400/10 text-cyan-400 border border-cyan-400/20',
    outline: 'bg-transparent text-gray-400 border border-white/10',
    success: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    destructive: 'bg-red-500/10 text-red-400 border border-red-500/20'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

export function Skeleton({ className, ...props }) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-white/5', className)} {...props} />
  );
}

export function Spinner({ className, size = 'default' }) {
  const sizes = {
    sm: 'w-4 h-4',
    default: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <Loader2 className={cn('animate-spin text-cyan-400', sizes[size], className)} />
  );
}
