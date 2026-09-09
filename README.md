# WKND Adventures

AEM Edge Delivery Services site for WKND Adventures — dual authoring (Document Authoring + Universal Editor), built on [ise-boilerplate](https://github.com/aemdemos/ise-boilerplate).

Design reference (original static site): https://aemxsc.github.io/wknd-ema/ (source repo: [AEMXSC/wknd-ema](https://github.com/AEMXSC/wknd-ema))

## Environments
- Preview: https://main--wknd-adventures--aemxsc.aem.page/
- Live: https://main--wknd-adventures--aemxsc.aem.live/

## Onboarding (one-time)
1. Install the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) on `AEMXSC/wknd-adventures`.
2. Configure the content mount + paths at https://tools.aem.live/ (fstab.yaml is retired; config lives in configbus).
3. Set up the DA site at https://da.live/ under `AEMXSC/wknd-adventures`.

## Local development
```sh
npm install
npx -y @adobe/aem-cli up --no-open --forward-browser-logs   # http://localhost:3000
```

## Migration status
WKND content (11 root pages + 10 blog posts) is being migrated onto standard EDS blocks. Content source of truth is the structured JSON in the wknd-ema repo (`data/pages/*.json`, `data/blog/*.json`).

See [AGENTS.md](AGENTS.md) for the full development and migration workflow.
