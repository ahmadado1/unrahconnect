import React, { createContext, useCallback, useContext, useMemo, useState } from "react"

const NAVY = "#1E3A5F"

export const DEFAULT_WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant",
  content:
    "Assalamu Alaikum! I'm your UmrahConnect AI guide. Ask me about Umrah, Hajj, prayer, navigating the Haram, or anything in the app.",
  links: [],
}

const AIGuideContext = createContext(null)

export function AIGuideProvider({ children }) {
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MESSAGE])
  const [loading, setLoading] = useState(false)

  const clearChat = useCallback(() => {
    setMessages([{ ...DEFAULT_WELCOME_MESSAGE, id: `welcome-${Date.now()}` }])
    setLoading(false)
  }, [])

  const value = useMemo(
    () => ({
      messages,
      setMessages,
      loading,
      setLoading,
      clearChat,
    }),
    [messages, loading, clearChat]
  )

  return <AIGuideContext.Provider value={value}>{children}</AIGuideContext.Provider>
}

export function useAIGuide() {
  const ctx = useContext(AIGuideContext)
  if (!ctx) {
    throw new Error("useAIGuide must be used within AIGuideProvider")
  }
  return ctx
}

export { NAVY }
