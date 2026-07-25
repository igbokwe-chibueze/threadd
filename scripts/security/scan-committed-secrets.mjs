import { spawnSync } from "node:child_process";

/*
 * This scanner intentionally reports only revision/path pairs, never matching
 * text. If a real credential is discovered, CI logs must not become another
 * place where that credential is copied.
 *
 * High-confidence patterns are assembled from fragments so this source file
 * does not match its own rules when `git grep` scans the repository.
 */
const patterns = [
  ["-----BEGIN ", "(RSA |EC |OPENSSH )?PRIVATE KEY-----"].join(""),
  ["gh", "[pousr]_[A-Za-z0-9]{30,}"].join(""),
  ["github_", "pat_[A-Za-z0-9_]{40,}"].join(""),
  ["AKIA", "[0-9A-Z]{16}"].join(""),
  ["sk_", "live_[A-Za-z0-9]{16,}"].join(""),
  ["sk_", "test_[A-Za-z0-9]{24,}"].join(""),
];
const combinedPattern = `(${patterns.join("|")})`;

function runGit(argumentsList, allowNoMatches = false) {
  const result = spawnSync("git", argumentsList, {
    encoding: "utf8",
    windowsHide: true,
  });
  if (result.status === 0) return result.stdout.trim();
  if (allowNoMatches && result.status === 1) return "";
  throw new Error(
    `Secret scan could not run git ${argumentsList[0]} (exit ${result.status ?? "unknown"}).`,
  );
}

const revisions = runGit(["rev-list", "--all"]).split(/\r?\n/).filter(Boolean);
const findings = new Set();

/*
 * `git grep -l` emits filenames only. Walking every reachable revision catches
 * a secret that was deleted from the current branch but remains recoverable in
 * repository history.
 */
for (const revision of revisions) {
  const paths = runGit(
    ["grep", "-I", "-l", "-E", combinedPattern, revision, "--"],
    true,
  );
  for (const path of paths.split(/\r?\n/).filter(Boolean)) findings.add(path);
}

// Scan tracked working-tree content as well, including changes not committed yet.
const currentPaths = runGit(
  ["grep", "-I", "-l", "-E", combinedPattern, "--"],
  true,
);
for (const path of currentPaths.split(/\r?\n/).filter(Boolean)) {
  findings.add(`working-tree:${path}`);
}

if (findings.size > 0) {
  process.stderr.write(
    `Potential committed secret patterns were found in:\n${[...findings]
      .sort()
      .map((path) => `- ${path}`)
      .join("\n")}\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Committed-secret scan passed across ${revisions.length} reachable revision${revisions.length === 1 ? "" : "s"}.\n`,
  );
}
