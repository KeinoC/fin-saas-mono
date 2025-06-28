'use client';

import * as React from "react"
import { Transition } from '@headlessui/react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const addToast = React.useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: Toast = { ...toast, id }
    
    setToasts((prev) => [...prev, newToast])

    // Auto remove after duration
    const duration = toast.duration || 5000
    setTimeout(() => {
      removeToast(id)
    }, duration)
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = React.useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [show, setShow] = React.useState(true)

  const handleRemove = () => {
    setShow(false)
    setTimeout(() => onRemove(toast.id), 300)
  }

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'error':
        return <XCircle className="h-5 w-5 text-destructive" />
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'info':
        return <Info className="h-5 w-5 text-primary" />
    }
  }

  const getBackgroundColor = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/30'
      case 'error':
        return 'bg-destructive/10 border-destructive/20'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800/30'
      case 'info':
        return 'bg-primary/10 border-primary/20'
    }
  }

  return (
    <Transition
      show={show}
      enter="transition-all duration-300 ease-out"
      enterFrom="transform translate-x-full opacity-0"
      enterTo="transform translate-x-0 opacity-100"
      leave="transition-all duration-300 ease-in"
      leaveFrom="transform translate-x-0 opacity-100"
      leaveTo="transform translate-x-full opacity-0"
    >
      <div className={`max-w-sm w-full bg-card shadow-lg rounded-sm border ${getBackgroundColor()} p-4`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{toast.title}</p>
            {toast.description && (
              <p className="mt-1 text-sm text-muted-foreground">{toast.description}</p>
            )}
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              className="bg-transparent rounded-sm inline-flex text-muted-foreground hover:text-foreground focus:outline-none"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </Transition>
  )
} 