# Performance Statistics - Visual Guide

## Dashboard Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                            │
│  Performance Statistics                                         │
│  Aggregated insights from all completed interviews              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┬──────────────┐
│   📊 Total   │   🎯 Average │   🏆 Hire    │   📈 Last    │
│   Interviews │     Score    │     Rate     │   30 Days    │
│      25      │     75%      │     60%      │      15      │
└──────────────┴──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────┬─────────────────────────────────┐
│  📊 Average Scores by Category  │  🥧 Recommendations Distribution│
│                                 │                                 │
│  Overall         ████████ 75%   │         ╱─────╲                │
│  Communication   █████████ 78%  │        │ 🟢 20% │               │
│  Technical       ███████ 72%    │       │  🔵 40%  │              │
│  Problem Solving ████████ 74%   │        │ 🟡 32% │               │
│  Behavioral      ████████ 76%   │         ╲─────╱                │
│  Cultural        ████████ 77%   │          🔴 8%                 │
│                                 │                                 │
│  (Animated gradient bars)       │  Legend:                        │
│                                 │  🟢 STRONG_HIRE: 5 (20%)       │
│                                 │  🔵 HIRE: 10 (40%)             │
│                                 │  🟡 MAYBE: 8 (32%)             │
│                                 │  🔴 NO_HIRE: 2 (8%)            │
└─────────────────────────────────┴─────────────────────────────────┘

┌──────────────┬──────────────┬──────────────┐
│ 🌟 Strong    │ ✅ Overall   │ 📈 Avg Score │
│ Hire Rate    │ Hire Rate    │    Trend     │
│              │              │              │
│    20.0%     │    60.0%     │    76.2%     │
│              │              │              │
│ 5 out of 25  │ 15 recommend │ Last 30 days │
│  candidates  │   for hire   │ performance  │
└──────────────┴──────────────┴──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  🎯 Performance Breakdown Comparison                            │
│                                                                 │
│  ⭕75%    ⭕78%    ⭕72%    ⭕74%    ⭕76%    ⭕77%              │
│  Overall  Comm.   Tech.   Problem  Behav.  Cultural            │
│                                                                 │
│  (Circular progress indicators with color-coded rings)          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  📋 Recent Interviews                                           │
│                                                                 │
│  Candidate    │ Role           │ Score │ Recommendation │ Date │
│  ──────────────────────────────────────────────────────────────│
│  John Doe     │ Sr Developer   │ 85%   │ [HIRE]        │ Nov 1│
│  Jane Smith   │ Designer       │ 92%   │ [STRONG_HIRE] │ Oct 30│
│  Bob Johnson  │ PM             │ 68%   │ [MAYBE]       │ Oct 28│
│  ...          │ ...            │ ...   │ ...           │ ...  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────┬─────────────────────────────────┐
│  📈 Top Strengths Across        │  📉 Common Areas for            │
│     Candidates                  │     Improvement                 │
│                                 │                                 │
│  #1  Communication       ✅     │  #1  Technical depth      ⚠️   │
│  #2  Technical skills    ✅     │  #2  Specific examples    ⚠️   │
│  #3  Problem-solving     ✅     │  #3  Clarity              ⚠️   │
│  #4  Teamwork           ✅     │  #4  Detail level         ⚠️   │
│  #5  Leadership         ✅     │  #5  Structure            ⚠️   │
└─────────────────────────────────┴─────────────────────────────────┘
```

## Chart Details

### 1. Pie Chart - Recommendations Distribution

**Visual Representation:**
```
        STRONG_HIRE (20%)
           ╱────╲
          │  🟢  │
         │  🔵🔵  │
          │  🟡  │
           ╲────╱
        NO_HIRE (8%)

Colors:
🟢 Green  - STRONG_HIRE (20%)
🔵 Blue   - HIRE (40%)
🟡 Yellow - MAYBE (32%)
🔴 Red    - NO_HIRE (8%)
```

**Features:**
- Interactive hover effects
- Percentage labels
- Side legend with counts
- Smooth transitions
- SVG-based for crisp rendering

### 2. Bar Chart - Score Categories

**Visual Representation:**
```
Overall         ████████████████████████████████████ 75%
                ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

Communication   ██████████████████████████████████████ 78%
                ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

Technical       ████████████████████████████████ 72%
                ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

Problem Solving ███████████████████████████████████ 74%
                ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

Behavioral      ████████████████████████████████████ 76%
                ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

Cultural        █████████████████████████████████████ 77%
                ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

Legend:
█ = Gradient fill (animated)
▓ = Background track
```

**Color Coding:**
- Green gradient (≥80%): High performance
- Yellow gradient (60-79%): Medium performance
- Red gradient (<60%): Needs improvement

### 3. Circular Progress Indicators

**Visual Representation:**
```
    ╭─────╮      ╭─────╮      ╭─────╮
   │   75% │    │   78% │    │   72% │
   │       │    │       │    │       │
    ╰─────╯      ╰─────╯      ╰─────╯
    Overall      Comm.        Tech.

    ╭─────╮      ╭─────╮      ╭─────╮
   │   74% │    │   76% │    │   77% │
   │       │    │       │    │       │
    ╰─────╯      ╰─────╯      ╰─────╯
    Problem      Behav.       Cultural
