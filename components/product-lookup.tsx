"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"

export function ProductLookup({
  sheetUrl,
  codeColumn,
  nameColumn,
  additionalColumns = [],
  value,
  onChange,
  disabled,
  placeholder,
  required,
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // When value changes externally, update the selected product
  useEffect(() => {
    if (value && typeof value === "object") {
      setSelectedProduct(value)
    } else if (!value) {
      setSelectedProduct(null)
    }
  }, [value])

  const handleSearch = () => {
    if (!searchTerm.trim()) return

    setIsSearching(true)

    // Mock search results
    setTimeout(() => {
      const mockResults = [
        { code: "P001", name: "Product 1", price: "10.99", stock: "100" },
        { code: "P002", name: "Product 2", price: "20.99", stock: "50" },
        { code: "P003", name: "Product 3", price: "15.99", stock: "75" },
      ].filter(
        (p) =>
          p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.name.toLowerCase().includes(searchTerm.toLowerCase()),
      )

      setResults(mockResults)
      setIsSearching(false)
    }, 500)
  }

  const handleSelectProduct = (product) => {
    setSelectedProduct(product)
    onChange(product)
    setResults([])
    setSearchTerm("")
  }

  const handleClearSelection = () => {
    setSelectedProduct(null)
    onChange(null)
  }

  return (
    <div>
      {selectedProduct ? (
        <div className="flex items-center justify-between p-2 border rounded">
          <div>
            <div className="font-medium">{selectedProduct[nameColumn] || selectedProduct.name}</div>
            <div className="text-sm text-gray-600">{selectedProduct[codeColumn] || selectedProduct.code}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClearSelection} disabled={disabled}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div>
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={placeholder || "Search products..."}
                disabled={disabled}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    handleSearch()
                  }
                }}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={disabled || !searchTerm.trim()}>
              Search
            </Button>
          </div>

          {isSearching && <div className="mt-2 text-sm text-gray-600">Searching...</div>}

          {results.length > 0 && (
            <div className="mt-2 border rounded max-h-60 overflow-y-auto">
              {results.map((product, index) => (
                <div
                  key={index}
                  className="p-2 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
                  onClick={() => handleSelectProduct(product)}
                >
                  <div className="font-medium">{product[nameColumn] || product.name}</div>
                  <div className="text-sm text-gray-600">{product[codeColumn] || product.code}</div>
                </div>
              ))}
            </div>
          )}

          {results.length === 0 && searchTerm && !isSearching && (
            <div className="mt-2 text-sm text-gray-600">No products found</div>
          )}
        </div>
      )}
    </div>
  )
}
