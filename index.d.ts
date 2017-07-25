// Type definitions for Kruster 0.0.1
// Project: Kruster
// Definitions by: nikolas howard <https://github.com/nikkorn>

export as namespace Kruster;

export = Kruster;

declare class Kruster
{
	/**
	 * Create a new instance of Kruster and apply modifications to target table body.
	 * @param tableBody the table body.
	 * @param scrollableParent The potentially scrollable parent of the table body.
	 * @param options the optional options.
	 */
	constructor(tableBody: Element, scrollableParent: Element, options?: Kruster.Options);

	/**
	 *  destroys the instance, reverting the table to its original state.
	 */
	destroy(): void;
}

declare namespace Kruster
{
	/**
	 * Options to customize a new instance of Kruster.
	 */
	interface Options
	{
	}
}