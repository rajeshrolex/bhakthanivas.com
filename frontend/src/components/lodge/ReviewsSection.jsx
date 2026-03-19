import React, { useEffect, useMemo, useState } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import { reviewAPI } from '../../services/api';

const ReviewsSection = ({ slug }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        rating: 5,
        comment: ''
    });

    useEffect(() => {
        const fetchReviews = async () => {
            try {
                setLoading(true);
                const data = await reviewAPI.getForLodge(slug);
                setReviews(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error('Error fetching reviews:', error);
            } finally {
                setLoading(false);
            }
        };

        if (slug) {
            fetchReviews();
        }
    }, [slug]);

    const overall = useMemo(() => {
        if (!reviews.length) {
            return { rating: 0, count: 0 };
        }
        const total = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
        const rating = total / reviews.length;
        return { rating: Number(rating.toFixed(1)), count: reviews.length };
    }, [reviews]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'rating' ? Number(value) : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.comment.trim() || !formData.rating) {
            return;
        }

        try {
            setSubmitting(true);
            const created = await reviewAPI.create(slug, formData);
            setReviews(prev => [created, ...prev]);
            setFormData({
                name: '',
                rating: 5,
                comment: ''
            });
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl p-6 shadow-soft mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                Guest Reviews
                <span className="text-sm font-normal text-gray-500">
                    ({overall.count} verified reviews)
                </span>
            </h2>

            {/* Overall Rating */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-8 p-4 bg-gray-50 rounded-xl">
                <div className="text-center md:text-left">
                    <div className="text-4xl font-bold text-gray-900 mb-1">
                        {overall.rating || '—'}
                    </div>
                    <div className="flex gap-1 justify-center md:justify-start mb-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                size={16}
                                className={`${star <= Math.round(overall.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                            />
                        ))}
                    </div>
                    <p className="text-xs text-gray-500">Overall Rating</p>
                </div>

                <div className="flex-1 md:border-l border-gray-200 md:pl-6 flex flex-col justify-center text-sm text-gray-600">
                    {overall.count > 0 ? (
                        <p className="font-medium italic">
                            "Most guests highlighted the convenient location and cleanliness"
                        </p>
                    ) : (
                        <p>No reviews yet. Be the first to share your experience.</p>
                    )}
                </div>
            </div>

            {/* Add Review Form */}
            <form onSubmit={handleSubmit} className="mb-8 space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Share your experience</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Your Name
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Enter your name"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Rating
                        </label>
                        <select
                            name="rating"
                            value={formData.rating}
                            onChange={handleChange}
                            className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        >
                            {[5, 4, 3, 2, 1].map(value => (
                                <option key={value} value={value}>
                                    {value} Star{value > 1 ? 's' : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Your Review
                    </label>
                    <textarea
                        name="comment"
                        value={formData.comment}
                        onChange={handleChange}
                        required
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="How was your stay?"
                    />
                </div>
                <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 disabled:opacity-60"
                >
                    {submitting ? 'Submitting...' : 'Submit Review'}
                </button>
            </form>

            {/* Reviews List */}
            <div className="space-y-6">
                {loading && (
                    <p className="text-sm text-gray-500">Loading reviews...</p>
                )}
                {!loading && reviews.length === 0 && (
                    <p className="text-sm text-gray-500">No reviews yet.</p>
                )}
                {reviews.map((review) => (
                    <div key={review._id} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-100 to-orange-100 rounded-full flex items-center justify-center text-primary-700 font-bold">
                                    {review.name?.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900">{review.name}</h4>
                                    <p className="text-xs text-gray-500">
                                        {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-0.5">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        size={14}
                                        className={`${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="text-gray-600 text-sm leading-relaxed mb-3">
                            {review.comment}
                        </p>
                        <button className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                            <ThumbsUp size={12} />
                            Helpful
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ReviewsSection;
