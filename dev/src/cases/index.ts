import type { Case } from "../lib/case";
import { defaultCase } from "./1-default";
import { organicCase } from "./2-organic";

/** Every case, data-only (no JSX) so `scripts/dev-report-grid.ts` can import this same array
 * without a browser or a React runtime. Add a case by pushing a `Case` here. */
export const cases: Case[] = [defaultCase, organicCase];
