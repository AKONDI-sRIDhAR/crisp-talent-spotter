import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, ArrowLeft, Trophy, Clock, MessageSquare, User, Star, Filter, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setCurrentMode, Candidate } from '@/store/interviewSlice';

const InterviewerDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const candidates = useAppSelector((state) => state.interview.candidates);
  
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'score' | 'name' | 'date'>('score');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in-progress' | 'pending'>('all');

  const filteredAndSortedCandidates = candidates
    .filter(candidate => {
      const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          candidate.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || candidate.status === filterStatus;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'score':
          return b.score - a.score;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'date':
          const aDate = a.endTime || a.startTime || new Date(0);
          const bDate = b.endTime || b.startTime || new Date(0);
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        default:
          return 0;
      }
    });

  const getScoreColor = (score: number) => {
    if (score >= 12) return 'text-green-500'; // 80%
    if (score >= 9) return 'text-yellow-500'; // 60%
    return 'text-red-500';
  };

  const getScoreBadgeVariant = (score: number, isIndividual: boolean = false) => {
    const threshold = isIndividual ? 8 : 12; // 8/10 for individual, 12/15 for total
    const midThreshold = isIndividual ? 6 : 9;

    if (score >= threshold) return 'default';
    if (score >= midThreshold) return 'secondary';
    return 'destructive';
  };

  const handleViewResume = (candidate: Candidate) => {
    if (candidate.resumeDataUrl) {
      window.open(candidate.resumeDataUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDuration = (startTime?: Date, endTime?: Date) => {
    if (!startTime) return 'Not started';
    if (!endTime) return 'In progress';
    
    const duration = new Date(endTime).getTime() - new Date(startTime).getTime();
    const minutes = Math.floor(duration / 60000);
    return `${minutes} minutes`;
  };

  if (selectedCandidate) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="outline"
              onClick={() => setSelectedCandidate(null)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">{selectedCandidate.name}</h1>
              <p className="text-muted-foreground">{selectedCandidate.email}</p>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Candidate Summary */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Candidate Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-4">
                      <AvatarFallback className="text-lg">
                        {selectedCandidate.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="font-semibold">{selectedCandidate.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedCandidate.email}</p>
                    <p className="text-sm text-muted-foreground">{selectedCandidate.phone}</p>
                    {selectedCandidate.resumeDataUrl && (
                      <Button
                        onClick={() => handleViewResume(selectedCandidate)}
                        variant="outline"
                        size="sm"
                        className="mt-2"
                      >
                        <FileText className="w-4 h-4 mr-2" />
                        View Resume
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className={`text-2xl font-bold ${getScoreColor(selectedCandidate.score)}`}>
                        {selectedCandidate.score.toFixed(1)} / 15
                      </div>
                      <div className="text-xs text-muted-foreground">Overall Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {selectedCandidate.answers.length}/6
                      </div>
                      <div className="text-xs text-muted-foreground">Questions</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Status:</span>
                      <Badge variant={selectedCandidate.status === 'completed' ? 'default' : 'secondary'}>
                        {selectedCandidate.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Duration:</span>
                      <span>{formatDuration(selectedCandidate.startTime, selectedCandidate.endTime)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Summary */}
              {selectedCandidate.aiSummary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      AI Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm leading-relaxed">{selectedCandidate.aiSummary}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Interview Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Interview Responses
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {selectedCandidate.answers.map((answer, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Question {index + 1}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize">
                            {answer.difficulty}
                          </Badge>
                          <Badge variant={getScoreBadgeVariant(answer.aiScore, true)}>
                            {answer.aiScore}/10
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Question:</p>
                          <p className="text-sm">{answer.question}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-1">Answer:</p>
                          <p className="text-sm bg-muted/30 rounded p-2">{answer.answer}</p>
                        </div>
                        
                        {answer.aiComment && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-1">AI Feedback:</p>
                            <p className="text-sm italic text-muted-foreground">{answer.aiComment}</p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {answer.timeUsed}s / {answer.timeLimit}s
                          </span>
                          <span className="flex items-center gap-1">
                            <Trophy className="w-3 h-3" />
                            Score: {answer.aiScore}/10
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {selectedCandidate.answers.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No responses yet
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold">Interviewer Dashboard</h1>
            <p className="text-muted-foreground mt-2">Manage and review candidate interviews</p>
          </div>
          <Button
            variant="outline"
            onClick={() => dispatch(setCurrentMode('landing'))}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-lg">
                  <User className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{candidates.length}</div>
                  <div className="text-sm text-muted-foreground">Total Candidates</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Trophy className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {candidates.filter(c => c.status === 'completed').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {candidates.filter(c => c.status === 'in-progress').length}
                  </div>
                  <div className="text-sm text-muted-foreground">In Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-accent/10 rounded-lg">
                  <Star className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {candidates.length > 0 
                      ? (candidates.reduce((sum, c) => sum + c.score, 0) / candidates.length).toFixed(1)
                      : '0.0'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">Avg Score</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search candidates by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value: 'score' | 'name' | 'date') => setSortBy(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="score">Sort by Score</SelectItem>
                    <SelectItem value="name">Sort by Name</SelectItem>
                    <SelectItem value="date">Sort by Date</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={(value: 'all' | 'completed' | 'in-progress' | 'pending') => setFilterStatus(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Candidates List */}
        <div className="space-y-4">
          {filteredAndSortedCandidates.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No candidates found</h3>
                <p className="text-muted-foreground">
                  {candidates.length === 0 
                    ? "No candidates have taken the interview yet."
                    : "Try adjusting your search or filter criteria."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAndSortedCandidates.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer"
                      onClick={() => setSelectedCandidate(candidate)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback>
                            {candidate.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <h3 className="font-semibold text-lg">{candidate.name}</h3>
                          <p className="text-muted-foreground">{candidate.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={candidate.status === 'completed' ? 'default' : 'secondary'}>
                              {candidate.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {candidate.answers.length}/6 questions
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-3xl font-bold ${getScoreColor(candidate.score)}`}>
                          {candidate.score.toFixed(1)} / 15
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatDuration(candidate.startTime, candidate.endTime)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewerDashboard;