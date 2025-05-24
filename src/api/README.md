# HMS API Client Library

A comprehensive TypeScript client library for the HMS API supporting all 8 modules with strong typing, error handling, and multi-environment support.

## Features

- ✅ **Complete API Coverage**: All 8 modules (Order, Nudge, KPI, Items, FollowUps, Challenge, Assessments, Activity)
- ✅ **Strong TypeScript Support**: Fully typed with enums and interfaces
- ✅ **Multi-Environment**: Separate clients for GOV, MKT, and MFE
- ✅ **Error Handling**: Advanced error processing and retry mechanisms
- ✅ **File Uploads**: Support for video, voice, and image uploads
- ✅ **Tree-Shaking**: Optimized for micro-frontend usage
- ✅ **Tenant Support**: Multi-tenant architecture support
- ✅ **Request Interceptors**: Authentication, logging, and retry logic

## Quick Start

### Basic Usage

```typescript
import { hmsApiClient } from './api/hms-api-client';

// Use the default client
const orders = await hmsApiClient.order.getUserOrders();
const challenges = await hmsApiClient.challenge.getChallenges();
```

### Environment-Specific Clients

```typescript
import { 
  createGovApiClient, 
  createMktApiClient, 
  createMfeApiClient 
} from './api/hms-api-client';

// Government client with enhanced logging
const govApi = createGovApiClient({ enableLogging: true });

// Marketing client with custom timeout
const mktApi = createMktApiClient({ timeout: 20000 });

// Micro-frontend client optimized for performance
const mfeApi = createMfeApiClient({ enableRetry: false });
```

### Tree-Shaking for Micro-Frontends

```typescript
// Import only what you need
import { OrderApiClient, createMinimalClient } from './api/modules';

// Or create a minimal client with specific modules
const api = createMinimalClient(config, ['auth', 'order', 'payment']);
```

## Module Overview

### 1. Order Module
Complete e-commerce functionality with checkout, payment, and order management.

```typescript
// Checkout flow
const session = await api.order.startCheckout({
  chainId: 123,
  items: [{ itemId: 1, quantity: 2 }],
  paymentMethodId: 'pm_123'
});

const order = await api.order.confirmOrder({
  sessionId: session.data.data.sessionId,
  paymentMethodId: 'pm_123'
});

// Execute order in protocol chain
await api.order.runOrder(order.data.data.id, 123);
```

### 2. Challenge Module
Interactive challenges with video recording and task management.

```typescript
// Start challenge
await api.challenge.runChallenge({
  challengeId: 1,
  chainId: 123,
  parameters: { difficulty: 'medium' }
});

// Record video
const videoFile = new File(['content'], 'video.mp4', { type: 'video/mp4' });
const response = await api.challenge.recordVideo(videoFile, 1);

// Complete task
await api.challenge.completeTask(456, { score: 85 });
```

### 3. Assessment Module
Survey and questionnaire system with dynamic forms.

```typescript
// Run assessment
await api.assessments.runAssessment(1, 123);

// Get questions and submit responses
const questions = await api.assessments.getQuestionsByAssessment(1);
const responses = questions.data.data.map(q => ({
  assessmentId: 1,
  questionId: q.id,
  textValue: 'Sample answer'
}));

await api.assessments.submitAssessment(1, responses);
```

### 4. Activity Module
Booking system for activities, appointments, and events.

```typescript
// Search activities
const activities = await api.activity.getRunningActivities({
  type: ActivityType.EXERCISE,
  available: true
});

// Make reservation
const reservation = await api.activity.setReservation({
  activityId: 1,
  startTime: '2024-01-15T10:00:00Z',
  endTime: '2024-01-15T11:00:00Z',
  participants: 1
});

// Confirm booking
await api.activity.confirmBooking({
  reservationId: reservation.data.data.id,
  paymentMethodId: 'pm_123'
});
```

### 5. FollowUps Module
Follow-up management with voice recording and timeline tracking.

