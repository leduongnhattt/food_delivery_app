"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/contexts/toast-context";
import { apiClient } from "@/services/api";
import { 
  Star,
  MessageSquare,
  ThumbsUp,
  Search,
  RefreshCw
} from "lucide-react";

interface Review {
  id: string;
  customerName: string;
  rating: number;
  comment: string;
  createdAt: string;
  helpful: number;
}

export default function EnterpriseReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const { showToast } = useToast();

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/enterprise/reviews") as any;
      if (response.success === false) {
        throw new Error(response.error || "Failed to fetch reviews");
      }
      setReviews(response.reviews || []);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      showToast("Failed to load reviews", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = ratingFilter === "all" || review.rating.toString() === ratingFilter;
    return matchesSearch && matchesRating;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Customer Reviews
              </h1>
              <p className="text-gray-600 mt-1">See what your customers are saying about your restaurant</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={fetchReviews}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Filters and Search */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search reviews..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            {/* Rating Filter */}
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            {/* Results Count */}
            <div className="flex items-center justify-center">
              <span className="text-sm text-gray-600">
                {filteredReviews.length} of {reviews.length} reviews
              </span>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-white/20 shadow-lg">
          {filteredReviews.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredReviews.map((review) => (
                <div key={review.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {review.customerName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{review.customerName}</h3>
                          <div className="flex items-center space-x-1">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-500 ml-2">{review.rating}/5</span>
                          </div>
                        </div>
                      </div>
                      
                      {review.comment && (
                        <p className="text-gray-700 mb-3">{review.comment}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatDate(review.createdAt)}</span>
                        <div className="flex items-center space-x-2">
                          <button className="flex items-center space-x-1 hover:text-green-600 transition-colors">
                            <ThumbsUp className="h-4 w-4" />
                            <span>{review.helpful}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews found</h3>
              <p className="text-gray-500">
                {searchTerm || ratingFilter !== "all" 
                  ? "Try adjusting your search or filter criteria"
                  : "Reviews will appear here once customers start rating your restaurant"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
