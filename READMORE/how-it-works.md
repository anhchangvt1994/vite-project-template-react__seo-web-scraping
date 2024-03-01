[< Back](../README.md)

## How it works

Not same Nuxt, Next or other meta frameworks you known before. In this project, the HTML document content with styles that you see will different document content Search Engine see. That means, the users can not see real style of content that Search Engine see. The content with no script, no style and optimized for SEO.

### What are difference ?

When an client sends a request to a server, the server will detect that client is a real User or Bot.

- If client is a real User, the server will normal send to client a response include `index.html` content, after archive that content, client will start a process called `Client Side Rendering (CSR)`
- If client is a Bot, the server will do the `Incremental Static Regeneration (ISR)` process. That process includes `Server Side Rendering (SSR)` -> Cache (will be renewed after 3 minutes and removed after 6 hours if activity timing > 6 hours) -> send a response with full content cached.

> In this project, the ISR process also has a nice feature called `Auto Optimize SEO`, the content after `SSR` will be scanned and optimized to show the best of friendly content for Bot.

> You can see the content what Bot see by using tab `network condition` and change the `user agent` to `GoogleBot`.
