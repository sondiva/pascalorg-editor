'use client'

import { usePascalI18n } from '@pascal-app/core'
import React, { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children?: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

class ErrorBoundaryClass extends Component<
  Props & { title: string; retryLabel: string },
  State
> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-[#1b1c1f] p-4 text-white">
          <h2 className="mb-4 font-bold text-red-400 text-xl">{this.props.title}</h2>
          <pre className="max-w-full overflow-auto rounded bg-black/30 p-4 text-gray-300 text-sm">
            {this.state.error?.message}
          </pre>
          <button
            className="mt-4 rounded bg-blue-600 px-4 py-2 hover:bg-blue-700"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            {this.props.retryLabel}
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// A class is required to catch render errors, so the hook lives in this thin
// wrapper and the copy travels in as props.
export function ErrorBoundary(props: Props) {
  const i18n = usePascalI18n()
  return (
    <ErrorBoundaryClass
      {...props}
      title={i18n._({ id: 'editor.primitives.errorBoundary.somethingWentWrong', message: 'Something went wrong' })}
      retryLabel={i18n._({ id: 'editor.primitives.errorBoundary.tryAgain', message: 'Try again' })}
    />
  )
}
