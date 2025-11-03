import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { 
  TrendingUp, 
  TrendingDown,
  Users,
  Award,
  Target,
  BarChart3,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  PieChart as PieChartIcon
} from 'lucide-react';

// Custom Pie Chart Component
const PieChart = ({ data, colors }) => {
  let currentAngle = 0;
  const total = data.reduce((sum, item) => sum + item.value, 0);
  
  const slices = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (item.value / total) * 360;
    const startAngle = currentAngle;
    currentAngle += angle;
    
    const x1 = 50 + 45 * Math.cos((Math.PI * startAngle) / 180);
    const y1 = 50 + 45 * Math.sin((Math.PI * startAngle) / 180);
    const x2 = 50 + 45 * Math.cos((Math.PI * (startAngle + angle)) / 180);
    const y2 = 50 + 45 * Math.sin((Math.PI * (startAngle + angle)) / 180);
    
    const largeArc = angle > 180 ? 1 : 0;
    
    return {
      path: `M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArc} 1 ${x2} ${y2} Z`,
      color: colors[index],
      label: item.label,
      value: item.value,
      percentage: percentage.toFixed(1)
    };
  });
  
  return (
    <div className="flex items-center justify-center gap-8">
      <svg viewBox="0 0 100 100" className="w-64 h-64">
        {slices.map((slice, index) => (
          <g key={index}>
            <path
              d={slice.path}
              fill={slice.color}
              className="transition-all hover:opacity-80 cursor-pointer"
            />
          </g>
        ))}
      </svg>
      <div className="space-y-2">
        {slices.map((slice, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: slice.color }}></div>
            <span className="text-white text-sm">
              {slice.label}: {slice.value} ({slice.percentage}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Custom Bar Chart Component
const BarChart = ({ data, maxValue }) => {
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={index} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-300 capitalize">{item.label}</span>
            <span className="text-white font-semibold">{item.value}%</span>
          </div>
          <div className="relative w-full bg-slate-700 rounded-full h-8 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-3 ${
                item.value >= 80 ? 'bg-gradient-to-r from-green-600 to-green-400' :
                item.value >= 60 ? 'bg-gradient-to-r from-yellow-600 to-yellow-400' :
                'bg-gradient-to-r from-red-600 to-red-400'
              }`}
              style={{ width: `${(item.value / maxValue) * 100}%` }}
            >
              <span className="text-white text-xs font-bold">{item.value}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const PerformanceStats = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceStats();
  }, []);

  const fetchPerformanceStats = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/interviews/performance-stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendationColor = (rec) => {
    switch (rec) {
      case 'STRONG_HIRE': return 'text-green-600 bg-green-100';
      case 'HIRE': return 'text-blue-600 bg-blue-100';
      case 'MAYBE': return 'text-yellow-600 bg-yellow-100';
      case 'NO_HIRE': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRecommendationIcon = (rec) => {
    switch (rec) {
      case 'STRONG_HIRE': return <Star className="w-4 h-4" />;
      case 'HIRE': return <CheckCircle className="w-4 h-4" />;
      case 'MAYBE': return <AlertCircle className="w-4 h-4" />;
      case 'NO_HIRE': return <XCircle className="w-4 h-4" />;
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading performance stats...</div>
      </div>
    );
  }

  if (!stats || stats.totalInterviews === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          <Button
            onClick={() => navigate('/dashboard')}
            className="mb-6 bg-white/10 hover:bg-white/20"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="p-12 text-center bg-white/5 backdrop-blur-sm border-white/10">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 text-blue-400" />
            <h2 className="text-2xl font-bold text-white mb-2">No Interview Data Yet</h2>
            <p className="text-slate-300 mb-6">
              Complete some interviews to see performance statistics and insights.
            </p>
            <Button
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button
              onClick={() => navigate('/dashboard')}
              variant="ghost"
              className="mb-4 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-4xl font-bold text-white mb-2">Performance Statistics</h1>
            <p className="text-slate-300">Aggregated insights from all completed interviews</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-8 h-8 text-blue-400" />
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalInterviews}</div>
            <div className="text-sm text-slate-300">Total Interviews</div>
          </Card>

          <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.averageScores.overall}%
            </div>
            <div className="text-sm text-slate-300">Average Score</div>
          </Card>

          <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
            <div className="flex items-center justify-between mb-2">
              <Award className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.summary.hireRate}%
            </div>
            <div className="text-sm text-slate-300">Hire Rate</div>
          </Card>

          <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-8 h-8 text-purple-400" />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {stats.trends.last30Days}
            </div>
            <div className="text-sm text-slate-300">Last 30 Days</div>
          </Card>
        </div>

        {/* Score Breakdown with Bar Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-400" />
              Average Scores by Category
            </h3>
            <BarChart 
              data={Object.entries(stats.averageScores).map(([category, score]) => ({
                label: category.replace(/([A-Z])/g, ' $1').trim(),
                value: score
              }))}
              maxValue={100}
            />
          </Card>

          <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
            <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
              <PieChartIcon className="w-5 h-5 mr-2 text-purple-400" />
              Recommendations Distribution
            </h3>
            <PieChart 
              data={Object.entries(stats.recommendations)
                .filter(([_, count]) => count > 0)
                .map(([rec, count]) => ({
                  label: rec.replace('_', ' '),
                  value: count
                }))}
              colors={['#10b981', '#3b82f6', '#f59e0b', '#ef4444']}
            />
          </Card>
        </div>

        {/* Additional Stats Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-green-900/30 to-emerald-900/30 backdrop-blur-sm border-green-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Strong Hire Rate</h3>
              <Star className="w-6 h-6 text-green-400" />
            </div>
            <div className="text-4xl font-bold text-green-400 mb-2">
              {stats.summary.strongHireRate}%
            </div>
            <p className="text-sm text-slate-300">
              {stats.recommendations.STRONG_HIRE} out of {stats.totalInterviews} candidates
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-900/30 to-indigo-900/30 backdrop-blur-sm border-blue-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Overall Hire Rate</h3>
              <CheckCircle className="w-6 h-6 text-blue-400" />
            </div>
            <div className="text-4xl font-bold text-blue-400 mb-2">
              {stats.summary.hireRate}%
            </div>
            <p className="text-sm text-slate-300">
              {stats.recommendations.STRONG_HIRE + stats.recommendations.HIRE} recommended for hire
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 backdrop-blur-sm border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Avg Score Trend</h3>
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div className="text-4xl font-bold text-purple-400 mb-2">
              {stats.trends.averageScoreTrend}%
            </div>
            <p className="text-sm text-slate-300">
              Last 30 days performance
            </p>
          </Card>
        </div>

        {/* Recent Interviews */}
        <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <h3 className="text-xl font-semibold text-white mb-4">Recent Interviews</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Candidate</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Role</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-medium">Score</th>
                  <th className="text-center py-3 px-4 text-slate-300 font-medium">Recommendation</th>
                  <th className="text-left py-3 px-4 text-slate-300 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentInterviews.map((interview) => (
                  <tr key={interview.interviewId} className="border-b border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-white">{interview.candidateName}</td>
                    <td className="py-3 px-4 text-slate-300">{interview.targetRole}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`font-semibold ${
                        interview.overallScore >= 80 ? 'text-green-400' :
                        interview.overallScore >= 60 ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {interview.overallScore}%
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRecommendationColor(interview.recommendation)}`}>
                          {interview.recommendation.replace('_', ' ')}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-300 text-sm">
                      {interview.completedAt ? new Date(interview.completedAt).toLocaleDateString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Score Comparison Radar */}
        <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10 mb-8">
          <h3 className="text-xl font-semibold text-white mb-6 flex items-center">
            <Target className="w-5 h-5 mr-2 text-indigo-400" />
            Performance Breakdown Comparison
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stats.averageScores).map(([category, score]) => (
              <div key={category} className="text-center">
                <div className="relative w-24 h-24 mx-auto mb-3">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                      fill="none"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      stroke={score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${(score / 100) * 251.2} 251.2`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{score}%</span>
                  </div>
                </div>
                <div className="text-sm text-slate-300 capitalize">
                  {category.replace(/([A-Z])/g, ' $1').trim()}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-400" />
              Top Strengths Across Candidates
            </h3>
            <div className="space-y-3">
              {stats.topStrengths.map((strength, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-green-900/20 rounded-lg border border-green-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                      <span className="text-green-400 font-bold text-sm">#{index + 1}</span>
                    </div>
                    <span className="text-slate-200 capitalize font-medium">{strength}</span>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 bg-white/5 backdrop-blur-sm border-white/10">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
              <TrendingDown className="w-5 h-5 mr-2 text-yellow-400" />
              Common Areas for Improvement
            </h3>
            <div className="space-y-3">
              {stats.commonImprovements.map((improvement, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-yellow-900/20 rounded-lg border border-yellow-500/20">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <span className="text-yellow-400 font-bold text-sm">#{index + 1}</span>
                    </div>
                    <span className="text-slate-200 capitalize font-medium">{improvement}</span>
                  </div>
                  <AlertCircle className="w-5 h-5 text-yellow-400" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PerformanceStats;
