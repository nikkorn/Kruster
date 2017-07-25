// Type definitions for Kruster 0.0.5
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
	 * Returns the table body without the DOM and style modifications made by Kruster.
	 */
	getCleanTable(): Element;

	/**
	 * Get an array of all of the table rows excluding placeholders.
	 */
	getRows(): HTMLTableRowElement[];

	/**
	 * Get the row element at the specified index.
	 * @param index The row index.
	 */
	getRowAt(index: number): HTMLTableRowElement;

	/**
	 * Get the index of the specified row element.
	 * @param rowElement The row element.
	 */
	getRowIndex(rowElement: HTMLTableRowElement): number;

	/**
	 * Destroys the instance, reverting the table to its original state.
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