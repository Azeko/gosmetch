# Repository Guidelines

## Public repository

This is a public repository. Do not commit personal information, credentials,
secrets, private endpoints, private keys, access tokens, or machine-specific
paths.

- Use clearly fictional or anonymized values in examples, fixtures, logs, and
  screenshots.
- Use environment variables and ignored local files for secrets and local
  configuration.
- Provide safe placeholder values in tracked example configuration files.
- Review staged changes for sensitive data before committing.

## Work tracking

- Reference a GitHub issue in every change. Use gh cli.
- Use a dedicated issue branch and worktree.
- Include the full issue reference in each commit message, for example:
  `Refs Azeko/gosmetch#1`.
- Submit changes through a pull request linked to the issue.
