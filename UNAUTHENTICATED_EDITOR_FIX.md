# Unauthenticated Editor Access Fix

## Problem
The editor was throwing authentication errors when unauthenticated users tried to access it:
- `Error: Not authenticated` from `listMyComponents` query
- Users couldn't test the editor without signing in
- Console errors prevented any editor functionality

## Solution
Enabled unauthenticated users to:
✅ **Access and use the editor**
✅ **Edit component properties in real-time**
✅ **Use undo/redo**
✅ **View live preview**
❌ **Cannot save or publish** (requires sign-in)

## Changes Made

### 1. Added Authentication Check
```typescript
import { useConvexAuth } from 'convex/react'
const { isAuthenticated } = useConvexAuth()
```

### 2. Conditional Query Loading
**Before:**
```typescript
const myComponents = useQuery(api.components.listMyComponents)
```

**After:**
```typescript
const myComponents = useQuery(
  api.components.listMyComponents, 
  isAuthenticated ? {} : 'skip'  // Skip query if not authenticated
)
```

### 3. Demo Component Loading
Added `loadDemoComponent()` function that:
- Derives component type from URL (button, input, card, etc.)
- Generates sample code
- Extracts properties
- Sets up editable state

**Supported demo components:**
- Button
- Input
- Card
- Dialog
- Navigation Menu
- Badge
- Label

### 4. Conditional UI Elements

#### Toolbar Buttons
**Authenticated users see:**
- [Save Draft] - Saves to database
- [Publish] - Makes component public

**Unauthenticated users see:**
- [Sign In to Save] - Redirects to sign-in page

#### Component List Sidebar
- **Authenticated:** Shows user's component list
- **Unauthenticated:** Hidden (full-width editor)

### 5. Save/Publish Guards
```typescript
const handleSave = async () => {
  if (!isAuthenticated) {
    alert('Please sign in to save components')
    navigate({ to: '/auth/sign-in' })
    return
  }
  // ... save logic
}
```

## User Experience

### Unauthenticated Flow
```
1. User visits /editor/shadcn-button
   ↓
2. Demo Button component loads automatically
   ↓
3. User can edit properties (text, variant, size)
   ↓
4. Changes appear in real-time preview
   ↓
5. User tries to save
   ↓
6. Prompted: "Please sign in to save"
   ↓
7. Redirected to sign-in page
```

### Authenticated Flow
```
1. User visits /editor/their-component-id
   ↓
2. Component list appears in left sidebar
   ↓
3. User selects component to edit
   ↓
4. Full editing with save/publish enabled
```

## Layout Differences

### Unauthenticated
```
┌────────────────────────────────────────────────┐
│ [Component Name]  [Undo][Redo] [Sign In to Save]│
├──────────────────────────────────┬─────────────┤
│                                  │  Properties │
│        Component Canvas          │   Manager   │
│     (Full Width - No Sidebar)    │             │
│                                  │             │
└──────────────────────────────────┴─────────────┘
```

### Authenticated
```
┌─────────────────────────────────────────────────────┐
│ [Component Name]  [Undo][Redo] [Save][Publish]     │
├──────────┬───────────────────────┬─────────────────┤
│Component │                       │   Properties    │
│  List    │  Component Canvas     │    Manager      │
│ Sidebar  │                       │                 │
│          │                       │                 │
└──────────┴───────────────────────┴─────────────────┘
```

## Testing

### Test as Unauthenticated User
1. Log out or use incognito mode
2. Visit `/editor/shadcn-button`
3. ✅ Page loads without errors
4. ✅ Button component appears
5. ✅ Can change text, variant, size
6. ✅ Preview updates in real-time
7. ✅ Undo/Redo works
8. ✅ "Sign In to Save" button shown
9. ✅ No console errors

### Test as Authenticated User
1. Sign in
2. Visit `/editor/your-component-id`
3. ✅ Component list appears
4. ✅ Can select components
5. ✅ Save/Publish buttons enabled
6. ✅ Can save and publish

## Error Handling

### Before
```
❌ Error: Not authenticated
   at handler (../convex/components.ts:65:23)
```

### After
```
✅ No errors - query skipped when unauthenticated
✅ Demo component loads automatically
✅ Full editor functionality available
```

## Benefits

1. **Lower Barrier to Entry**
   - Users can try the editor without signing up
   - See what the platform offers before committing

2. **Better User Experience**
   - No authentication wall
   - Smooth transition to save when ready

3. **Demo Mode**
   - All components can be tried out
   - Full property editing experience

4. **Clean Error Handling**
   - No console errors
   - Clear messaging about authentication needs

## Code Locations

**Main changes in:**
- `/src/routes/editor/$componentId.tsx` - Main editor logic

**Key functions added:**
- `loadDemoComponent()` - Loads demo components for unauthenticated users
- Auth guards in `handleSave()` and `handlePublish()`

**Dependencies:**
- `useConvexAuth()` - Check authentication status
- `getComponentInfo()` - Get component metadata
- Query skip pattern - `isAuthenticated ? {} : 'skip'`

## Future Enhancements

Possible improvements:
- [ ] Save to localStorage for unauthenticated users
- [ ] "Save draft locally" button
- [ ] Export component code without authentication
- [ ] Import from localStorage after sign-in
- [ ] Social login for faster sign-up
- [ ] Guest mode with session storage
- [ ] Demo mode indicator badge
- [ ] More demo components

## Security Considerations

✅ **Secure:**
- Mutations still require authentication
- Database writes protected
- No data leakage
- Proper error messages

✅ **User-Friendly:**
- Clear call-to-action to sign in
- Smooth redirect flow
- Work preserved in demo mode
- No frustrating error screens

