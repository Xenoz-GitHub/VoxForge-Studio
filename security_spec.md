# Security Specification (StoryVox Studio)

## Data Invariants
1. A `UserProfile` at `/users/{userId}` can only be read, created, or updated by the authenticated, email-verified user whose `request.auth.uid == userId`.
2. A `UserProfile` must contain exact schema fields (`uid`, `displayName`, `email`, `photoURL`, `communityConnected`, `createdAt`, `updatedAt`), with `uid == request.auth.uid` and server timestamps matching `request.time`.
3. A `GenerationRecord` at `/generations/{generationId}` must always belong to an authenticated, email-verified owner (`ownerId == request.auth.uid`), with bounded string sizes (`text <= 4000`, `style <= 1000`, `voiceName <= 80`) and bounded `emphasizedWords` (`<= 30`).
4. Users can never list `/users` globally or list `/generations` owned by other UIDs.

## Dirty Dozen Adversarial Payloads
1. Unauthenticated read/write to `/users/{uid}` -> `PERMISSION_DENIED`
2. Cross-user read (`get`) on `/users/{otherUid}` -> `PERMISSION_DENIED`
3. Global `list` on `/users` -> `PERMISSION_DENIED`
4. Shadow field injection (`isAdmin: true`) on `/users/{uid}` create/update -> `PERMISSION_DENIED`
5. Spoofed `uid` mismatch (`uid: "other"`) on `/users/{uid}` -> `PERMISSION_DENIED`
6. Unverified email (`email_verified: false`) write -> `PERMISSION_DENIED`
7. Client-forged `createdAt` timestamp not equal to `request.time` -> `PERMISSION_DENIED`
8. Unauthenticated `list` on `/generations` -> `PERMISSION_DENIED`
9. Cross-user `list` or `get` on `/generations/{id}` where `ownerId != request.auth.uid` -> `PERMISSION_DENIED`
10. Oversized `text` (> 4000 chars) or invalid `generationId` path -> `PERMISSION_DENIED`
11. Unbounded `emphasizedWords` array (> 30 entries) or non-string first element -> `PERMISSION_DENIED`
12. `GenerationRecord` update attempting to mutate `ownerId` or `createdAt` -> `PERMISSION_DENIED`