```typescript
// Execute follow-up
await api.followUps.runFollowUp(123);

// Record voice
const audioFile = new File(['content'], 'audio.mp3', { type: 'audio/mp3' });
await api.followUps.recordVoice(audioFile, 1);

// Get timeline
const timeline = await api.followUps.getTimeline(123);
```

### 6. Nudge Module
Marketing automation with public check-in endpoints.

```typescript
// Create nudge with image
const imageFile = new File(['content'], 'image.jpg', { type: 'image/jpeg' });
const nudge = await api.nudge.createNudge({
  name: 'Daily Reminder',
  description: 'Health check reminder',
  protocolId: 123,
  chainId: 456,
  settings: {
    frequency: 'daily',
    channels: ['email', 'sms']
  },
  image: imageFile
});

// Public check-in (no auth required)
await api.nudge.emailCheckin('user@example.com', {
  nudgeId: 1,
  response: 'Feeling great!'
});
```

## Error Handling

### Basic Error Handling

```typescript
import { getErrorMessage } from './api/hms-api-client';

try {
  const order = await api.order.getOrder(123);
} catch (error) {
  console.error('Error:', getErrorMessage(error));
}
```

### Advanced Error Handling

```typescript
import { handleApiCall } from './api/hms-api-client';

const result = await handleApiCall(
  () => api.order.getOrder(123),
  (error) => {
    if (error.isNotFoundError()) {
      // Handle 404
    } else if (error.isValidationError()) {
      // Handle validation errors
      const fieldErrors = error.getSimplifiedValidationErrors();
    }
  }
);
```

## Configuration Options

```typescript
const api = createHmsApiClient({
  baseURL: 'https://api.example.com',
  timeout: 30000,
  enableLogging: true,
  enableRetry: true,
  maxRetries: 3,
  tenantId: 'tenant-123',
  environment: 'gov',
  headers: {
    'Custom-Header': 'value'
  }
});
```

## Multi-Tenant Support

```typescript
const tenantApi = createHmsApiClient({
  baseURL: 'https://api.example.com',
  tenantId: 'tenant-abc',
  environment: 'gov'
});

// All requests will include X-Tenant-ID header
```

## Testing

Run the test suite:

```bash
npm test
```

The library includes comprehensive tests for:
- All API client methods
- Error handling scenarios
- Request interceptors
- Environment-specific configurations
- File upload functionality

## Bundle Size Optimization

For micro-frontends, use selective imports:

```typescript
// Instead of importing the full client
import { hmsApiClient } from './api/hms-api-client';

// Import only what you need
import { OrderApiClient, AuthApiClient } from './api/modules';
import { createMinimalClient } from './api/modules';

// This reduces bundle size significantly
const api = createMinimalClient(config, ['auth', 'order']);
```

## Migration Guide

### From Existing Client

If you're migrating from the existing API client:

1. **Update imports**:
   ```typescript
   // Old
   import { ItemsApiClient } from './api-client';
   
   // New
   import { hmsApiClient } from './api/hms-api-client';
   // or
   import { ItemsApiClient } from './api/modules';
   ```

2. **Use new module clients**:
   ```typescript
   // New modules now available
   await api.order.startCheckout(data);
   await api.challenge.recordVideo(file, challengeId);
   await api.assessments.runAssessment(id, chainId);
   ```

3. **Update error handling**:
   ```typescript
   // Old
   catch (error) { console.error(error.message); }
   
   // New
   import { getErrorMessage } from './api/hms-api-client';
   catch (error) { console.error(getErrorMessage(error)); }
   ```

## API Reference

See the `examples/usage-examples.ts` file for comprehensive usage examples of all modules and features.

## Contributing

When adding new endpoints:

1. Add types to the appropriate interface section
2. Implement the method in the corresponding client class
3. Add tests in `__tests__/hms-api-client.test.ts`
4. Update examples in `examples/usage-examples.ts`
5. Export new types in `modules/index.ts` for tree-shaking

## License

This library is part of the HMS platform and follows the same licensing terms.