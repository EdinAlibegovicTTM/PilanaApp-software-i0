"use client"

import { useState, useEffect, useRef } from "react"
import { Search, RefreshCw, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"

// Cache for storing lookup data
const lookupCache = new Map<
  string,
  {
    data: any[]
    timestamp: number
    columns: string[]
  }
>()

// Cache expiration time (30 minutes)
const CACHE_EXPIRATION = 30 * 60 * 1000

interface ProductLookupProps {
  sheetUrl: string
  codeColumn: string
  nameColumn: string
  additionalColumns: string[]
  value?: { code: string; name: string; [key: string]: any }
  onChange: (value: { code: string; name: string; [key: string]: any }) => void
  disabled?: boolean
  placeholder?: string
  required?: boolean
}

export function ProductLookup({
  sheetUrl,
  codeColumn,
  nameColumn,
  additionalColumns = [],
  value = { code: "", name: "", additionalData: {} },
  onChange,
  disabled = false,
  placeholder = "Search by code or name...",
  required = false,
}: ProductLookupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [lookupData, setLookupData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Function to fetch data from Google Sheets
  const fetchLookupData = async (forceRefresh = false) => {
    // In a real implementation, we would use the Google Sheets API
    // For this demo, we'll simulate the API call and data structure

    const cacheKey = sheetUrl
    const now = Date.now()

    // Check if we have cached data and it's not expired
    if (!forceRefresh && lookupCache.has(cacheKey)) {
      const cachedData = lookupCache.get(cacheKey)!
      if (now - cachedData.timestamp < CACHE_EXPIRATION) {
        setLookupData(cachedData.data)
        return
      }
    }

    try {
      setIsLoading(true)
      setError(null)

      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // In a real implementation, we would fetch data from Google Sheets
      // For demo purposes, we'll generate mock data
      const mockData = Array.from({ length: 100 }, (_, i) => {
        const id = i + 1
        return {
          [codeColumn]: `P${id.toString().padStart(4, "0")}`,
          [nameColumn]: `Product ${id}`,
          price: Math.round(Math.random() * 1000) / 10,
          stock: Math.floor(Math.random() * 100),
          category: ["Electronics", "Office", "Kitchen", "Tools"][Math.floor(Math.random() * 4)],
        }
      })

      // Store in cache
      lookupCache.set(cacheKey, {
        data: mockData,
        timestamp: now,
        columns: [codeColumn, nameColumn, ...additionalColumns],
      })

      setLookupData(mockData)
    } catch (err) {
      console.error("Error fetching lookup data:", err)
      setError("Failed to load product data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Filter data based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredData(lookupData.slice(0, 100)) // Limit to first 100 items when no search
      return
    }

    const lowerSearchTerm = searchTerm.toLowerCase()
    const filtered = lookupData.filter(
      (item) =>
        item[codeColumn].toLowerCase().includes(lowerSearchTerm) ||
        item[nameColumn].toLowerCase().includes(lowerSearchTerm),
    )

    setFilteredData(filtered.slice(0, 100)) // Limit to first 100 matches
  }, [searchTerm, lookupData, codeColumn, nameColumn])

  // Load data when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchLookupData()
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }, [isOpen])

  // Handle selection
  const handleSelect = (item: any) => {
    const additionalData: Record<string, any> = {}
    additionalColumns.forEach((col) => {
      if (item[col] !== undefined) {
        additionalData[col] = item[col]
      }
    })

    onChange({
      code: item[codeColumn],
      name: item[nameColumn],
      additionalData,
    })

    setIsOpen(false)
  }

  // Handle direct code input
  const handleCodeInput = (code: string) => {
    setSearchTerm(code)

    // Find matching item
    const matchingItem = lookupData.find((item) => item[codeColumn].toLowerCase() === code.toLowerCase())

    if (matchingItem) {
      handleSelect(matchingItem)
    } else {
      onChange({ code, name: "", additionalData: {} })
    }
  }

  // Handle direct name input
  const handleNameInput = (name: string) => {
    setSearchTerm(name)

    // Find matching item
    const matchingItem = lookupData.find((item) => item[nameColumn].toLowerCase() === name.toLowerCase())

    if (matchingItem) {
      handleSelect(matchingItem)
    } else {
      onChange({ code: "", name, additionalData: {} })
    }
  }

  // Display value in input
  const displayValue = value.code ? `${value.code} - ${value.name}` : ""

  return (
    <div className="relative">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="flex">
            <Input
              ref={inputRef}
              value={displayValue}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClick={() => setIsOpen(true)}
              placeholder={placeholder}
              disabled={disabled}
              required={required}
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              type="button"
              className="absolute right-0 top-0 h-full"
              onClick={() => setIsOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="flex items-center p-2 border-b">
            <Search className="h-4 w-4 mr-2 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <Button variant="ghost" size="icon" onClick={() => fetchLookupData(true)} disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            </Button>
          </div>

          {error ? (
            <div className="p-4 text-center text-red-500 text-sm">{error}</div>
          ) : (
            <ScrollArea className="h-[300px]">
              {filteredData.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  {isLoading ? "Loading products..." : "No products found"}
                </div>
              ) : (
                <div className="py-2">
                  {filteredData.map((item, index) => (
                    <div
                      key={index}
                      className="flex flex-col px-4 py-2 cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSelect(item)}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{item[codeColumn]}</span>
                        <Badge variant="outline" className="text-xs">
                          {item.category}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">{item[nameColumn]}</div>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Price: ${item.price}</span>
                        <span>Stock: {item.stock}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          )}

          <div className="p-2 border-t text-xs text-gray-500">
            {lookupData.length > 0 ? (
              <div className="flex justify-between">
                <span>Total: {lookupData.length} products</span>
                <span>Showing: {filteredData.length}</span>
              </div>
            ) : isLoading ? (
              <div className="text-center">Loading product database...</div>
            ) : (
              <div className="text-center">Click refresh to load products</div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Hidden inputs for form submission */}
      {value.code && <input type="hidden" name="product_code" value={value.code} />}
      {value.name && <input type="hidden" name="product_name" value={value.name} />}
      {Object.entries(value.additionalData || {}).map(([key, val]) => (
        <input key={key} type="hidden" name={`product_${key}`} value={val as string} />
      ))}
    </div>
  )
}
