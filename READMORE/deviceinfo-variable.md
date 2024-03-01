[< Back](../README.md)

## What is DeviceInfo variable ?

<p><b>DeviceInfo</b> is a variable contains the Device information which sent from server to client. You can use it to create adaptive website.</p>

```typescript
interface IDeviceInfo {
  type: string
  isMobile: string | boolean
  os: string
}
```

```typescript
if(DeviceInfo.isMobile) {
  // do something
}
```
