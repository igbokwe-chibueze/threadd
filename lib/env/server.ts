import "server-only";

import { parseServerEnvironment } from "./schema";

export const serverEnvironment = parseServerEnvironment(process.env);
