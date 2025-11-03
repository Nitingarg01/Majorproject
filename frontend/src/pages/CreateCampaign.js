import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card } from '../components/ui/card';
import { Textarea } from '../components/ui/textarea';
import { useToast } from '../hooks/use-toast';
import { ArrowLeft, Save, Briefcase, Users, Target } from 'lucide-react';

const CreateCampaign = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    position: '',
    requirements: '',
    description: '',
    status: 'active'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: Replace with actual API call
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Campaign created successfully'
        });
        navigate('/dashboard');
      } else {
        throw new Error('Failed to create campaign');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create campaign',
        variant: 'destructive'
      });
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard')}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
              <div className="h-6 w-px bg-slate-300" />
              <h1 className="text-xl font-semibold text-slate-900">Create New Campaign</h1>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-slate-600">Welcome, {user?.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="p-8">
          <div className="mb-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Briefcase className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Campaign Details</h2>
                <p className="text-slate-600">Set up your hiring campaign with job requirements</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Campaign Title */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="title" className="text-sm font-medium text-slate-700 mb-2 block">
                  Campaign Title *
                </Label>
                <Input
                  id="title"
                  name="title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Senior Frontend Developer Hiring"
                  className="w-full"
                />
              </div>

              <div>
                <Label htmlFor="position" className="text-sm font-medium text-slate-700 mb-2 block">
                  Position *
                </Label>
                <Input
                  id="position"
                  name="position"
                  type="text"
                  required
                  value={formData.position}
                  onChange={handleChange}
                  placeholder="e.g., Senior Frontend Developer"
                  className="w-full"
                />
              </div>
            </div>

            {/* Job Description */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-slate-700 mb-2 block">
                Job Description
              </Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the role, responsibilities, and what you're looking for..."
                rows={4}
                className="w-full"
              />
            </div>

            {/* Requirements */}
            <div>
              <Label htmlFor="requirements" className="text-sm font-medium text-slate-700 mb-2 block">
                Requirements & Skills *
              </Label>
              <Textarea
                id="requirements"
                name="requirements"
                required
                value={formData.requirements}
                onChange={handleChange}
                placeholder="List the key requirements, skills, and qualifications needed for this position..."
                rows={6}
                className="w-full"
              />
              <p className="text-xs text-slate-500 mt-1">
                These requirements will be used by AI to generate relevant interview questions
              </p>
            </div>

            {/* Campaign Status */}
            <div>
              <Label htmlFor="status" className="text-sm font-medium text-slate-700 mb-2 block">
                Campaign Status
              </Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/dashboard')}
                className="px-6"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 px-6"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Create Campaign
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-4 mt-8 pt-8 border-t border-slate-200">
            <div className="flex items-center space-x-3 p-4 bg-blue-50 rounded-lg">
              <Target className="w-8 h-8 text-blue-600" />
              <div>
                <h4 className="font-medium text-blue-900">AI-Powered</h4>
                <p className="text-sm text-blue-700">Questions generated based on requirements</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg">
              <Users className="w-8 h-8 text-green-600" />
              <div>
                <h4 className="font-medium text-green-900">Candidate Tracking</h4>
                <p className="text-sm text-green-700">Monitor progress and scores</p>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg">
              <Briefcase className="w-8 h-8 text-purple-600" />
              <div>
                <h4 className="font-medium text-purple-900">Easy Management</h4>
                <p className="text-sm text-purple-700">Organize all your hiring campaigns</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CreateCampaign;