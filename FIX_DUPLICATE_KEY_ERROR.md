# Fix for E11000 Duplicate Key Error (ISS-1)

## Problem
The backend was throwing an E11000 duplicate key error when creating multiple Epics:
```
E11000 duplicate key error collection: pm_tool.issues index: key_1 dup key: { key: "ISS-1" }
```

## Root Cause
The original `generateIssueKey()` function used a **non-atomic** count approach:
```typescript
const count = await this.issueModel.countDocuments({...}).exec();
return `ISS-${count + 1}`;
```

When multiple requests arrived simultaneously (race condition), they all got the same count and generated the same key (e.g., "ISS-1"), causing MongoDB to reject the duplicate.

## Solution
Implemented an **atomic counter pattern** using a dedicated `Counter` collection with MongoDB's `findOneAndUpdate` operation:

### Changes Made:

1. **Created Counter Schema** (`src/issue/schemas/counter.schema.ts`)
   - New schema for storing atomic counters per project
   - Uses `counterId` field as unique identifier
   - MongoDB's `findOneAndUpdate` with `$inc` operator ensures atomicity

2. **Updated IssueService** (`src/issue/issue.service.ts`)
   - Injected the new Counter model
   - Replaced `generateIssueKey()` to use atomic counter:
   ```typescript
   const counterId = `issue_counter_${projectId}`;
   const counter = await this.counterModel.findOneAndUpdate(
     { counterId: counterId },
     { $inc: { sequence: 1 } },
     { new: true, upsert: true },
   );
   return `ISS-${counter.sequence}`;
   ```

3. **Updated IssueModule** (`src/issue/issue.module.ts`)
   - Registered Counter schema in MongooseModule

## Why This Works
- `findOneAndUpdate` is atomic - only ONE request gets each sequence number
- `upsert: true` creates counter if it doesn't exist
- `$inc: { sequence: 1 }` atomically increments by 1
- MongoDB guarantees no race conditions at the database level

## Testing
After deploying:
1. Clear existing duplicate issues from the database (optional)
2. Create multiple Epics in quick succession
3. Each Epic should get a unique key: ISS-1, ISS-2, ISS-3, etc.
4. No more E11000 errors

## Database Cleanup (Optional)
If you want to start fresh with counters:
```bash
# Connect to MongoDB
mongosh "mongodb://admin:admin123@localhost:27017/pm-tool?authSource=admin"

# Delete old duplicate issues or reset if needed
db.issues.deleteMany({ /* your filter */ })
db.counters.deleteMany({})
```

## Deployment Steps
1. ✅ Build: `npm run build` (already done)
2. Restart the API service
3. Test creating Epics from the frontend
