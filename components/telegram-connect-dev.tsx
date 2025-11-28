'use client'

import { useState } from 'react'
import { Send, Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface TelegramConnectDevProps {
  onAuth: (data: { chatId: string; firstName: string; username?: string; photoUrl?: string }) => void
  onError?: (error: string) => void
  isConnected?: boolean
  connectedUser?: {
    firstName?: string
    username?: string
    photoUrl?: string
  }
  onDisconnect?: () => void
  className?: string
}

export function TelegramConnectDev({
  onAuth,
  onError,
  isConnected = false,
  connectedUser,
  onDisconnect,
  className = '',
}: TelegramConnectDevProps) {
  const [chatId, setChatId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleConnect = async () => {
    if (!chatId.trim()) {
      onError?.('Please enter a Chat ID')
      return
    }

    setIsLoading(true)
    try {
      // Simulate API call for dev mode
      await new Promise(resolve => setTimeout(resolve, 500))
      
      onAuth({
        chatId: chatId.trim(),
        firstName: 'Dev User',
        username: 'devuser',
      })
    } catch (err) {
      onError?.('Failed to connect')
    } finally {
      setIsLoading(false)
    }
  }

  if (isConnected && connectedUser) {
    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
          <div className="w-12 h-12 rounded-full bg-blue-200 flex items-center justify-center">
            <Send className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-900">{connectedUser.firstName}</p>
              <Check className="w-4 h-4 text-green-600" />
            </div>
            {connectedUser.username && (
              <p className="text-sm text-slate-600">@{connectedUser.username}</p>
            )}
            <p className="text-xs text-green-600 font-medium mt-0.5">
              Telegram Connected (Dev Mode)
            </p>
          </div>
          {onDisconnect && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onDisconnect}
              className="text-slate-500 hover:text-red-600 hover:bg-red-50"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <p className="text-xs text-amber-800 font-medium mb-2">
          🔧 Development Mode
        </p>
        <p className="text-xs text-amber-700 mb-3">
          Get your Chat ID from <span className="font-mono bg-amber-100 px-1 rounded">@userinfobot</span> on Telegram
        </p>
        <div className="flex gap-2">
          <Input
            value={chatId}
            onChange={(e) => setChatId(e.target.value)}
            placeholder="Enter your Telegram Chat ID"
            className="flex-1 bg-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleConnect()
              }
            }}
          />
          <Button
            type="button"
            onClick={handleConnect}
            disabled={isLoading || !chatId.trim()}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Connect
              </>
            )}
          </Button>
        </div>
      </div>
      <p className="text-xs text-slate-500 text-center">
        For production, configure your domain with BotFather to use the Telegram Login Widget
      </p>
    </div>
  )
}
