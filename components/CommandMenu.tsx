
import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Search, Send, BarChart2, Globe, Video, BookOpen, GraduationCap, LayoutDashboard, Library } from "lucide-react"

// --- Hook Definition ---
function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

// --- Interfaces & Data ---
export interface Action {
  id: string
  label: string
  icon: React.ReactNode
  description?: string
  short?: string
  end?: string
  value: string // The tab ID to navigate to
}

interface SearchResult {
  actions: Action[]
}

const allActions: Action[] = [
  {
    id: "1",
    label: "Ask AI Tutor",
    icon: <GraduationCap className="h-4 w-4 text-indigo-500" />,
    description: "Socratic Chat",
    short: "Chat",
    end: "AI",
    value: "chat"
  },
  {
    id: "2",
    label: "Start Live Class",
    icon: <Video className="h-4 w-4 text-green-500" />,
    description: "Real-time Voice/Video",
    short: "Live",
    end: "Meet",
    value: "live"
  },
  {
    id: "3",
    label: "Find Resources",
    icon: <Library className="h-4 w-4 text-orange-500" />,
    description: "PDFs & Notes",
    short: "Search",
    end: "Web",
    value: "resources"
  },
  {
    id: "4",
    label: "Check Progress",
    icon: <LayoutDashboard className="h-4 w-4 text-blue-500" />,
    description: "Analytics & Maps",
    short: "Stats",
    end: "View",
    value: "progress"
  },
  {
    id: "5",
    label: "Take Assessment",
    icon: <BookOpen className="h-4 w-4 text-purple-500" />,
    description: "Adaptive Quiz",
    short: "Test",
    end: "Quiz",
    value: "quiz"
  },
]

interface CommandMenuProps {
  onNavigate: (tab: string) => void;
}

// --- Main Component ---
export function CommandMenu({ onNavigate }: CommandMenuProps) {
  const [query, setQuery] = useState("")
  const [result, setResult] = useState<SearchResult | null>(null)
  const [isFocused, setIsFocused] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const debouncedQuery = useDebounce(query, 200)

  useEffect(() => {
    if (!isFocused) {
      setResult(null)
      return
    }

    if (!debouncedQuery) {
      setResult({ actions: allActions })
      return
    }

    const normalizedQuery = debouncedQuery.toLowerCase().trim()
    const filteredActions = allActions.filter((action) => {
      const searchableText = action.label.toLowerCase() + action.description?.toLowerCase()
      return searchableText.includes(normalizedQuery)
    })

    setResult({ actions: filteredActions })
  }, [debouncedQuery, isFocused])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    setIsTyping(true)
  }

  const handleSelect = (action: Action) => {
    onNavigate(action.value);
    setQuery("");
    setIsFocused(false);
  }

  const container = {
    hidden: { opacity: 0, height: 0 },
    show: {
      opacity: 1,
      height: "auto",
      transition: {
        height: {
          duration: 0.4,
        },
        staggerChildren: 0.1,
      },
    },
    exit: {
      opacity: 0,
      height: 0,
      transition: {
        height: {
          duration: 0.3,
        },
        opacity: {
          duration: 0.2,
        },
      },
    },
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3,
      },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: {
        duration: 0.2,
      },
    },
  }

  return (
    <div className="w-full max-w-xl">
      <div className="relative flex flex-col justify-start items-center">
        <div className="w-full relative z-20">
          <div className="relative">
            <input
              type="text"
              placeholder="Where would you like to go?"
              value={query}
              onChange={handleInputChange}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setTimeout(() => setIsFocused(false), 200)}
              className="w-full h-12 pl-12 pr-4 text-sm rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white"
            />
            
            <div className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4">
              <AnimatePresence mode="popLayout">
                {query.length > 0 ? (
                  <motion.div
                    key="send"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Send className="w-4 h-4 text-indigo-500" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="search"
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Search className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div className="w-full absolute top-14 left-0 right-0 z-50">
          <AnimatePresence>
            {isFocused && result && (
              <motion.div
                className="w-full border border-gray-100 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden bg-white/95 dark:bg-gray-800/95 backdrop-blur-md"
                variants={container}
                initial="hidden"
                animate="show"
                exit="exit"
              >
                <motion.ul>
                  {result.actions.map((action) => (
                    <motion.li
                      key={action.id}
                      className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                      variants={item}
                      layout
                      onMouseDown={() => handleSelect(action)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">{action.icon}</span>
                        <div>
                          <span className="text-sm font-semibold text-gray-900 dark:text-white block">{action.label}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{action.description}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{action.end}</span>
                      </div>
                    </motion.li>
                  ))}
                </motion.ul>
                <div className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                  <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold">
                    <span>Quick Navigation</span>
                    <span>H²-ALA</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
