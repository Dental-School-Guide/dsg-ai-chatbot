# 🤖 Auto-Rename Conversations Feature

Conversations are automatically renamed based on chat content using Google AI after the user sends their second message!

## ✨ Features Implemented

### **1. Click Sidebar Chat → Load Conversation**
- ✅ Click any conversation in sidebar
- ✅ All messages load instantly
- ✅ Chat history preserved
- ✅ Scroll position maintained

### **2. New Chat Button**
- ✅ Click "New Chat" button at top of sidebar
- ✅ Clears current conversation
- ✅ Resets to welcome message
- ✅ Ready for fresh conversation

### **3. Auto-Rename with Google AI**
- ✅ After user sends **2nd message**
- ✅ Google AI analyzes conversation
- ✅ Generates descriptive title (max 50 chars)
- ✅ Updates conversation automatically
- ✅ Sidebar refreshes with new title

## 🔄 How It Works

### **Loading Conversations**

```typescript
// User clicks conversation in sidebar
onConversationSelect(conversationId)
  ↓
ChatInterface receives new conversationId
  ↓
Fetches messages from /api/conversations/{id}
  ↓
Converts Voltage format to UI format
  ↓
Displays all messages in chat
  ↓
Tracks user message count
```

### **Starting New Chat**

```typescript
// User clicks "New Chat" button
onNewChat()
  ↓
Sets conversationId to undefined
  ↓
ChatInterface detects change
  ↓
Resets to initial welcome message
  ↓
Clears current conversation ID
  ↓
Resets user message counter
  ↓
Ready for new conversation
```

### **Auto-Rename Flow**

```typescript
User sends 1st message
  ↓
Conversation created with first 50 chars as title
  ↓
User sends 2nd message
  ↓
Counter detects: userMessageCount === 2
  ↓
Calls /api/conversations/{id}/generate-title
  ↓
API fetches first 4 messages (2 exchanges)
  ↓
Google AI generates descriptive title
  ↓
Title updated in database
  ↓
Sidebar refreshes to show new title
```

## 📝 API Route: Generate Title

**Endpoint:** `POST /api/conversations/{id}/generate-title`

**What it does:**
1. Fetches first 4 messages from conversation
2. Formats them for Google AI
3. Asks AI to generate short title (max 50 chars)
4. Updates conversation title in database
5. Returns new title

**Example:**

```typescript
// Conversation messages:
// user: "What GPA do I need for dental school?"
// assistant: "Most dental schools require a minimum GPA of 3.0..."
// user: "What about DAT scores?"
// assistant: "The average DAT score for accepted students is..."

// Generated title:
"Dental School GPA and DAT Requirements"
```

## 🎯 User Experience

### **Before Auto-Rename:**
```
Sidebar shows:
- "What GPA do I need for dental school?"  (truncated)
- "How do I prepare for the DAT?"  (truncated)
- "Tell me about dental school interviews"  (truncated)
```

### **After Auto-Rename:**
```
Sidebar shows:
- "Dental School GPA Requirements"  ✨
- "DAT Preparation Guide"  ✨
- "Interview Tips and Strategies"  ✨
```

## 💡 Smart Title Generation

Google AI analyzes the conversation and creates titles that:
- ✅ **Capture the main topic** - What the conversation is about
- ✅ **Are concise** - Max 50 characters
- ✅ **Are descriptive** - Clear and meaningful
- ✅ **Remove fluff** - No quotes, no extra words
- ✅ **Are professional** - Proper capitalization

## 🔧 Technical Details

### **Message Counter**
```typescript
const [userMessageCount, setUserMessageCount] = useState(0);

// Increments after each user message
setUserMessageCount(prev => prev + 1);

// Resets when starting new chat
setUserMessageCount(0);

// Preserved when loading conversation
const userMsgCount = loadedMessages.filter(msg => msg.role === 'user').length;
setUserMessageCount(userMsgCount);
```

### **Title Generation Prompt**
```typescript
const prompt = `Based on this conversation, generate a short, descriptive title (max 50 characters). Only return the title, nothing else.

Conversation:
user: What GPA do I need for dental school?
assistant: Most dental schools require...
user: What about DAT scores?
assistant: The average DAT score...

Title:`;

// AI Response: "Dental School GPA and DAT Requirements"
```

### **Sidebar Refresh**
```typescript
// When title updates
onConversationTitleUpdated()
  ↓
setSidebarKey(prev => prev + 1)
  ↓
Sidebar remounts with key change
  ↓
Fetches fresh conversation list
  ↓
Shows updated title
```

## 📊 State Management

### **ChatInterface State**
```typescript
const [messages, setMessages] = useState<Message[]>([...]);
const [currentConversationId, setCurrentConversationId] = useState<string | undefined>();
const [userMessageCount, setUserMessageCount] = useState(0);
const [isLoading, setIsLoading] = useState(false);
```

### **Page State**
```typescript
const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
const [sidebarKey, setSidebarKey] = useState(0);
```

## 🎨 UI Behavior

### **Clicking Sidebar Conversation**
1. Conversation highlighted in gold
2. Chat area shows loading state
3. Messages load from database
4. Scroll to bottom
5. Ready to continue conversation

### **Clicking New Chat**
1. Sidebar selection clears
2. Chat resets to welcome message
3. Input ready for new message
4. No conversation ID yet

### **After Second Message**
1. Title generation happens in background
2. No UI blocking
3. Sidebar updates automatically
4. User can continue chatting

## ✅ Benefits

### **For Users:**
- 🎯 **Easy navigation** - Find conversations by meaningful titles
- 🚀 **No manual work** - Titles generated automatically
- 💡 **Clear organization** - Know what each chat is about
- ⚡ **Instant loading** - Click and chat loads immediately

### **For Development:**
- 🤖 **AI-powered** - Smart title generation
- 🔄 **Automatic** - No user action needed
- 📊 **Scalable** - Works for any conversation
- 🛡️ **Safe** - Background processing, no blocking

## 🚀 Testing

### **Test Scenario 1: Load Conversation**
1. Start app
2. See conversations in sidebar
3. Click any conversation
4. ✅ Messages load
5. ✅ Can continue chatting

### **Test Scenario 2: New Chat**
1. Click "New Chat" button
2. ✅ Chat clears
3. ✅ Welcome message shows
4. Send message
5. ✅ New conversation created

### **Test Scenario 3: Auto-Rename**
1. Start new chat
2. Send first message (e.g., "What GPA do I need?")
3. ✅ Conversation created with truncated title
4. Send second message (e.g., "What about DAT scores?")
5. ✅ Wait 2-3 seconds
6. ✅ Sidebar updates with AI-generated title
7. ✅ Title is descriptive and concise

## 🎉 Result

Your chat now has:
- ✅ **Click to load** - Any conversation from sidebar
- ✅ **New chat button** - Start fresh anytime
- ✅ **Auto-rename** - Smart titles after 2 messages
- ✅ **Google AI** - Intelligent title generation
- ✅ **Seamless UX** - Everything just works

All conversations are automatically organized with meaningful titles! 🚀
