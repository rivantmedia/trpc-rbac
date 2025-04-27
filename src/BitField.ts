export default class BitField<FLAGS extends string = string> {
	public bitfield: number;
	public readonly DefaultBit = 0;
	public static Flags: Record<string, number> = {};

	constructor(bits: BitFieldResolvable<FLAGS> = 0) {
		this.bitfield = this.resolve(bits);
	}

	private resolve(bit: BitFieldResolvable<FLAGS>): number {
		if (bit instanceof BitField) return bit.bitfield;
		if (Array.isArray(bit))
			return bit.map((b) => this.resolve(b)).reduce((a, b) => a | b, 0);
		if (typeof bit === "string") {
			const value = (this.constructor as typeof BitField).Flags[bit];
			if (value === undefined) throw new Error(`Invalid flag: ${bit}`);
			return value;
		}
		return bit;
	}

	public has(flag: BitFieldResolvable<FLAGS>): boolean {
		const f = this.resolve(flag);
		return (this.bitfield & f) === f;
	}

	public add(flag: BitFieldResolvable<FLAGS>): void {
		this.bitfield |= this.resolve(flag);
	}

	public remove(flag: BitFieldResolvable<FLAGS>): void {
		this.bitfield &= ~this.resolve(flag);
	}

	public valueOf(): number {
		return this.bitfield;
	}
}

export type BitFieldResolvable<FLAG extends string = string> =
	| number
	| FLAG
	| BitField<FLAG>
	| BitFieldResolvable<FLAG>[];
