'use client'
import React, { useState, ChangeEvent, KeyboardEvent } from 'react';
import { Search, MapPin } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface HeroSectionProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  onSearch,
  placeholder = "Enter your food...",
  className = ""
}) => {
  const [location, setLocation] = useState<string>('');
  const router = useRouter();

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setLocation(e.target.value);
  };

  const handleButtonClick = (): void => {
    if (location.trim()) {
      if (onSearch) {
        onSearch(location);
      } else {
        // Navigate to search page
        router.push(`/search?q=${encodeURIComponent(location)}`);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleButtonClick();
    }
  };

  return (
    <div className={`relative bg-gradient-to-r from-yellow-400 to-yellow-500 min-h-[400px] overflow-hidden ${className}`}>
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full opacity-30"></div>
        <div className="absolute bottom-20 right-20 w-16 h-16 bg-yellow-300 rounded-full opacity-20"></div>
        <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-white rounded-full opacity-10"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[400px]">
          {/* Left Content */}
          <div className="text-left py-12 lg:py-0">
            <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight">
              Are you starving?
            </h1>
            <p className="text-lg lg:text-xl text-white mb-8 opacity-90">
              Within a few clicks, find meals that are accessible near you
            </p>
            
            {/* Search Form */}
            <div className="bg-white rounded-lg shadow-lg p-2 flex items-center max-w-md">
              <div className="flex items-center flex-1 px-4">
                <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder={placeholder}
                  value={location}
                  onChange={handleInputChange}
                  className="flex-1 outline-none text-gray-700 placeholder-gray-400"
                  aria-label="Search for food"
                  onKeyDown={handleKeyDown}
                />
              </div>
              <button 
                type="button"
                onClick={handleButtonClick}
                className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md font-medium transition-colors duration-200 flex items-center gap-2"
                aria-label="Find food"
              >
                <Search className="w-4 h-4" />
                Find Food
              </button>
            </div>
          </div>
          
          {/* Right Content - Food Image */}
          <div className="hidden lg:flex relative justify-center lg:justify-end">
            <Image
              src="/images/hero-image.png"
              alt="Delicious food"
              width={600}
              height={600}
              priority
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;