"use client";
import { useState, useEffect } from "react";
import { useAdminStore } from "@/store/useAdminStore";
import { getFeedback, getFeedbackStats } from "@/lib/api";
import { Star, Loader2, MessageSquare, TrendingUp } from "lucide-react";

export default function FeedbackList() {
  const { user, propertyId } = useAdminStore();
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);

  const pid =
    propertyId ||
    user?.propertyId ||
    process.env.NEXT_PUBLIC_DEFAULT_PROPERTY_ID;
  const isSuperAdmin = user?.role === "super_admin";

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const params = isSuperAdmin ? {} : { propertyId: pid };
        const [fbRes, statsRes] = await Promise.all([
          getFeedback(isSuperAdmin ? null : pid),
          getFeedbackStats(isSuperAdmin ? null : pid),
        ]);
        setFeedback(fbRes.data.data || []);
        setStats(statsRes.data.data);
      } catch (err) {
        console.error("Failed to fetch feedback:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [pid, isSuperAdmin]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  const getRatingColor = (rating) => {
    if (rating >= 4) return "text-green-500";
    if (rating >= 3) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-[#67757c]">
              <Star className="h-4 w-4" />
              <span className="text-sm">Avg Rating</span>
            </div>
            <p className="text-2xl font-bold text-[#455a64] mt-1">
              {stats.avgRating?.toFixed(1) || "0.0"}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-100">
            <div className="flex items-center gap-2 text-[#67757c]">
              <MessageSquare className="h-4 w-4" />
              <span className="text-sm">Total</span>
            </div>
            <p className="text-2xl font-bold text-[#455a64] mt-1">
              {stats.totalFeedback || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-100">
            <span className="text-sm text-[#67757c]">5 Star</span>
            <p className="text-xl font-bold text-green-500 mt-1">
              {stats.fiveStar || 0}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-100">
            <span className="text-sm text-[#67757c]">1 Star</span>
            <p className="text-xl font-bold text-red-500 mt-1">
              {stats.oneStar || 0}
            </p>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {stats && (
        <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-100">
          <h3 className="font-semibold text-[#455a64] mb-3">
            Rating Distribution
          </h3>
          {[5, 4, 3, 2, 1].map((star) => {
            const count =
              stats[
                `${star === 5 ? "five" : star === 4 ? "four" : star === 3 ? "three" : star === 2 ? "two" : "one"}Star`
              ] || 0;
            const percent =
              stats.totalFeedback > 0 ? (count / stats.totalFeedback) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 mb-2">
                <span className="text-sm text-[#455a64] w-8">{star} ★</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <span className="text-xs text-[#67757c] w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100">
          <h3 className="font-semibold text-[#455a64]">Recent Feedback</h3>
        </div>
        {feedback.length === 0 ? (
          <div className="p-8 text-center text-[#67757c]">No feedback yet</div>
        ) : (
          <div className="divide-y divide-slate-100">
            {feedback.map((fb) => (
              <div key={fb._id} className="p-4 hover:bg-slate-50">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-4 w-4 ${i < fb.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        />
                      ))}
                      <span
                        className={`text-sm font-medium ${getRatingColor(fb.rating)}`}
                      >
                        {fb.rating}/5
                      </span>
                    </div>
                    <span className="text-xs text-[#99abb4] ml-2 capitalize">
                      {fb.feedbackType}
                    </span>
                  </div>
                  <span className="text-xs text-[#99abb4]">
                    {new Date(fb.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {fb.comment && (
                  <p className="mt-2 text-sm text-[#455a64]">{fb.comment}</p>
                )}
                {fb.orderId && (
                  <p className="mt-1 text-xs text-[#99abb4]">
                    Order: #{fb.orderId._id?.slice(-6)} - Room{" "}
                    {fb.orderId.roomNumber}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
