# 🚀 Quick Reference: Publishing Your NPM Package

## ✅ Pre-Flight Checklist

- [x] Package built successfully (`npm run build`)
- [x] All TypeScript files compiled to `dist/`
- [x] Package.json configured with proper exports
- [x] LICENSE file created (MIT)
- [x] README.md ready (use NPM_README.md)
- [x] .npmignore configured
- [x] Examples created and documented

## 📦 Package Info

```
Name:    @prakarsh/rate-limiter
Version: 1.0.0
Size:    33.1 kB (packed)
Files:   99 files
```

## 🎯 Publishing Commands

### 1. First Time Setup

```bash
# Login to npm (one time)
npm login
```

### 2. Publish Package

```bash
# Publish to npm
npm publish --access public
```

### 3. Verify Publication

```bash
# Check on npm
open https://www.npmjs.com/package/@prakarsh/rate-limiter

# Test installation
npm install @prakarsh/rate-limiter
```

## 🔄 Future Updates

### Update Version

```bash
npm version patch  # 1.0.0 -> 1.0.1 (bug fixes)
npm version minor  # 1.0.0 -> 1.1.0 (new features)
npm version major  # 1.0.0 -> 2.0.0 (breaking changes)
```

### Rebuild and Republish

```bash
npm run build
npm publish --access public
git push --tags
```

## 📚 Documentation Files

- **NPM_README.md** → Copy to README.md for npm
- **PUBLISHING.md** → Detailed publishing guide
- **NPM_TRANSFORMATION_SUMMARY.md** → What changed
- **examples/README.md** → How to use examples

## 🎨 Usage Examples

### Install

```bash
npm install @prakarsh/rate-limiter
```

### Express

```javascript
import { createExpressMiddleware } from "@prakarsh/rate-limiter/middleware/express";

app.use(
  createExpressMiddleware({
    limit: 100,
    window: 3600,
    keyExtractor: (req) => req.ip,
  }),
);
```

### Fastify

```javascript
import { createFastifyPlugin } from "@prakarsh/rate-limiter/middleware/fastify";

fastify.register(createFastifyPlugin, {
  limit: 100,
  window: 3600,
});
```

### Direct Client

```javascript
import { RateLimiterClient } from "@prakarsh/rate-limiter";

const client = new RateLimiterClient("http://localhost:3000");
const result = await client.check({
  key: "user:123",
  limit: 100,
  window: 3600,
});
```

### CLI (Global Install)

```bash
npm install -g @prakarsh/rate-limiter
rate-limiter
```

## 🎯 What Makes This Better Than Cloning?

| Users Need To... | Clone Repo            | NPM Package       |
| ---------------- | --------------------- | ----------------- |
| Install          | `git clone` + setup   | `npm install`     |
| Configure        | Manual .env setup     | Works immediately |
| Deploy           | Separate deployment   | Embedded in app   |
| Update           | `git pull` + redeploy | `npm update`      |
| Time to use      | 30+ minutes           | 30 seconds        |

## 🌟 Post-Publishing Checklist

After publishing:

- [ ] Update GitHub README with npm badge
- [ ] Add npm link to repository description
- [ ] Tweet about your package
- [ ] Post on LinkedIn
- [ ] Share on Dev.to
- [ ] Submit to Reddit (r/node, r/javascript)
- [ ] Add to your portfolio

## 🔗 Important Links

- **npm Package**: https://www.npmjs.com/package/@prakarsh/rate-limiter
- **GitHub Repo**: https://github.com/PrakarshSingh5/rate-limiter-service
- **npm Profile**: https://www.npmjs.com/~prakarsh

## 💡 Pro Tips

1. **Test before publishing**: Use `npm pack --dry-run`
2. **Semantic versioning**: Follow semver.org
3. **Changelog**: Keep a CHANGELOG.md
4. **CI/CD**: Automate publishing with GitHub Actions
5. **Monitor**: Track downloads on npm-stat.com

## 🚨 Common Issues

### "Package name already exists"

→ Use a scoped package: `@yourname/package-name`

### "402 Payment Required"

→ Add `--access public` flag

### "You must verify your email"

→ Check npm account email

### Build errors

→ Run `npm install && npm run build`

## 🎊 Ready to Publish?

Just run:

```bash
npm publish --access public
```

That's it! Your package will be live on npm in seconds! 🚀

---

**Need more details?** Check `PUBLISHING.md` for the complete guide.
