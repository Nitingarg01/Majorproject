# Question Variety & Personalization Enhancement

## Problem
AI was generating repetitive question types and not referencing candidate's actual resume details (skills, projects, companies).

## Solution Implemented

### 1. **Resume-Aware Question Generation**
Questions now deeply integrate candidate's actual resume data:
- **Specific Company References**: "I see you worked at Google as a Senior Engineer..."
- **Specific Project References**: "Tell me about your E-commerce Platform project..."
- **Specific Skill References**: "You have experience with React. Can you describe..."
- **Specific Technology Stack**: "In your project using Node.js and MongoDB..."

The AI receives detailed context:
```
Skills: Python, React, Node.js, AWS, Docker
Work Experience:
- Senior Engineer at Google (Tech: Python, Kubernetes)
- Developer at Microsoft (Tech: C#, Azure)
Projects:
- E-commerce Platform using React, Node.js: Built scalable shopping system
- ML Recommendation Engine using Python, TensorFlow: Improved user engagement
```

### 2. **Question Style Rotation System**
Added 8 distinct question styles that rotate automatically:
- `behavioral_star` - "Tell me about a time when..."
- `situational` - "How would you handle..."
- `technical_deep` - "Explain how... works"
- `project_walkthrough` - "Walk me through..."
- `problem_solving` - "If you encountered X, what would you do?"
- `opinion_based` - "What do you think about..."
- `comparison` - "What's the difference between..."
- `experience_specific` - "In your experience with X, how did you..."

### 2. **Style Tracking & Enforcement**
- Tracks last 5 question styles used
- Automatically selects a style that hasn't been used recently
- Forces AI to use the selected style via enhanced prompts

### 3. **Aggressive Variety Controls**
Enhanced AI parameters for maximum diversity:
- **Temperature**: Increased to 0.95-0.98 (was 0.7-0.8)
- **Top-p**: Increased to 0.95-0.98 (was 0.9)
- **Frequency Penalty**: Increased to 0.7-0.8 (was 0.5)
- **Presence Penalty**: Increased to 0.5-0.6 (was 0.3)

### 4. **Style-Specific Instructions**
Each question style has explicit instructions:
```
behavioral_star: "Use STAR format: 'Tell me about a time when...'"
situational: "Ask a hypothetical: 'How would you handle...'"
technical_deep: "Ask for technical explanation: 'Explain how...'"
...etc
```

### 5. **Enhanced Prompt**
Updated system prompt to explicitly require style rotation:
```
"CRITICAL: DO NOT use the same question format twice in a row. 
ROTATE between these styles constantly."
```

## Expected Results
- **No more repetitive question patterns**
- **8 different question formats rotating**
- **Personalized questions referencing actual resume details**
- **More natural, varied interview flow**
- **Better candidate engagement**

### Example Questions Generated:

**Before (Generic):**
- "Tell me about your experience with React"
- "What projects have you worked on?"
- "Describe a technical challenge"

**After (Personalized):**
- "I see you worked at Google as a Senior Engineer. Can you tell me about the Kubernetes infrastructure you built there?"
- "Your E-commerce Platform project using React and Node.js sounds interesting. What was the biggest technical challenge you faced?"
- "In your ML Recommendation Engine project, why did you choose TensorFlow over PyTorch? What alternatives did you consider?"

## Testing
Restart the backend server and conduct a new interview. You should see:
1. Different question formats in console logs (e.g., "Style: behavioral_star")
2. Questions that vary significantly in structure
3. Natural conversation flow with diverse approaches

## Rollback
If issues occur, revert to previous version with:
```bash
git checkout HEAD~1 backend/ai_services.py
```
