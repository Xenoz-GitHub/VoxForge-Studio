# VoxForge Studio - Layout Redesign Plan

## 🎯 Current Issues
- Dense, overwhelming layout with too much information at once
- Lack of clear visual hierarchy
- Controls and inputs mixed together
- Poor mobile experience with cramped spacing
- No clear workflow progression

## ✨ Proposed Redesign

### **New 3-Column Layout Structure**

```
┌─────────────────────────────────────────────────────────────┐
│                      Studio Header                           │
│  Icon + Title                             Dashboard | Reset  │
└─────────────────────────────────────────────────────────────┘
┌──────────────┬────────────────────────────┬──────────────────┐
│   Sidebar    │    Main Work Area          │   Right Panel    │
│              │                            │                  │
│  • Mode      │  📝 Script Input           │  🎵 Preview      │
│  • Model     │  🎨 Style Config           │  📊 Takes        │
│  • Templates │  🎤 Voice Select           │  ☁️  History     │
│              │  ⚡ Generate Button        │                  │
│              │                            │                  │
└──────────────┴────────────────────────────┴──────────────────┘
```

### **Layout Breakdown**

#### **Left Sidebar (3 columns on desktop, full width on mobile)**
**Purpose**: Quick configuration and mode switching

**Cards:**
1. **Generation Mode Card**
   - Single Voice 🎤
   - Batch Queue 📋
   - Dialogue 💬
   - Large click targets with icons
   - Active state highlighting

2. **AI Model Card** (when applicable)
   - Flash TTS (Fast)
   - Flash Lite (Balanced)
   - Clear model differences
   - Quality indicators

3. **Quick Templates Card**
   - Pre-built scenarios
   - One-click load
   - Save custom templates

#### **Center Panel (6 columns on desktop)**
**Purpose**: Main workspace for content creation

**Structure:**
1. **Header Section**
   - Clear title with icon
   - Context-aware description
   - Progress indicator (if batch)

2. **Script Input Area**
   - Large, prominent textarea
   - Character count
   - Smart suggestions
   - Vocal cue quick inserts

3. **Style Configuration**
   - Collapsible sections
   - Style presets (chips/pills)
   - Custom input field
   - Visual examples

4. **Voice Selection**
   - Card-based layout
   - Voice profiles with avatars
   - Multi-select for audition mode
   - Clear active states

5. **Generate Button**
   - Large, prominent CTA
   - Shows mode + count
   - Loading states
   - Error messages inline

#### **Right Sidebar (3 columns on desktop)**
**Purpose**: Results and history management

**Sections:**
1. **Preview Player**
   - Waveform visualization
   - Playback controls
   - Download button
   - Save to cloud

2. **Takes Library**
   - Recent generations
   - Quick replay
   - Compare mode
   - Load into editor

3. **Cloud History**
   - Synced generations
   - Filter/search
   - Quick reload

## 🎨 Visual Design Improvements

### **Color System**
- **Mode Cards**: Gradient backgrounds (orange for active)
- **Model Cards**: Emerald green accent
- **Templates**: Blue accent
- **Generate Button**: Large orange gradient with shadow
- **Status Indicators**: Color-coded dots

### **Typography**
- **Headers**: Bold, clear hierarchy
- **Body**: Readable, generous line height
- **Labels**: Small caps for sections
- **Monospace**: For character counts

### **Spacing**
- **Card Padding**: 16px-20px
- **Section Gaps**: 16px-24px
- **Button Heights**: 44px minimum
- **Input Fields**: Generous padding

### **Components**

#### **Mode Selector Cards**
```tsx
┌─────────────────────────────┐
│ 🎤  Single Voice            │
│     One voice track         │
│     ✓ Active                │
└─────────────────────────────┘
```

#### **Model Selector**
```tsx
┌─────────────────────────────┐
│ Flash TTS (Recommended)     │
│ Fast, high-quality synthesis│
└─────────────────────────────┘
```

#### **Voice Profile Cards**
```tsx
┌──────────────┬──────────────┐
│ Kore         │ Puck         │
│ Narrator     │ Energetic    │
│ ────────     │ ────────     │
│ ✓ Selected   │ Select       │
└──────────────┴──────────────┘
```

## 📱 Mobile Optimization

### **Stacked Layout**
```
┌───────────────────────┐
│ Header                │
├───────────────────────┤
│ Mode Selector         │
│ (Horizontal Scroll)   │
├───────────────────────┤
│ Script Input          │
├───────────────────────┤
│ Voice Selection       │
├───────────────────────┤
│ Generate Button       │
├───────────────────────┤
│ Preview Player        │
├───────────────────────┤
│ Takes (Collapsible)   │
└───────────────────────┘
```

### **Mobile Features**
- Bottom sheet for voice selection
- Swipeable mode tabs
- Collapsible sections
- Sticky generate button
- Pull to refresh in history

## 🚀 Implementation Steps

### **Phase 1: Structure** ✅
1. Create new 3-column grid layout
2. Implement responsive breakpoints
3. Add section containers with proper spacing

### **Phase 2: Left Sidebar**
1. Mode selector cards with icons
2. Model selector cards
3. Templates panel integration

### **Phase 3: Center Panel**
1. Redesign script input area
2. Improve style configuration
3. Better voice selection cards
4. Prominent generate button

### **Phase 4: Right Sidebar**
1. Enhanced preview player
2. Takes library with better UX
3. Cloud history panel

### **Phase 5: Polish**
1. Animations and transitions
2. Loading states
3. Error handling
4. Success feedback

## 🎯 Key UX Improvements

1. **Clear Workflow**: Left → Center → Right progression
2. **Visual Hierarchy**: Important actions stand out
3. **Reduced Cognitive Load**: One task at a time
4. **Better Feedback**: Clear states and messages
5. **Mobile-First**: Touch-friendly, collapsible sections

## 📊 Success Metrics

- **Reduced Time to First Generation**: Target < 30 seconds
- **Error Rate**: Reduce by 50%
- **Mobile Usage**: Increase by 40%
- **User Satisfaction**: 4.5+ star rating

---

**Status**: 🟡 Design approved, ready for implementation  
**Priority**: 🔴 High - Improves core product experience  
**ETA**: 2-3 hours implementation time