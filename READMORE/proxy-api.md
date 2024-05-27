[< Back](../README.md)

## What is Proxy API ?
The Proxy API is a peach of middleware service used to improve the performance of API request from server to client.
A few of main benefits that a Proxy API can have :
- Caching
This benefit provides caching ability to cache response data from other server. By using `Caching`, we can make the request and response API be better by decrease the response timing.
- Store
IF the `Caching` benefit help to cache the response data and save the response time. The `Store` benefit provides the store data ability, used to speed up the client-side rendering that have to wait data to render from server response.
> To use `Store` benefit, you must enable the `Cache` benefit too.

## How to use Proxy API ?

#### Client
> First and importance to use the Proxy API at the client-side that you need to generate a proxy API endpoint with options hashed and set it into a query-string named `requestInfo`.
> Example:
> /api?requestInfo=\< hashed option \>

In this project, I have already prepared the endpoint generator method for you. So to use Proxy API at the client-side, we just need to follow the below step by step guide.

1. Go to `src/utils/ProxyAPIHelper/EndpointGenerator.ts` to generate an initial for the `Proxy API` end generator.

```javascript
// src/utils/ProxyAPIHelper/EndpointGenerator.ts
export const ProxyAPIExample_v1 = ProxyAPI.init({
  targetBaseUrl: 'http://localhost:3000/api',
})
```

2. Generate `Proxy API Endpoint (PAE)` using the initial Proxy API endpoint generator created before.

```javascript
import { ProxyAPIExample_v1 } from 'utils/ProxyAPIHelper/EndpointGenerator.ts'

const limit = 10

// In case the data is already cached and stored before, we can use `getAPIStore(<cacheKey>)` to get and render data fastest.
/**
 * NOTE - The `render` method just an method represents how to render of JS frameworks
 * Example:
 * - Using ReactJS :
 * 1 const [state, setState] = useState(getAPIStore(<cacheKey>))
 * 2 fetch( ... ).then(async res => setState(await res.json()))
 * - Using VueJS :
 * 1 const state = ref(getAPIStore(<cacheKey>))
 * 2 fetch( ... ).then(async res => { state.value = ref(await res.json())) })
*/
render(getAPIStore(`/users?limit=${limit}`))

// In this example, I use fetch to make request to API
fetch(
  ProxyAPIExample_v1.get(`/users?limit=${limit}`, {
    /**
     * optional
     * default: 0 (no cache)
     * The valid of duration time that cache can exist
     */
    expiredTime: 10000,
    /**
     * optional
     * default: undefined (no cache)
     * The key of cache, it should be unique
     */
    cacheKey: `/users?limit${limit}`,
    /**
     * optional
     * default: false (no store)
     * Enable to `Store` the cache data, to speed up rendering
     */
    enableStore: true,
    /**
     * optional
     * default: undefined (use same cache in all device)
     * Maybe you need to split the cache data to `Store` base on the device, Example in Desktop you need to get and show 10 users but just 5 users in mobile
     */
    storeInDevice: DeviceInfo.type,
    /**
     * optional
     * default: []
     * Maybe you need to refresh the list of cache after data updated, this config often use for add, edit, remove feature
     */
    relativeCacheKey: ['/users/1'],
  }
),
{
method: 'GET',
headers: new Headers(
  {
    Accept: 'application/json',
  }
),
// body: JSON.stringify({ test: 1, user: 2 }),
}
).then(async (res) => {
  const data = await res.json()
  render(data)
})
```

#### Server

At the current, We can config the secret API key for the target API endpoint in `server.config.ts`

```javascript
// server/src/server.config.ts
import { defineServerConfig } from './utils/ServerConfigHandler'

const ServerConfig = defineServerConfig({
  /* optional */
  api: {
    list: {
      /* this mean, the base url 'http://localhost:3000/api'
      will have
        - the 'secretKey' is 'xxx'
        - the 'headerSecretKeyName' is 'API-Key'
      */
      'http://localhost:3000/api': {
        secretKey: 'xxx'
        headerSecretKeyName: 'API-Key'
      },

      /* this mean, the base url 'http://localhost:3001/api'
      will have
        - the 'secretKey' is 'abc'
        - the 'headerSecretKeyName' is 'Authorization'
        as default
      */
      'http://localhost:3001/api': 'abc'
    }
  }
})
```
