"use client"

import * as React from "react"

export interface Toast {
  id: string
  title?: string
  description?: string
  action?: React.ReactNode
  variant?: "default" | "destructive"
}

interface ToastState {
  toasts: Toast[]
}

interface ToastAction {
  type: "ADD_TOAST" | "REMOVE_TOAST"
  payload: any
}

const toastReducer = (state: ToastState, action: ToastAction): ToastState => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: [...state.toasts, action.payload],
      }
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((toast) => toast.id !== action.payload),
      }
    default:
      return state
  }
}

const listeners: Array<(state: ToastState) => void> = []

let memoryState: ToastState = { toasts: [] }

function dispatch(action: ToastAction) {
  memoryState = toastReducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

function toast({
  title,
  description,
  action,
  variant = "default",
  ...props
}: Omit<Toast, "id">) {
  const id = Math.random().toString(36).substr(2, 9)

  const newToast: Toast = {
    id,
    title,
    description,
    action,
    variant,
    ...props,
  }

  dispatch({ type: "ADD_TOAST", payload: newToast })

  // Auto-dismiss after 5 seconds
  setTimeout(() => {
    dispatch({ type: "REMOVE_TOAST", payload: id })
  }, 5000)

  return {
    id,
    dismiss: () => dispatch({ type: "REMOVE_TOAST", payload: id }),
  }
}

function useToast() {
  const [state, setState] = React.useState<ToastState>(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId: string) => dispatch({ type: "REMOVE_TOAST", payload: toastId }),
  }
}

export { useToast, toast }
