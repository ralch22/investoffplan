import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const CACHE_CONTROL = "public, max-age=31536000, immutable";

export function getAssetsBucketName(wranglerConfigPath: string): string {
  const raw = readFileSync(wranglerConfigPath, "utf8");
  const match = raw.match(
    /"binding"\s*:\s*"ASSETS_R2_BUCKET"[\s\S]*?"bucket_name"\s*:\s*"([^"]+)"/,
  );
  if (!match?.[1]) {
    throw new Error(`ASSETS_R2_BUCKET bucket_name not found in ${wranglerConfigPath}`);
  }
  return match[1];
}

export function putRemoteObject(opts: {
  bucketName: string;
  key: string;
  filePath: string;
  contentType: string;
  cwd: string;
  wranglerConfigPath: string;
}) {
  const { bucketName, key, filePath, contentType, cwd, wranglerConfigPath } = opts;
  const accountId = getAccountId(wranglerConfigPath);
  execFileSync(
    "npx",
    [
      "wrangler",
      "r2",
      "object",
      "put",
      `${bucketName}/${key}`,
      "--remote",
      `--file=${filePath}`,
      `--content-type=${contentType}`,
      `--cache-control=${CACHE_CONTROL}`,
    ],
    {
      cwd,
      stdio: ["ignore", "pipe", "inherit"],
      env: {
        ...process.env,
        CLOUDFLARE_ACCOUNT_ID: accountId,
      },
    },
  );
}

export function remoteObjectExists(opts: {
  bucketName: string;
  key: string;
  cwd: string;
  wranglerConfigPath: string;
}): boolean {
  const { bucketName, key, cwd, wranglerConfigPath } = opts;
  const accountId = getAccountId(wranglerConfigPath);
  try {
    const out = execFileSync(
      "npx",
      [
        "wrangler",
        "r2",
        "object",
        "list",
        bucketName,
        `--prefix=${key}`,
        "--remote",
        "--limit=1",
        "--json",
      ],
      {
        cwd,
        stdio: ["ignore", "pipe", "ignore"],
        env: {
          ...process.env,
          CLOUDFLARE_ACCOUNT_ID: accountId,
        },
        encoding: "utf8",
      },
    );
    const parsed = out ? JSON.parse(out) : [];
    const items = Array.isArray(parsed) ? parsed : [];
    return items.some((item: any) => (item.key || item.name) === key);
  } catch {
    return false;
  }
}

function getAccountId(wranglerConfigPath: string): string {
  const raw = readFileSync(wranglerConfigPath, "utf8");
  const match = raw.match(/"account_id"\s*:\s*"([^"]+)"/);
  if (!match?.[1]) {
    throw new Error(`account_id not found in ${wranglerConfigPath}`);
  }
  return match[1];
}

export function writeTempAssetFile(
  rootDir: string,
  key: string,
  body: ArrayBuffer,
): string {
  const dir = join(rootDir, ".tmp", "asset-migration");
  mkdirSync(dir, { recursive: true });
  const safeName = key.replace(/\//g, "__");
  const filePath = join(dir, safeName);
  writeFileSync(filePath, Buffer.from(body));
  return filePath;
}