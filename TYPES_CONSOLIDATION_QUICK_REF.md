# ⚡ Types Consolidation - Quick Reference

## 🚨 When You See Duplicate Type Names

Go to: `http://localhost:3001/jana/types`

Look for: **⚠️ Alert Panel at Top**
```
⚠️ 2 Duplicate Type Names Detected
"Hotel" (3 types): hotel • hotel2 • hotel3
[✨ Consolidate Now]
```

## 🔄 How to Consolidate

1. Click **[✨ Consolidate Now]** button
2. Select which type ID becomes the parent
3. Review what will be updated
4. Click **✨ Consolidate Types**
5. Done! All dependencies auto-updated

## ✅ What Gets Updated Automatically

When you consolidate duplicate types:
- ✅ Type hierarchy (duplicates become children)
- ✅ Businesses table (reassign to parent)
- ✅ Form fields (update references)
- ✅ Card templates (update references)
- ✅ Orchestrator configs (update components)
- ✅ Activity log (audit trail)
- ✅ Cache (refresh)

## 🛡️ Validation Rules

| Action | Rule |
|--------|------|
| Create Type | Name must be unique |
| Update Type | Name must be unique (except own) |
| Make Child | Must select a parent |
| Consolidate | Parent must exist |

## 📊 Quick API Reference

### Check for Duplicates
```bash
curl http://localhost:3001/api/jana/types/verify/duplicates
```

### Consolidate Types
```bash
curl -X POST http://localhost:3001/api/jana/types/consolidate \
  -H "Content-Type: application/json" \
  -d '{
    "parentTypeId": "hotel",
    "childTypeIds": ["hotel2", "hotel3"],
    "action": "merge"
  }'
```

## 🔧 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Type name already exists" | Use consolidation to merge them |
| Consolidation fails | Check if parent exists & has businesses |
| Dependencies not updated | Check activity log for errors |
| Can't create new type | Name already taken - consolidate first |

## 📍 Key Files

- **Admin UI**: `/app/jana/types/page.tsx`
- **API Routes**: `/api/jana/types/route.ts`
- **Consolidation**: `/api/jana/types/consolidate/route.ts`
- **Detection**: `/api/jana/types/verify/duplicates/route.ts`
- **Docs**: `TYPES_UNIQUENESS_CONSOLIDATION.md`

## 🎯 Common Scenarios

### Scenario 1: Same Name, Different ID
```
Problem: "Hotel" exists as both "hotel" and "hotel_old"
Solution: Consolidate (choose one as parent)
```

### Scenario 2: Accidental Duplication  
```
Problem: Created "Restaurant" twice by mistake
Solution: Consolidate (old one becomes child of new one)
```

### Scenario 3: Legacy Type Cleanup
```
Problem: Old "hotel_v1", "hotel_v2", "hotel_v3" all with same name
Solution: Consolidate all under "hotel"
```

## 💡 Best Practices

1. **Unique Names**: Always use different names for different types
2. **Regular Checks**: Run `/api/jana/types/verify/duplicates` monthly
3. **Before Updates**: Verify no duplicates before major releases
4. **Activity Log**: Review consolidations in activity_log
5. **Archive Old**: Consolidate legacy types before deleting

## 📱 Mobile Admin Access

- Type Manager: `http://localhost:3001/jana/types`
- API Test: `http://localhost:3001/api/jana/types`
- Duplicate Check: `http://localhost:3001/api/jana/types/verify/duplicates`

## 🔐 Admin-Only Features

All endpoints require admin authentication:
- ✓ Detect duplicates
- ✓ Consolidate types
- ✓ Create/Edit/Delete types
- ✓ View activity logs

---

**Last Updated**: May 29, 2026
**Status**: Production Ready ✅
