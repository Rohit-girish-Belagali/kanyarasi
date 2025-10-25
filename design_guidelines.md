# Mood.ai Design Guidelines

## Design Approach

**Reference-Based Approach** drawing inspiration from:
- **ChatGPT/Claude**: Clean chat interface patterns, message threading, input handling
- **Calm/Headspace**: Soothing emotional design, soft interactions, calming presence
- **Google Assistant**: Voice visualization patterns, conversational UI elements
- **Linear**: Minimalist productivity UI, focused task management, elegant simplicity

**Core Principle**: Create a dual-personality interface that feels warm and supportive in Emotional Mode, and crisp and efficient in Secretary Mode, while maintaining visual continuity.

---

## Typography System

**Font Stack** (Google Fonts via CDN):
- **Primary**: Inter (UI, body text, chat messages)
- **Accent**: Crimson Pro (headings, mode titles, emotional emphasis)

**Type Scale**:
- **Hero/Mode Titles**: text-4xl to text-5xl, font-medium (Crimson Pro)
- **Chat Messages (AI)**: text-base, font-normal, leading-relaxed
- **Chat Messages (User)**: text-base, font-normal, leading-relaxed
- **Labels/Metadata**: text-sm, font-medium
- **Timestamps**: text-xs, opacity-60
- **Calendar Events**: text-sm to text-base
- **Voice Status**: text-lg, font-medium

---

## Layout System

**Spacing Primitives**: Use Tailwind units of **2, 4, 8, 12, 16** (e.g., p-2, m-4, gap-8, py-12, px-16)

**Primary Layout Structure**:
```
Full-height viewport layout (h-screen) with three vertical zones:

1. Header Bar (h-16): Fixed top, contains mode toggle, settings icon
2. Main Content Area (flex-1): Scrollable chat messages + calendar sidebar
3. Input Zone (h-20 to h-24): Fixed bottom, voice/text input controls
```

**Desktop Layout** (lg: breakpoint):
- Two-column split: 60% chat + 40% calendar sidebar
- Sidebar shows upcoming tasks/goals in list format
- gap-8 between columns

**Mobile Layout** (base):
- Single column, full-width chat
- Calendar accessible via slide-up panel or separate tab
- Stack all elements vertically with py-4 spacing

**Container Constraints**:
- Max width for chat messages: max-w-3xl centered
- Calendar sidebar: full-width within its column
- Overall app container: w-full h-screen (no max-width, full viewport)

---

## Component Library

### 1. Mode Toggle Switch
**Location**: Top-right of header bar
**Structure**: Segmented control with two states
- "Emotional Support" | "Secretary Mode"
- Active state has elevated appearance (shadow-md)
- Smooth transition between states (transition-all duration-300)
- Text: text-sm, font-medium
- Padding: px-6 py-2
- Spacing between segments: gap-2

### 2. Chat Message Bubbles
**User Messages**:
- Align right (ml-auto, max-w-md)
- Rounded corners: rounded-2xl rounded-tr-sm
- Padding: px-4 py-3
- Spacing: mb-4

**AI Messages**:
- Align left (mr-auto, max-w-lg)
- Rounded corners: rounded-2xl rounded-tl-sm
- Padding: px-4 py-3
- Spacing: mb-4
- Include AI avatar circle (w-8 h-8, rounded-full) positioned top-left with ml-2 offset

**Timestamp**: 
- Below bubble, text-xs, opacity-60, px-4

### 3. Voice Visualization
**Location**: Center of input zone when voice is active
**Structure**:
- Circular pulse animation container (w-16 h-16)
- Nested circles with opacity-20, opacity-40, opacity-60 for wave effect
- Icon: Heroicons microphone-solid in center (w-6 h-6)
- Animate pulse with: animate-pulse and scale transformations
- Label below: "Listening..." or "Speaking..." (text-sm, font-medium)

### 4. Input Controls
**Text Input Bar**:
- Full width with max-w-3xl centered
- Height: h-12
- Rounded: rounded-full
- Padding: px-6 py-3
- Placeholder: "Type a message or press the mic..."

**Voice Button**:
- Positioned right side of input bar (absolute positioning)
- Circular: w-12 h-12, rounded-full
- Icon: Heroicons microphone (w-5 h-5)
- Shadow on hover: hover:shadow-lg

**Send Button**:
- Positioned right of input (if text present)
- Circular: w-10 h-10, rounded-full
- Icon: Heroicons paper-airplane (w-4 h-4)

### 5. Calendar Sidebar
**Header**:
- "Your Goals & Tasks" title (text-2xl, font-medium, Crimson Pro)
- Padding: px-6 py-8

**Event Cards**:
- Full-width cards with subtle border (border, rounded-lg)
- Padding: p-4
- Spacing between cards: gap-4
- Structure per card:
  - Time badge (text-xs, px-2 py-1, rounded-full) - top-right
  - Event title (text-base, font-medium)
  - Event description (text-sm, opacity-80)
  - Quick action icons (edit, delete) - hover reveal (Heroicons: pencil, trash)

