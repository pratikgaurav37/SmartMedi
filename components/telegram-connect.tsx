'use client'

import { useEffect, useRef, useState } from 'react'
import { Send, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { loadTelegramWidget, TelegramAuthData } from '@/lib/telegram-auth'

interface TelegramConnectProps {
  onAuth: (data: { chatId: string; firstName: string; username?: string; photoUrl?: string }) => void
  onError?: (error: string) => void
  botUsername: string
  isConnected?: boolean
  connectedUser?: {
    firstName?: string
    username?: string
    photoUrl?: string
  }
  onDisconnect?: () => void
  className?: string
}

export function TelegramConnect({
  onAuth,
  onError,
  botUsername,
  isConnected = false,
  connectedUser,
  onDisconnect,
  className = '',
}: TelegramConnectProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isConnected || !containerRef.current) return

    // Define the callback function globally
    ;(window as any).onTelegramAuth = async (user: TelegramAuthData) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/telegram/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user),
        })

        const data = await response.json()

        if (response.ok && data.success) {
          onAuth({
            chatId: data.chatId,
            firstName: data.user.firstName,
            username: data.user.username,
            photoUrl: data.user.photoUrl,
          })
        } else {
          const errorMsg = data.error || 'Failed to connect Telegram'
          setError(errorMsg)
          onError?.(errorMsg)
        }
      } catch (err) {
        const errorMsg = 'Failed to connect to server'
        setError(errorMsg)
        onError?.(errorMsg)
      } finally {
        setIsLoading(false)
      }
    }

    // Load and render the widget
    loadTelegramWidget()
      .then(() => {
        if (!containerRef.current) return

        // Create the widget
        const script = document.createElement('script')
        script.src = 'https://telegram.org/js/telegram-widget.js?22'
        script.setAttribute('data-telegram-login', botUsername)
        script.setAttribute('data-size', 'large')
        script.setAttribute('data-onauth', 'onTelegramAuth(user)')
        script.setAttribute('data-request-access', 'write')
        script.async = true

        containerRef.current.appendChild(script)
      })
      .catch((err) => {
        const errorMsg = 'Failed to load Telegram widget'
        setError(errorMsg)
        onError?.(errorMsg)
      })

    return () => {
      // Cleanup
      delete (window as any).onTelegramAuth
    }
  }, [botUsername, isConnected, onAuth, onError])

  const handleDisconnect = async () => {
    if (!onDisconnect) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/telegram/connect', {
        method: 'DELETE',
      })

      if (response.ok) {
        onDisconnect()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to disconnect')
      }
    } catch (err) {
      setError('Failed to disconnect')
    } finally {
      setIsLoading(false)
    }
  }

  if (isConnected && connectedUser) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
          {connectedUser.photoUrl ? (
            <img
              src={connectedUser.photoUrl}
              alt={connectedUser.firstName}
              className="w-12 h-12 rounded-full border-2 border-blue-300"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
              <Send className="w-6 h-6 text-blue-600" />
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900">{connectedUser.firstName}</p>
              <Check className="w-4 h-4 text-green-600" />
            </div>
            {connectedUser.username && (
              <p className="text-sm text-slate-600">@{connectedUser.username}</p>
            )}
            <p className="text-xs text-green-600 font-medium mt-0.5">
              Telegram Connected
            </p>
          </div>
          {onDisconnect && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleDisconnect}
              disabled={isLoading}
              className="text-slate-500 hover:text-red-600 hover:bg-red-50"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <X className="w-4 h-4" />
              )}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}
        
        <div
          ref={containerRef}
          className="flex items-center justify-center min-h-[46px] p-2 bg-white border border-slate-200 rounded-lg hover:border-blue-300 transition-colors"
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <X className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <p className="text-xs text-slate-500 text-center">
        Click the button above to connect your Telegram account and receive medication reminders
      </p>
    </div>
  )
}
