"use client"
interface Props {
  categories: string[]
  active: string
  getCount: (category: string) => number
  onSelect: (category: string) => void
}

export default function CategoryPills({ categories, active, getCount, onSelect }: Props) {
  return (
    <div className="sticky top-16 z-10 bg-gray-50/80 backdrop-blur supports-[backdrop-filter]:bg-gray-50/60 border-b border-gray-100">
      <div className="py-3">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {categories.map(category => {
            const count = getCount(category)
            const isActive = category === active
            return (
              <button
                key={category}
                onClick={() => onSelect(category)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm border transition-all duration-200 ${isActive ? 'bg-orange-500 text-white border-orange-500 shadow-md' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
              >
                <span>{category}</span>
                <span className={`ml-2 inline-flex items-center justify-center rounded-full text-xs px-2 py-0.5 ${isActive ? 'bg-white/20' : 'bg-gray-100 text-gray-700'}`}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}