```

**Features:**
- SVG circular progress rings
- Color-coded by score
- Large percentage in center
- Smooth animation (1s duration)
- Responsive grid layout

### 4. Summary Cards with Gradients

**Strong Hire Rate Card:**
```
┌─────────────────────────┐
│ 🌟 Strong Hire Rate     │
│                         │
│        20.0%            │
│                         │
│ 5 out of 25 candidates  │
└─────────────────────────┘
Background: Green gradient
```

**Overall Hire Rate Card:**
```
┌─────────────────────────┐
│ ✅ Overall Hire Rate    │
│                         │
│        60.0%            │
│                         │
│ 15 recommended for hire │
└─────────────────────────┘
Background: Blue gradient
```

**Average Score Trend Card:**
```
┌─────────────────────────┐
│ 📈 Avg Score Trend      │
│                         │
│        76.2%            │
│                         │
│ Last 30 days performance│
└─────────────────────────┘
Background: Purple gradient
```

### 5. Ranked Lists

**Top Strengths:**
```
┌─────────────────────────────────┐
│ #1  Communication         ✅    │
│     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│                                 │
│ #2  Technical skills      ✅    │
│     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓      │
│                                 │
│ #3  Problem-solving       ✅    │
│     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓         │
└─────────────────────────────────┘
Green theme with borders
```

**Common Improvements:**
```
┌─────────────────────────────────┐
│ #1  Technical depth       ⚠️    │
│     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓   │
│                                 │
│ #2  Specific examples     ⚠️    │
│     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓       │
│                                 │
│ #3  Clarity               ⚠️    │
│     ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          │
└─────────────────────────────────┘
Yellow theme with borders
```

## Color System

### Primary Colors
- **Green (#10b981)**: Success, high scores, strengths
- **Blue (#3b82f6)**: HIRE, overall metrics
- **Yellow (#f59e0b)**: Medium scores, improvements
- **Red (#ef4444)**: Low scores, concerns
- **Purple (#a855f7)**: Trends, analytics

### Background Colors
- **Slate-900**: Main background
- **White/5**: Card backgrounds (5% opacity)
- **Gradient overlays**: Blue-900 to Slate-900

### Text Colors
- **White**: Primary text
- **Slate-300**: Secondary text
- **Slate-400**: Tertiary text

## Animation Timeline

```
Page Load
    ↓
Summary Cards Fade In (0-200ms)
    ↓
Bar Chart Bars Fill (200-700ms)
    ↓
Pie Chart Slices Draw (300-800ms)
    ↓
Circular Progress Rings Fill (400-1400ms)
    ↓
Tables & Lists Fade In (500-700ms)
    ↓
All Animations Complete (1400ms)
```

## Responsive Breakpoints

- **Mobile (<768px)**: Single column, stacked charts
- **Tablet (768-1024px)**: 2-column grid
- **Desktop (>1024px)**: Full 3-column layout

## Interaction States

### Hover Effects
- Cards: Slight elevation
- Bars: Opacity change
- Pie slices: Opacity 80%
- Buttons: Background color change

### Click Actions
- Export PDF button
- Back to Dashboard button
- Table rows (future: drill-down)

## Data Update Flow

```
User Opens Page
    ↓
Fetch Performance Stats API
    ↓
Parse Response Data
    ↓
Transform for Charts
    ↓
Render Visualizations
    ↓
Animate Elements
    ↓
Ready for Interaction
```

## Key Metrics at a Glance

| Metric | Location | Visualization | Color |
|--------|----------|---------------|-------|
| Total Interviews | Top Card | Number | Blue |
| Average Score | Top Card | Percentage | Green |
| Hire Rate | Top Card | Percentage | Yellow |
| Last 30 Days | Top Card | Number | Purple |
| Score Categories | Bar Chart | Horizontal Bars | Gradient |
| Recommendations | Pie Chart | Pie Slices | Multi-color |
| Strong Hire Rate | Summary Card | Percentage | Green |
| Overall Hire Rate | Summary Card | Percentage | Blue |
| Score Trend | Summary Card | Percentage | Purple |
| Category Breakdown | Circular Progress | Rings | Color-coded |
| Top Strengths | Ranked List | Numbered Cards | Green |
| Common Improvements | Ranked List | Numbered Cards | Yellow |

## Best Practices Applied

✅ Clear visual hierarchy
✅ Consistent color coding
✅ Smooth animations
✅ Responsive design
✅ Accessible contrast ratios
✅ Interactive feedback
✅ Loading states
✅ Error handling
✅ Performance optimized
✅ Mobile-friendly
