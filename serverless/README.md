# Thumbor url hasher Lambda

A Lambda function example for hashing Thumbor urls.

## Configure

```
cp src/config.json.example src/config.json
```

Add your Thumbor url and security key to `src/config.json`.

### Modifying image sizes

You can change image sizes by modifying the `sizes` object of the hasher function in `src/handler.js`.

## Deploy

```
serverless deploy
# OR
npm run deploy
```

### Deploy handler function only

```
serverless deploy function -f handler
# OR
npm run deploy:f
```