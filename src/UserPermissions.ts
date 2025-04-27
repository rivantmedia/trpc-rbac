import BitField, { BitFieldResolvable } from "./BitField";

/**
 * Base class for permission sets.
 * Consumers must subclass and define their own `static Flags`.
 *
 *   class MyPerms extends UserPermissions<"READ"|"WRITE"> {
 *     static Flags = { READ: 1<<0, WRITE: 1<<1 } as const;
 *   }
 */
export abstract class UserPermissions<
	FLAGS extends string = string
> extends BitField<FLAGS> {
	// must be defined by subclass:
	public static Flags: Record<string, number>;
	public readonly DefaultBit = 0;
}

export type PermissionsResolvable<FLAGS extends string> =
	BitFieldResolvable<FLAGS>;