**Add Task Button**:
- Full-width at bottom of list
- Height: h-10
- Rounded: rounded-lg
- Text: "+ Add Task" (text-sm, font-medium)
- Icon: Heroicons plus-circle

### 6. Mode Indicator Banner
**Location**: Below header, full-width, dismissible
**Structure**:
- Height: h-12
- Padding: px-6
- Flex layout with icon left, text center, close right
- Icons: Heroicons heart (Emotional) or calendar (Secretary)
- Text examples:
  - "Emotional Support Mode: I'm here to listen"
  - "Secretary Mode: Let's organize your day"

### 7. Settings Panel (Slide-over)
**Trigger**: Gear icon in header
**Structure**:
- Slide from right (w-80 on desktop, full-width mobile)
- Sections with dividers (divide-y)
- **Tone Controls**: Radio buttons for Friendly/Motivational/Formal/Neutral
- **Language**: Dropdown with auto-detect option
- **Voice Settings**: Toggle for auto-voice, voice speed slider
- Padding: p-6
- Section spacing: space-y-6

### 8. Empty States
**No Messages**:
- Centered in chat area
- Large icon: Heroicons chat-bubble-left-right (w-16 h-16, opacity-20)
- Heading: "Start a conversation" (text-2xl, font-medium, Crimson Pro)
- Subtext: "Say hello or ask me anything..." (text-base, opacity-60)
- Suggested prompts as clickable chips (rounded-full, px-4 py-2, text-sm)

**No Tasks**:
- Icon: Heroicons calendar-days (w-12 h-12, opacity-20)
- Text: "No tasks yet" (text-lg, font-medium)
- CTA: "Add your first goal" button

---

## Icons

**Library**: Heroicons via CDN (outline for inactive states, solid for active states)

**Key Icons**:
- Microphone, microphone-solid (voice input)
- Paper-airplane (send message)
- Cog-6-tooth (settings)
- Heart (Emotional Mode)
- Calendar (Secretary Mode)
- Plus-circle (add task)
- Pencil, trash (edit, delete)
- Chat-bubble-left-right (empty chat)
- X-mark (close, dismiss)

---

## Spacing & Rhythm

**Vertical Rhythm**:
- Header: py-4
- Chat message area: py-8, scrollable with smooth scroll behavior
- Individual messages: mb-4
- Calendar sidebar: py-8
- Input zone: py-4

**Horizontal Spacing**:
- Page margins: px-4 (mobile), px-8 (desktop)
- Component internal padding: p-4 to p-6
- Button padding: px-6 py-2 to px-8 py-3

**Gaps**:
- Between columns: gap-8 (desktop)
- Between list items: gap-4
- Between sections: gap-12

---

## Accessibility

- All interactive elements have minimum touch target of 44×44px
- Form inputs maintain consistent height (h-12) and padding (px-6)
- Focus states use ring-2 ring-offset-2 pattern
- Text maintains minimum 4.5:1 contrast ratio (enforced via opacity levels)
- Voice status clearly announced with text labels, not just visual indicators
- Keyboard navigation: Tab through all controls, Enter to submit, Esc to close panels

---

## Animations

**Minimal & Purposeful** (use sparingly):
- Voice pulse: animate-pulse on microphone circle when active
- Mode toggle: transition-all duration-300 for smooth switching
- Message entry: slide-up with opacity fade (animate-in utility)
- Panel slides: translate-x transitions with duration-300
- **No** hover animations, **no** complex scroll effects

---

## Responsive Breakpoints

**Mobile (base)**: 
- Single column
- Full-width chat
- Calendar as bottom sheet or separate view
- Stack input controls vertically if needed

**Tablet (md:)**: 
- Begin two-column layout if space permits
- Calendar can be sidebar or toggled overlay

**Desktop (lg:)**: 
- Full two-column: 60-40 split
- Calendar always visible
- Spacious padding (px-12, py-8)

---

## Images

**No hero images** for this application. The interface is purely functional/conversational.

**AI Avatar**: Small circular avatar (w-8 h-8) next to AI messages - can be a placeholder gradient or initial "M" for Mood.ai

**Icons Only**: All visual elements use Heroicons, no photography or illustrations needed.

---

## Key UX Patterns

1. **Voice-First Interaction**: Large, accessible microphone button, clear visual feedback during recording
2. **Context Awareness**: Mode indicator always visible, smooth transitions between modes
3. **Progressive Disclosure**: Calendar sidebar collapses on mobile, settings in slide-over panel
4. **Conversational Flow**: Messages auto-scroll to bottom, typing indicators for AI responses
5. **Quick Actions**: Event cards show edit/delete on hover, suggested prompts for quick replies

This design creates a calming yet functional space where users can seamlessly switch between emotional support and productivity, with voice as the primary interaction method supported by clean visual hierarchy.