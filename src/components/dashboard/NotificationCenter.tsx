'use client'

import { useState, useEffect } from 'react'
import { Bell, Check, AlertTriangle, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  timestamp: string
  read: boolean
}

// Global notification store
let notificationListeners: Array<(n: Notification) => void> = []

export function pushNotification(n: Omit<Notification, 'id' | 'timestamp' | 'read'>) {
  const notification: Notification = {
    ...n,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date().toISOString(),
    read: false,
  }
  notificationListeners.forEach(l => l(notification))

  // Also show browser notification if permitted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    new window.Notification(notification.title, { body: notification.message })
  }
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const listener = (n: Notification) => {
      setNotifications(prev => [n, ...prev].slice(0, 50))
    }
    notificationListeners.push(listener)
    return () => {
      notificationListeners = notificationListeners.filter(l => l !== listener)
    }
  }, [])

  // Request browser notification permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  const clearAll = () => {
    setNotifications([])
  }

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const iconMap = {
    success: <Check className="w-4 h-4 text-emerald-500" />,
    error: <AlertTriangle className="w-4 h-4 text-destructive" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500" />,
    info: <Info className="w-4 h-4 text-blue-500" />,
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[8px] flex items-center justify-center bg-emerald-500">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between p-3 border-b">
          <span className="text-sm font-semibold">Notifications</span>
          <div className="flex gap-1">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={markAllRead}>Mark all read</Button>
            )}
            {notifications.length > 0 && (
              <Button variant="ghost" size="sm" className="h-6 text-[10px]" onClick={clearAll}>Clear all</Button>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-[300px]">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-xs text-muted-foreground">No notifications</div>
          ) : (
            <div className="divide-y">
              {notifications.map(n => (
                <div key={n.id} className={`p-3 flex gap-2 text-xs ${!n.read ? 'bg-accent/30' : ''}`}>
                  <div className="shrink-0 mt-0.5">{iconMap[n.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{n.title}</div>
                    <div className="text-muted-foreground mt-0.5 line-clamp-2">{n.message}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {new Date(n.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <button onClick={() => dismissNotification(n.id)} className="p-0.5 text-muted-foreground hover:text-foreground">
                      <X className="w-3 h-3" />
                    </button>
                    {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
