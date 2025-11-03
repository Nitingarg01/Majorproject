# Testing Feedback & Performance Stats

## Quick Test Guide

### Step 1: Start Backend Server
```bash
cd backend
python server.py
```

Wait for: `✅ MongoDB client initialized successfully`

### Step 2: Start Frontend
```bash
cd frontend
npm start
```

### Step 3: Login
Navigate to `http://localhost:3000` and login as recruiter.

---

## Test Scenario 1: Create Demo Data (Fastest)

### Using Browser Console:
1. Open browser console (F12)
2. Get your auth token:
   ```javascript
   localStorage.getItem('token')
   ```
3. Run this command:
   ```javascript
   fetch('http://localhost:8000/api/interviews/create-demo-data', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('token')
     }
   })
   .then(r => r.json())
   .then(d => console.log('Demo data created:', d))
   ```

### Expected Result:
```json
{
  "success": true,
  "message": "Created 3 demo interviews with feedback",
  "count": 3,
  "interviews": [
    {"name": "John Doe", "role": "Senior Software Engineer", "score": 85},
    {"name": "Jane Smith", "role": "Full Stack Developer", "score": 78},
    {"name": "Mike Johnson", "role": "Senior Backend Engineer", "score": 92}
  ]
}
```

### Step 4: View Performance Stats
1. Navigate to Dashboard
2. Click "Performance Stats" card
3. Should see:
   - ✅ Total Interviews: 3
   - ✅ Average Overall Score: ~85
   - ✅ Recommendations: 1 STRONG_HIRE, 1 HIRE, 1 MAYBE
   - ✅ Recent interviews list

### Step 5: View Individual Feedback
1. Go back to Dashboard
2. Look for "Recent Interviews" section
3. Click on any interview
4. Should see complete feedback with:
   - ✅ Overall score
   - ✅ Category scores (Communication, Technical, etc.)
   - ✅ Strengths list
   - ✅ Improvements list
   - ✅ Recommendation badge

---

## Test Scenario 2: Complete Real Interview

### Step 1: Create Interview
1. Click "Create Interview" on dashboard
2. Upload a resume (or use sample data)
3. Fill in:
   - Candidate Name
   - Target Role
   - Experience Level
4. Click "Start Interview"

### Step 2: Conduct Interview
1. Answer 5-10 questions
2. Use voice or type answers
3. Click "End Interview" button (red phone icon)

### Step 3: View Feedback
1. System automatically generates feedback
2. Redirects to feedback page
3. Should see:
   - ✅ Comprehensive feedback
   - ✅ Scores for all categories
   - ✅ Strengths and improvements
   - ✅ Hiring recommendation

### Step 4: Check Performance Stats
1. Navigate to Performance Stats
2. Should now show 4 interviews (3 demo + 1 real)
3. Updated averages and trends

---

## Troubleshooting

### Issue: "Interview Not Found"
**Solution**: 
- Backend server must be running
- Check console for errors
- Verify interview was saved (check MongoDB)

### Issue: Performance Stats Empty
**Solution**:
- Create demo data using Step 3 above
- Or complete at least one interview
- Refresh the page

### Issue: Feedback Not Generating
**Solution**:
- Check backend logs for errors
- Verify AI API keys are configured in `.env`
- Interview must have conversation history

### Issue: Demo Data Creation Fails
**Solution**:
- Verify you're logged in as recruiter
- Check MongoDB connection
- Look at backend console for error messages

---

## Expected Data Structure

### Interview with Feedback:
```json
{
  "interviewId": "demo-abc123",
  "candidateName": "John Doe",
  "targetRole": "Senior Software Engineer",
  "status": "completed",
  "conversation": [
    {"type": "question", "text": "Tell me about yourself"},
    {"type": "answer", "text": "I'm a senior engineer..."}
  ],
  "feedback": {
    "scores": {
      "overall": 85,
      "communication": 88,
      "technical": 82,
      "problemSolving": 86,
      "behavioral": 84,
      "cultural": 85
    },
    "strengths": [
      "Strong technical knowledge",
      "Excellent communication"
    ],
    "improvements": [
      "Could provide more examples"
    ],
    "recommendation": "HIRE",
    "summary": "Strong candidate..."
  }
}
```

### Performance Stats Response:
```json
{
  "totalInterviews": 3,
  "averageScores": {
    "overall": 85.0,
    "communication": 86.0,
    "technical": 84.0,
    "problemSolving": 86.0,
    "behavioral": 83.3,
    "cultural": 85.3
  },
  "recommendations": {
    "STRONG_HIRE": 1,
    "HIRE": 1,
    "MAYBE": 1,
    "NO_HIRE": 0
  },
  "recentInterviews": [
    {
      "interviewId": "demo-abc123",
      "candidateName": "Mike Johnson",
      "targetRole": "Senior Backend Engineer",
      "overallScore": 92,
      "recommendation": "STRONG_HIRE"
    }
  ]
}
```

---

## Success Criteria

✅ Demo data creates 3 interviews successfully
✅ Performance stats shows correct totals and averages
✅ Individual feedback pages load without errors
✅ Real interviews generate feedback automatically
✅ All scores and recommendations display correctly

---

## Clean Up (Optional)

To remove all demo data:
```javascript
fetch('http://localhost:8000/api/interviews/clear-demo-data', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  }
})
.then(r => r.json())
.then(d => console.log('Data cleared:', d))
```

This will delete all interviews and campaigns.
