[< Back](../README.md)

## What is BotInfo variable ?

<p><b>BotInfo</b> is a variable contains the Bot information which sent from server to client. You can use it to decide render / none render component if it is Bot / not Bot.</p>

```typescript
interface IBotInfo {
  isBot: boolean
  name: string
}
```

```typescript
if(BotInfo.isBot) {
  // do something
}
```
