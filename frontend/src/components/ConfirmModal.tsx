import { useState, createContext, useContext, useCallback } from 'react'
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import Button from './Button'

type ConfirmType = 'danger' | 'warning' | 'info' | 'success'

interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: ConfirmType
}

interface ConfirmContextType {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmProvider')
  }
  return context.confirm
}

interface ConfirmState extends ConfirmOptions {
  isOpen: boolean
  resolve: ((value: boolean) => void) | null
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '확인',
    cancelText: '취소',
    type: 'warning',
    resolve: null,
  })

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText || '확인',
        cancelText: options.cancelText || '취소',
        type: options.type || 'warning',
        resolve,
      })
    })
  }, [])

  const handleConfirm = () => {
    state.resolve?.(true)
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }))
  }

  const handleCancel = () => {
    state.resolve?.(false)
    setState((prev) => ({ ...prev, isOpen: false, resolve: null }))
  }

  const getIcon = () => {
    switch (state.type) {
      case 'danger':
        return <XCircle className="w-12 h-12 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-12 h-12 text-orange-500" />
      case 'success':
        return <CheckCircle className="w-12 h-12 text-green-500" />
      case 'info':
      default:
        return <Info className="w-12 h-12 text-blue-500" />
    }
  }

  const getConfirmButtonStyle = () => {
    switch (state.type) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 text-white'
      case 'warning':
        return 'bg-orange-500 hover:bg-orange-600 text-white'
      case 'success':
        return 'bg-green-500 hover:bg-green-600 text-white'
      case 'info':
      default:
        return 'bg-primary-500 hover:bg-primary-600 text-white'
    }
  }

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {state.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleCancel}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                {getIcon()}
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {state.title}
              </h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {state.message}
              </p>
            </div>

            <div className="flex border-t border-gray-100">
              <button
                onClick={handleCancel}
                className="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                {state.cancelText}
              </button>
              <div className="w-px bg-gray-100" />
              <button
                onClick={handleConfirm}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${getConfirmButtonStyle()}`}
              >
                {state.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}
