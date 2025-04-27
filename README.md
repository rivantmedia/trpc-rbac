# @rivantmedia/trpc-rbac

A zero-dependency bitfield-based RBAC helper for tRPC (or any Node middleware).

## Install

```bash
npm install @rivantmedia/trpc-rbac@latest zod@latest @trpc/server@latest @trpc/client@latest
```

## Define Your Permission Flags

Create a subclass of `UserPermissions` in your app, giving it a `static Flags` map of bit-values:

```ts
// src/lib/permissions.ts
import { UserPermissions } from "@rivantmedia/trpc-rbac";

export class MyPermissions extends UserPermissions<"READ" | "WRITE" | "ADMIN"> {
	static Flags = {
		READ: 1 << 0,
		WRITE: 1 << 1,
		ADMIN: 1 << 2
	} as const;
}
```

## Extend trpc Context

Your context must supply three things:

1. `session` (from your auth system)
2. `getUserPermissions()` – an async fn returning an array of flag-keys the current user has
3. `UserPermissions` – the constructor of your subclass

```ts
// src/server/api/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "./auth"; // your auth helper
import { db } from "./db"; // your Prisma or DB client
import { MyPermissions } from "@/lib/permissions";
import type { MyPermissions as PermClass } from "@/lib/permissions";

export async function createTRPCContext({ req, res }: any) {
	const session = await auth(req, res); // e.g. next-auth
	return {
		db, // prisma client
		session, // may be null if not logged in
		getUserPermissions: async () => {
			if (!session?.user) return [];
			const user = await db.user.findUnique({
				where: { email: session.user.email },
				select: { perms: true } // assuming `perms` is []
			});
			const permissions = user?.perms.map((r) => r.permissionBitfield);
			return permissions;
		},
		UserPermissions: MyPermissions as typeof PermClass
	};
}
```

## Initialize trpc

```ts
// src/server/api/trpc.ts - countinuation

export const t = initTRPC.context<typeof createTRPCContext>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError:
					error.cause instanceof ZodError
						? error.cause.flatten()
						: null
			}
		};
	}
});

export const createCallerFactory = t.createCallerFactory;
export const createTRPCRouter = t.router;
```

## Define Base Procedures

```ts
// src/server/api/trpc.ts - countinuation

const timingMiddleware = t.middleware(async ({ next, path }) => {
	const start = Date.now();
	if (process.env.NODE_ENV === "development") {
		await new Promise((r) => setTimeout(r, Math.random() * 400 + 100));
	}
	const result = await next();
	console.log(`[tRPC] ${path} — ${Date.now() - start}ms`);
	return result;
});

export const publicProcedure = t.procedure.use(timingMiddleware);

// Use this or can define your own procedure
export const protectedProcedure = t.procedure
	.use(timingMiddleware)
	.use(({ ctx, next }) => {
		if (!ctx.session?.user) {
			throw new TRPCError({ code: "UNAUTHORIZED" });
		}
		return next({
			ctx: { ...ctx, session: { ...ctx.session, user: ctx.session.user } }
		});
	});
```

## Apply Permission Checks

Import and call `createPermissionProtectedProcedure` at the point you define a protected mutation/query:

```ts
// src/server/routers/itemRouter.ts
import { z } from "zod";
import {
	createPermissionProtectedProcedure,
	PermissionsResolvable
} from "@rivantmedia/trpc-rbac";
import { protectedProcedure, createTRPCRouter } from "@/server/api/trpc";

export const itemRouter = createTRPCRouter({
	// Only users with the “READ” bit can query this:
	listItems: createPermissionProtectedProcedure(
		protectedProcedure,
		"READ" as PermissionsResolvable<"READ" | "WRITE" | "ADMIN">
	)
		.input(z.object({ page: z.number().min(1) }))
		.query(({ ctx, input }) => {
			return ctx.db.item.findMany({
				skip: (input.page - 1) * 10,
				take: 10
			});
		}),

	// Only “ADMIN” can delete an item:
	deleteItem: createPermissionProtectedProcedure(protectedProcedure, "ADMIN")
		.input(z.object({ id: z.string() }))
		.mutation(({ ctx, input }) => {
			return ctx.db.item.delete({ where: { id: input.id } });
		})
});
```

## Putting It All Together

```ts
// src/server/api/root.ts
import { createTRPCRouter } from "../trpc";
import { itemRouter } from "./itemRouter";

export const appRouter = createTRPCRouter({
	items: itemRouter
});

export type AppRouter = typeof appRouter;
```
