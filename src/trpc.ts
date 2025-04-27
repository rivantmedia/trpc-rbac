// src/trpc.ts

import { TRPCError } from "@trpc/server";
import { UserPermissions, PermissionsResolvable } from "./UserPermissions";

/**
 * Wraps any authenticated tRPC procedure builder with a permission check.
 *
 * @template TProcedure  The type of your tRPC procedure builder (e.g. `protectedProcedure`).
 * @template FLAGS       The union of string flag keys your UserPermissions subclass defines.
 *
 * @param protectedProcedure  A tRPC procedure builder that already enforces authentication.
 * @param requiredPermission  A key (or bit-combination) from your Permissions.Flags.
 * @returns A new procedure builder which will throw UNAUTHORIZED if the user lacks that permission.
 */
export function createPermissionProtectedProcedure<
	TProcedure extends { use: (middleware: any) => any },
	FLAGS extends string
>(
	protectedProcedure: TProcedure,
	requiredPermission: PermissionsResolvable<FLAGS>
): ReturnType<TProcedure["use"]> {
	return protectedProcedure.use(
		async ({ ctx, next }: { ctx: any; next: any }) => {
			// The consumer’s context must supply:
			// - getUserPermissions(): Promise<FLAGS[]>
			// - UserPermissions: typeof YourSubclass
			const permKeys = await ctx.getUserPermissions();
			const PermsClass = ctx.UserPermissions as {
				new (bits?: any): UserPermissions<FLAGS>;
			};

			const hasPerm = new PermsClass(permKeys).has(requiredPermission);
			if (!hasPerm) {
				throw new TRPCError({
					code: "UNAUTHORIZED",
					message: "Missing required permission"
				});
			}

			return next();
		}
	);
}
